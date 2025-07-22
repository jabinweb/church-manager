import { auth } from '@/auth'
import { MessagingService } from '@/lib/services/messaging'
import { SSEManager } from '@/lib/sse-manager'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await MessagingService.markAsRead(id, session.user.id)

    // Broadcast read receipt to other participants
    const sseManager = SSEManager.getInstance()
    const { prisma } = await import('@/lib/prisma')
    
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          select: { userId: true }
        },
        messages: {
          where: {
            senderId: { not: session.user.id }
          },
          select: { id: true }
        }
      }
    })

    if (conversation) {
      const otherParticipants = conversation.participants
        .filter(p => p.userId !== session.user?.id)
        .map(p => p.userId)

      const messageIds = conversation.messages.map(m => m.id)

      otherParticipants.forEach(userId => {
        sseManager.sendToUser(userId, {
          type: 'messages_read',
          data: {
            conversationId: id,
            readBy: session.user?.id,
            messageIds,
            readAt: new Date().toISOString()
          }
        })
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}

