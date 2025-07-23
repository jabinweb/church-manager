import { prisma } from '@/lib/prisma'
import { ParticipantRole as PrismaParticipantRole, ConversationType as PrismaConversationType, MessageType as PrismaMessageType } from '@prisma/client'
import type { ConversationSettings, MessageMetadata } from '@/lib/types/messaging'
import { SSEManager } from '@/lib/sse-manager'

export class MessagingService {
  // Create different types of conversations
  static async createDirectConversation(user1Id: string, user2Id: string) {
    // Check if conversation already exists (including inactive ones)
    const existing = await prisma.conversation.findFirst({
      where: {
        type: PrismaConversationType.DIRECT,
        participants: {
          every: {
            userId: { in: [user1Id, user2Id] }
          }
        }
      },
      include: {
        participants: {
          include: { 
            user: {
              select: { id: true, name: true, email: true, image: true, role: true }
            }
          }
        }
      }
    })

    if (existing) {
      console.log(`Direct conversation exists between ${user1Id} and ${user2Id}`)
      
      // Reactivate both participants in case one of them had "deleted" the conversation
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: existing.id,
          userId: { in: [user1Id, user2Id] }
        },
        data: {
          isActive: true
        }
      })

      console.log(`Reactivated participants in conversation ${existing.id}`)
      
      // Return the conversation with updated participants
      const updatedConversation = await prisma.conversation.findUnique({
        where: { id: existing.id },
        include: {
          participants: {
            include: { 
              user: {
                select: { id: true, name: true, email: true, image: true, role: true }
              }
            }
          }
        }
      })
      
      return updatedConversation!
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        type: PrismaConversationType.DIRECT,
        createdById: user1Id,
        participants: {
          create: [
            { userId: user1Id, role: PrismaParticipantRole.MEMBER },
            { userId: user2Id, role: PrismaParticipantRole.MEMBER }
          ]
        }
      },
      include: {
        participants: {
          include: { 
            user: {
              select: { id: true, name: true, email: true, image: true, role: true }
            }
          }
        }
      }
    })

    // Send real-time notification to the other user (receiver) about new conversation
    const success = SSEManager.sendToUser(user2Id, {
      type: 'new_conversation',
      data: {
        conversation: newConversation,
        initiatedBy: newConversation.participants.find(p => p.userId === user1Id)?.user?.name || 'Someone',
        timestamp: new Date().toISOString()
      }
    })
    console.log(`New conversation notification sent to ${user2Id}: ${success}`)

    return newConversation
  }

  static async createGroupConversation(
    creatorId: string,
    name: string,
    description?: string,
    memberIds: string[] = [],
    settings: ConversationSettings = {}
  ) {
    return await prisma.conversation.create({
      data: {
        name,
        description,
        type: PrismaConversationType.GROUP,
        createdById: creatorId,
        settings: settings as any,
        participants: {
          create: [
            { userId: creatorId, role: PrismaParticipantRole.ADMIN },
            ...memberIds.map(userId => ({
              userId,
              role: PrismaParticipantRole.MEMBER
            }))
          ]
        }
      },
      include: {
        participants: {
          include: { user: true }
        }
      }
    })
  }

  static async createBroadcastChannel(
    creatorId: string,
    name: string,
    description?: string,
    settings: ConversationSettings = {}
  ) {
    const defaultSettings: ConversationSettings = {
      onlyAdminsCanPost: true,
      allowReactions: true,
      allowReplies: false,
      ...settings
    }

    // Get all active users to add as read-only participants
    const allUsers = await prisma.user.findMany({
      where: { 
        isActive: true,
        role: { in: ['ADMIN', 'PASTOR', 'STAFF', 'MEMBER'] }
      },
      select: { id: true, name: true, email: true, image: true, role: true }
    })

    console.log(`Creating broadcast channel for ${allUsers.length} users`)

    const conversation = await prisma.conversation.create({
      data: {
        name,
        description,
        type: PrismaConversationType.BROADCAST,
        createdById: creatorId,
        settings: defaultSettings as any,
        participants: {
          create: [
            // Creator as admin
            { userId: creatorId, role: PrismaParticipantRole.ADMIN },
            // All other users as read-only
            ...allUsers
              .filter(user => user.id !== creatorId)
              .map(user => ({
                userId: user.id,
                role: PrismaParticipantRole.READONLY
              }))
          ]
        }
      },
      include: {
        participants: {
          include: { 
            user: {
              select: { id: true, name: true, email: true, image: true, role: true }
            }
          }
        }
      }
    })

    console.log(`Broadcast channel created with ${conversation.participants.length} participants`)

    // Send real-time notification to all users about new broadcast channel
    const creatorUser = allUsers.find(u => u.id === creatorId)
    const creatorName = creatorUser?.name || 'Unknown'

    // Get all participant IDs except creator
    const participantIds = conversation.participants
      .filter(p => p.userId !== creatorId)
      .map(p => p.userId)

    console.log(`Sending broadcast notifications to ${participantIds.length} users`)
    console.log('Active SSE connections:', SSEManager.getConnectedUsers())

    // Send notifications to all participants
    let successCount = 0
    participantIds.forEach(userId => {
      console.log(`Sending broadcast notification to user: ${userId}`)
      const success = SSEManager.sendToUser(userId, {
        type: 'new_broadcast_channel',
        data: {
          conversation,
          creatorName,
          timestamp: new Date().toISOString()
        }
      })
      if (success) successCount++
      console.log(`Notification sent to ${userId}: ${success}`)
    })

    console.log(`Successfully sent notifications to ${successCount}/${participantIds.length} users`)

    return conversation
  }

  // Add members to any conversation type
  static async addParticipants(
    conversationId: string,
    userIds: string[],
    addedById: string,
    role: PrismaParticipantRole = PrismaParticipantRole.MEMBER
  ) {
    // Check if user has permission to add members
    const userRole = await this.getUserRole(conversationId, addedById)
    if (!userRole || (userRole !== PrismaParticipantRole.ADMIN && userRole !== PrismaParticipantRole.MODERATOR)) {
      throw new Error('Insufficient permissions to add members')
    }

    // Add participants
    await prisma.conversationParticipant.createMany({
      data: userIds.map(userId => ({
        conversationId,
        userId,
        role
      })),
      skipDuplicates: true
    })

    // Send system message about new members
    const newMembers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    })

    await this.sendSystemMessage(
      conversationId,
      'join',
      `${newMembers.map(u => u.name).join(', ')} joined the conversation`,
      { systemAction: 'join', affectedUserIds: userIds }
    )
  }

  // Send messages with different types
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: PrismaMessageType = PrismaMessageType.TEXT,
    metadata?: MessageMetadata,
    replyToId?: string
  ) {
    // Check if user can send messages
    const canSend = await this.canUserSendMessage(conversationId, senderId)
    if (!canSend) {
      throw new Error('User cannot send messages to this conversation')
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
        metadata: metadata as any,
        replyToId
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        },
        conversation: {
          include: {
            participants: {
              select: { userId: true }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Send real-time message to all participants (except sender)
    const otherParticipants = message.conversation.participants
      .filter(p => p.userId !== senderId)
      .map(p => p.userId)

    // Send message notification to each participant
    let successCount = 0
    otherParticipants.forEach(userId => {
      console.log(`Attempting to send message to user: ${userId}`)
      const success = SSEManager.sendToUser(userId, {
        type: 'new_message',
        data: { 
          message: {
            ...message,
            conversation: undefined // Remove circular reference
          }
        }
      })
      if (success) {
        successCount++
        console.log(`Message notification sent successfully to user: ${userId}`)
      } else {
        console.log(`Failed to send message notification to user: ${userId}`)
      }
    })

    console.log(`Message notifications sent successfully to ${successCount}/${otherParticipants.length} participants`)

    // For broadcast messages, send special notification with channel info
    if (message.conversation.type === 'BROADCAST') {
      const broadcastConversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { name: true, type: true }
      })

      otherParticipants.forEach(userId => {
        SSEManager.sendToUser(userId, {
          type: 'new_broadcast_message',
          data: {
            message: {
              ...message,
              conversation: undefined
            },
            channelName: broadcastConversation?.name || 'Broadcast Channel',
            timestamp: new Date().toISOString()
          }
        })
      })

      console.log(`Broadcast message notifications sent to ${otherParticipants.length} participants`)
    }

    return message
  }

  // System messages for conversation events
  static async sendSystemMessage(
    conversationId: string,
    action: string,
    content: string,
    metadata?: MessageMetadata
  ) {
    return await prisma.message.create({
      data: {
        conversationId,
        content,
        type: PrismaMessageType.SYSTEM,
        metadata: metadata as any
      }
    })
  }

  // Message reactions
  static async toggleReaction(messageId: string, userId: string, emoji: string) {
    // Check if user has any existing reaction on this message
    const existing = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId
      }
    })

    if (existing) {
      if (existing.emoji === emoji) {
        // Same emoji - remove the reaction
        await prisma.messageReaction.delete({
          where: { id: existing.id }
        })
        return { action: 'removed' }
      } else {
        // Different emoji - update the existing reaction
        await prisma.messageReaction.update({
          where: { id: existing.id },
          data: { emoji }
        })
        return { action: 'changed' }
      }
    } else {
      // No existing reaction - create new one
      await prisma.messageReaction.create({
        data: { messageId, userId, emoji }
      })
      return { action: 'added' }
    }
  }

  // Permission checks
  static async getUserRole(conversationId: string, userId: string): Promise<PrismaParticipantRole | null> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    })
    return participant?.role || null
  }

  static async canUserSendMessage(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId }
        }
      }
    })

    if (!conversation || conversation.participants.length === 0) {
      return false
    }

    const participant = conversation.participants[0]
    const settings = conversation.settings as ConversationSettings

    // Check if user is muted
    if (participant.role === PrismaParticipantRole.MUTED) {
      return false
    }

    // For broadcasts, check if only admins can post
    if (conversation.type === PrismaConversationType.BROADCAST) {
      if (settings.onlyAdminsCanPost) {
        return (participant.role === PrismaParticipantRole.ADMIN || participant.role === PrismaParticipantRole.MODERATOR)
      }
    }

    return participant.isActive
  }

  // Get conversations for a user with unread counts
  static async getUserConversations(userId: string) {
    console.log(`Getting conversations for user: ${userId}`)

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            isActive: true // Only show conversations where user is active participant
          }
        },
        isActive: true
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, role: true, email: true }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, name: true, image: true, role: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    console.log(`Raw conversations found: ${conversations.length}`)
    
    // Log each conversation type with more detail
    conversations.forEach(conv => {
      console.log(`Conversation: ${conv.id}, Type: ${conv.type}, Name: ${conv.name}, Participants: ${conv.participants.length}`)
      
      const userParticipant = conv.participants.find(p => p.userId === userId)
      console.log(`User ${userId} participant status:`, userParticipant ? `Role: ${userParticipant.role}, Active: ${userParticipant.isActive}` : 'NOT FOUND')
      
      // Log conversation type specifically for broadcasts
      if (conv.type === 'BROADCAST') {
        console.log(`BROADCAST conversation found: ${conv.name} with ${conv.participants.length} participants`)
      }
    })

    // Calculate unread counts
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find(p => p.userId === userId)
        const lastReadAt = participant?.lastReadAt || new Date(0)
        
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: userId }
          }
        })

        const result = {
          ...conv,
          lastMessage: conv.messages[0] || null,
          unreadCount
        }

        // Log broadcast conversations with unread counts
        if (conv.type === 'BROADCAST' && unreadCount > 0) {
          console.log(`BROADCAST ${conv.name} has ${unreadCount} unread messages for user ${userId}`)
        }

        return result
      })
    )

    console.log(`Returning ${conversationsWithUnread.length} conversations with unread counts`)
    
    // Log summary by type
    const summary = conversationsWithUnread.reduce((acc, conv) => {
      const type = conv.type || 'UNKNOWN'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Conversation summary by type:', summary)
    
    return conversationsWithUnread
  }

  // Mark messages as read - enhanced to properly track read status
  static async markAsRead(conversationId: string, userId: string, messageId?: string) {
    // Update participant's last read timestamp
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    })

    // Mark all unread messages in the conversation as read by this user
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId }, // Don't mark own messages as read
        NOT: {
          readBy: {
            has: userId
          }
        }
      }
    })

    // Update each unread message to include this user in readBy array
    for (const message of unreadMessages) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          readBy: {
            set: [...message.readBy, userId]
          }
        }
      })
    }

    // Send read receipt notification to other participants
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: { not: userId } },
          select: { userId: true }
        }
      }
    })

    if (conversation) {
      const sseManager = SSEManager
      conversation.participants.forEach(participant => {
        sseManager.sendToUser(participant.userId, {
          type: 'messages_read',
          data: {
            conversationId,
            readByUserId: userId,
            timestamp: new Date().toISOString()
          }
        })
      })
    }
  }
}

