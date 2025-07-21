import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToUser } from '@/lib/sse-manager'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content } = await request.json()

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user is participant in this conversation and get the other participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: {
          where: {
            userId: {
              not: session.user.id
            }
          }
        }
      }
    })

    if (!conversation || conversation.participants.length === 0) {
      return NextResponse.json({ error: 'Conversation not found or invalid' }, { status: 404 })
    }

    const receiverId = conversation.participants[0].userId

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        receiverId,
        conversationId,
        isRead: false // Always start as unread
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    const formattedMessage = {
      ...message,
      createdAt: message.createdAt.toISOString()
    }

    console.log('Sending message to receiver:', receiverId)
    
    // Broadcast new message via SSE to the recipient
    const broadcastSuccess = broadcastToUser(receiverId, {
      type: 'new_message',
      data: {
        message: formattedMessage,
        conversationId
      }
    })

    console.log('Broadcast success:', broadcastSuccess)

    return NextResponse.json({ message: formattedMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
