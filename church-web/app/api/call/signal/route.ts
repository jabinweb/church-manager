import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { SSEManager } from '@/lib/sse-manager'
import type { CallSignal } from '@/lib/types/call'

// Force Node.js runtime to ensure globalThis singleton works
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const signal: CallSignal = await request.json()
    
    if (!signal.type || !signal.callId || !signal.caller || !signal.receiver) {
      return NextResponse.json({ error: 'Invalid signal data' }, { status: 400 })
    }

    console.log('Call signal received:', signal.type, 'from', signal.caller.name, 'to', signal.receiver.name)

    // Determine who to send the signal to
    let targetUserId: string

    switch (signal.type) {
      case 'call_incoming':
        // Send to the receiver
        targetUserId = signal.receiver.id
        break
      case 'call_accepted':
      case 'call_rejected':
        // Send to the caller
        targetUserId = signal.caller.id
        break
      case 'call_ended':
      case 'call_failed':
        // Send to the other party
        targetUserId = session.user.id === signal.caller.id 
          ? signal.receiver.id 
          : signal.caller.id
        break
      default:
        return NextResponse.json({ error: 'Unknown signal type' }, { status: 400 })
    }

    // Send signal via SSE
    const sent = SSEManager.sendToUser(targetUserId, {
      type: signal.type,
      data: {
        ...signal,
        timestamp: new Date().toISOString()
      }
    })

    if (sent) {
      console.log('Call signal sent successfully to:', targetUserId)
      return NextResponse.json({ success: true })
    } else {
      console.log('User not connected:', targetUserId)
      return NextResponse.json({ 
        success: false, 
        error: 'User is not online' 
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Error sending call signal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
