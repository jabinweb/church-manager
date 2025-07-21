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

    const { conversationId, isTyping } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Get other participants in the conversation
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: {
          not: session.user.id
        }
      }
    })

    // Broadcast typing indicator to other participants
    participants.forEach(participant => {
      broadcastToUser(participant.userId, {
        type: 'user_typing',
        data: {
          userId: session.user.id,
          conversationId,
          isTyping
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending typing indicator:', error)
    return NextResponse.json({ error: 'Failed to send typing indicator' }, { status: 500 })
  }
}
