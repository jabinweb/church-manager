import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SSEManager } from '@/lib/sse-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emoji } = await request.json()
    const { id: messageId } = await params

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 })
    }

    // Check if user has any existing reaction on this message
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id
      }
    })

    let action: 'added' | 'changed' | 'removed'

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Same emoji - remove the reaction
        await prisma.messageReaction.delete({
          where: { id: existingReaction.id }
        })
        action = 'removed'
      } else {
        // Different emoji - update the existing reaction
        await prisma.messageReaction.update({
          where: { id: existingReaction.id },
          data: { emoji }
        })
        action = 'changed'
      }
    } else {
      // No existing reaction - create new one
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji
        }
      })
      action = 'added'
    }

    // Get updated reactions for the message
    const updatedReactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get message details for real-time updates
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              select: { userId: true }
            }
          }
        }
      }
    })

    if (message) {
      // Send real-time reaction update to other participants
      const otherParticipants = message.conversation.participants
        .filter(p => p.userId !== session.user.id)
        .map(p => p.userId)

      otherParticipants.forEach(userId => {
        SSEManager.sendToUser(userId, {
          type: 'message_reaction',
          data: {
            messageId,
            reactions: updatedReactions,
            action,
            emoji,
            userId: session.user.id,
            userName: session.user.name
          }
        })
      })
    }

    return NextResponse.json({
      action,
      reactions: updatedReactions
    })
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 })
  }
}
