import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { broadcastToUser } from '@/lib/sse-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get unread messages where current user is the receiver
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: id,
        receiverId: session.user.id,
        isRead: false
      }
    })

    if (unreadMessages.length > 0) {
      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          receiverId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      // Broadcast read receipts to message senders
      const senderIds = Array.from(new Set(unreadMessages.map(msg => msg.senderId)))
      senderIds.forEach(senderId => {
        if (senderId !== session.user.id) {
          broadcastToUser(senderId, {
            type: 'messages_read',
            data: {
              conversationId: id,
              readBy: session.user.id,
              messageIds: unreadMessages.filter(msg => msg.senderId === senderId).map(msg => msg.id),
              readAt: new Date().toISOString()
            }
          })
        }
      })
    }

    return NextResponse.json({ success: true, readCount: unreadMessages.length })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}
   