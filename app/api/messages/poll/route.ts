import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lastMessageId = searchParams.get('lastMessageId')
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Get new messages since the last known message
    const whereClause: any = {
      conversationId,
    }

    if (lastMessageId) {
      whereClause.createdAt = {
        gt: await prisma.message.findUnique({
          where: { id: lastMessageId },
          select: { createdAt: true }
        }).then(msg => msg?.createdAt || new Date(0))
      }
    }

    const newMessages = await prisma.message.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const formattedMessages = newMessages.map(message => ({
      ...message,
      createdAt: message.createdAt.toISOString()
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Error polling messages:', error)
    return NextResponse.json({ error: 'Failed to poll messages' }, { status: 500 })
  }
}
