import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let duplicatesRemoved = 0

    // Get all conversations with their participants
    const conversations = await prisma.conversation.findMany({
      include: {
        participants: true,
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    // Group conversations by participant pairs using object instead of Map
    const conversationGroups: Record<string, string[]> = {}

    for (const conv of conversations) {
      if (conv._count.participants === 2) {
        const participantIds = conv.participants
          .map(p => p.userId)
          .sort()
          .join('-')
        
        if (!conversationGroups[participantIds]) {
          conversationGroups[participantIds] = []
        }
        conversationGroups[participantIds].push(conv.id)
      }
    }

    // Remove duplicates
    for (const participantPair of Object.keys(conversationGroups)) {
      const convIds = conversationGroups[participantPair]
      if (convIds.length > 1) {
        // Keep the first conversation, delete the rest
        const duplicateIds = convIds.slice(1)
        
        // Delete messages from duplicate conversations
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

        duplicatesRemoved += duplicateIds.length
      }
    }

    return NextResponse.json({ 
      success: true, 
      duplicatesRemoved,
      message: `Removed ${duplicatesRemoved} duplicate conversations`
    })
  } catch (error) {
    console.error('Error cleaning up conversations:', error)
    return NextResponse.json({ error: 'Failed to cleanup conversations' }, { status: 500 })
  }
}
