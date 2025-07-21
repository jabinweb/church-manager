import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
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

    const formattedMessages = messages.map(message => ({
      ...message,
      createdAt: message.createdAt.toISOString()
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
