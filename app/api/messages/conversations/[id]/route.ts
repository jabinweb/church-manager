import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: session.user.id,
            isActive: true
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Fetch messages for the conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Attempting to delete conversation ${id} by user ${session.user.id}`)

    // First verify the conversation exists and user has access
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
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
              select: { id: true, name: true, role: true }
            }
          }
        }
      }
    })

    if (!conversation) {
      console.log(`Conversation ${id} not found or user ${session.user.id} has no access`)
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    const userParticipant = conversation.participants.find(p => p.userId === session.user.id)
    
    // Permission logic based on conversation type
    let canDelete = false
    
    if (conversation.type === 'DIRECT') {
      // For direct conversations, any participant can "delete" (hide) it from their view
      canDelete = true
      console.log(`User ${session.user.id} can delete direct conversation ${id}`)
    } else {
      // For groups/channels/broadcasts - only admins, creators, or system admins can delete
      canDelete = userParticipant?.role === 'ADMIN' || 
                 conversation.createdById === session.user.id ||
                 ['ADMIN', 'PASTOR'].includes(session.user.role as string)
      console.log(`User ${session.user.id} delete permission for ${conversation.type} conversation ${id}: ${canDelete}`)
    }

    if (!canDelete) {
      console.log(`User ${session.user.id} doesn't have permission to delete conversation ${id}`)
      return NextResponse.json({ error: 'Insufficient permissions to delete conversation' }, { status: 403 })
    }

    if (conversation.type === 'DIRECT') {
      // For direct conversations, mark participant as inactive (WhatsApp-like behavior)
      // The conversation and messages remain intact for the other user
      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: session.user.id
          }
        },
        data: {
          isActive: false
        }
      })
      
      console.log(`Marked user ${session.user.id} as inactive in direct conversation ${id}`)
    } else {
      // For groups/channels/broadcasts - soft delete the entire conversation
      await prisma.conversation.update({
        where: { id },
        data: {
          isActive: false,
          isArchived: true
        }
      })

      console.log(`Soft deleted conversation ${id}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
 
