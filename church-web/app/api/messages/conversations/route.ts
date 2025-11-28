import { auth } from '@/auth'
import { MessagingService } from '@/lib/services/messaging'
import { SSEManager } from '@/lib/sse-manager'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Fetching conversations for user: ${session.user.id}`)

    const conversations = await MessagingService.getUserConversations(session.user.id)

    console.log(`Found ${conversations.length} conversations for user ${session.user.id}`)
    
    // Log broadcast conversations specifically
    const broadcastConversations = conversations.filter(c => c.type === 'BROADCAST')
    console.log(`Found ${broadcastConversations.length} broadcast conversations:`, 
      broadcastConversations.map(c => ({ id: c.id, name: c.name, participantCount: c.participants?.length }))
    )

    // Filter conversations to only show those where user is an active participant
    // This automatically handles the "deleted" conversations for direct messages
    const activeConversations = conversations.filter(conv => {
      const userParticipant = conv.participants.find(p => p.userId === session.user.id)
      return userParticipant?.isActive !== false
    })
    
    console.log(`Returning ${activeConversations.length} active conversations`)

    // Ensure the returned conversations match our unified type structure
    const formattedConversations = activeConversations.map(conv => ({
      ...conv,
      type: conv.type || 'DIRECT',
      isActive: conv.isActive ?? true,
      isArchived: conv.isArchived ?? false,
      createdAt: conv.createdAt || new Date().toISOString(),
      updatedAt: conv.updatedAt || new Date().toISOString(),
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, participantIds, name, description, settings } = await request.json()

    let conversation

    switch (type) {
      case 'DIRECT':
        if (!participantIds || participantIds.length !== 1) {
          return NextResponse.json({ error: 'Direct conversations require exactly one participant' }, { status: 400 })
        }
        conversation = await MessagingService.createDirectConversation(session.user.id, participantIds[0])
        break

      case 'GROUP':
        if (!name) {
          return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
        }
        conversation = await MessagingService.createGroupConversation(
          session.user.id,
          name,
          description,
          participantIds || [],
          settings || {}
        )
        break

      case 'BROADCAST':
        if (!name) {
          return NextResponse.json({ error: 'Broadcast channel name is required' }, { status: 400 })
        }
        // Only admins/pastors can create broadcast channels
        if (!['ADMIN', 'PASTOR'].includes(session.user.role as string)) {
          return NextResponse.json({ error: 'Insufficient permissions to create broadcast channel' }, { status: 403 })
        }
        conversation = await MessagingService.createBroadcastChannel(
          session.user.id,
          name,
          description,
          settings || {}
        )
        break

      default:
        return NextResponse.json({ error: 'Invalid conversation type' }, { status: 400 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
