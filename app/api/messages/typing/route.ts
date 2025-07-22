import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { SSEManager } from '@/lib/sse-manager'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, isTyping } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    // Broadcast typing indicator to all participants in the conversation
    const sseManager = SSEManager.getInstance()
    
    // Get conversation participants to determine who to notify
    const { prisma } = await import('@/lib/prisma')
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { userId: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => p.userId === session.user?.id)
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 })
    }

    // Broadcast typing status to all other participants
    const otherParticipants = conversation.participants
      .filter(p => p.userId !== session.user?.id)
      .map(p => p.userId)

    otherParticipants.forEach(userId => {
      sseManager.sendToUser(userId, {
        type: 'user_typing',
        data: {
          userId: session.user?.id,
          conversationId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling typing indicator:', error)
    return NextResponse.json({ error: 'Failed to handle typing indicator' }, { status: 500 })
  }
}
