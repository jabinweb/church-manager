import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { SSEManager } from '@/lib/sse-manager'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, isTyping } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    console.log(`Typing API: ${isTyping ? 'Start' : 'Stop'} typing for user ${session.user.id} in conversation ${conversationId}`)

    // Verify user is participant in conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id
        }
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: session.user.id } },
              select: { userId: true }
            }
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 })
    }

    // Send typing indicator to other participants
    const otherParticipants = participant.conversation.participants.map(p => p.userId)

    const typingData = {
      type: isTyping ? 'typing_start' : 'typing_stop',
      data: {
        userId: session.user.id,
        conversationId,
        timestamp: new Date().toISOString()
      }
    }

    let successCount = 0
    otherParticipants.forEach(userId => {
      console.log(`Typing API: Attempting to send to user: ${userId}`)
      const success = SSEManager.sendToUser(userId, typingData)
      if (success) {
        successCount++
        console.log(`Typing API: Successfully sent typing indicator to user: ${userId}`)
      } else {
        console.log(`Typing API: Failed to send typing indicator to user: ${userId}`)
      }
    })

    console.log(`Typing API: Typing indicator sent to ${successCount}/${otherParticipants.length} participants`)

    return NextResponse.json({ 
      success: true,
      sentTo: successCount,
      totalParticipants: otherParticipants.length
    })
  } catch (error) {
    console.error('Typing API: Error handling typing indicator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
