import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
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
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: session.user.id,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform the data
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      participants: conv.participants.map(p => p.user),
      lastMessage: conv.messages[0] || null,
      unreadCount: conv._count.messages,
      updatedAt: conv.updatedAt.toISOString()
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { participantId } = await request.json()

    if (!participantId || participantId === session.user.id) {
      return NextResponse.json({ error: 'Invalid participant' }, { status: 400 })
    }

    // Check if conversation already exists between these two users
    const existingConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          every: {
            userId: {
              in: [session.user.id, participantId]
            }
          }
        }
      },
      include: {
        participants: true,
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    // Filter to only conversations with exactly 2 participants (both users)
    const directConversations = existingConversations.filter(conv => 
      conv._count.participants === 2 &&
      conv.participants.some(p => p.userId === session.user.id) &&
      conv.participants.some(p => p.userId === participantId)
    )

    let conversation

    if (directConversations.length > 0) {
      // Use the first existing conversation
      conversation = directConversations[0]

      // If there are multiple conversations, delete the duplicates
      if (directConversations.length > 1) {
        const duplicateIds = directConversations.slice(1).map(conv => conv.id)
        
        // Delete messages from duplicate conversations first
        await prisma.message.deleteMany({
          where: {
            conversationId: {
              in: duplicateIds
            }
          }
        })

        // Delete participants from duplicate conversations
        await prisma.conversationParticipant.deleteMany({
          where: {
            conversationId: {
              in: duplicateIds
            }
          }
        })

        // Delete the duplicate conversations
        await prisma.conversation.deleteMany({
          where: {
            id: {
              in: duplicateIds
            }
          }
        })
      }
    } else {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: session.user.id },
              { userId: participantId }
            ]
          }
        },
        include: {
          participants: true
        }
      })
    }

    // Fetch the conversation with full details
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
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
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: session.user.id,
                isRead: false
              }
            }
          }
        }
      }
    })

    const formattedConversation = {
      id: fullConversation!.id,
      participants: fullConversation!.participants.map(p => p.user),
      lastMessage: fullConversation!.messages[0] || null,
      unreadCount: fullConversation!._count.messages,
      updatedAt: fullConversation!.updatedAt.toISOString()
    }

    return NextResponse.json({ conversation: formattedConversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
