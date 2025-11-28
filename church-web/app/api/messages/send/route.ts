import { auth } from '@/auth'
import { MessagingService } from '@/lib/services/messaging'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content, replyToId } = await request.json()

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // The MessagingService.sendMessage now handles all real-time notifications
    const message = await MessagingService.sendMessage(
      conversationId,
      session.user.id,
      content.trim(),
      'TEXT',
      undefined,
      replyToId
    )

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
          