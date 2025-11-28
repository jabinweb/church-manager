import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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

    // Check if the message exists and belongs to the user
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, image: true }
                }
              }
            }
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 })
    }

    // Delete the message
    await prisma.message.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Message delete error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    const body = await request.json()
    const { content } = body
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Check if the message exists and belongs to the user
    const existingMessage = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, image: true }
                }
              }
            }
          }
        }
      }
    })

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (existingMessage.senderId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 })
    }

    // Check if message is older than 5 minutes (optional restriction)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (existingMessage.createdAt < fiveMinutesAgo) {
      return NextResponse.json({ error: 'Messages can only be edited within 5 minutes of sending' }, { status: 400 })
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        },
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, image: true }
                }
              }
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

    return NextResponse.json({ 
      message: updatedMessage,
      success: true 
    })
  } catch (error) {
    console.error('Message update error:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}
