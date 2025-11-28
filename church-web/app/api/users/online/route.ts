import { auth } from '@/auth'
import { SSEManager } from '@/lib/sse-manager'
import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime to ensure globalThis singleton works
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Get all connected users
    const connectedUsers = SSEManager.getConnectedUsers()
    console.log(`Online API: Connected users: [${connectedUsers.join(', ')}], checking for: ${userId || 'all'}`)

    if (userId) {
      // Check if specific user is online
      const isOnline = connectedUsers.includes(userId)
      console.log(`Online API: User ${userId} is ${isOnline ? 'online' : 'offline'}`)
      return NextResponse.json({ userId, isOnline, connectedUsers })
    }

    // Return all online users
    return NextResponse.json({ onlineUsers: connectedUsers, count: connectedUsers.length })
  } catch (error) {
    console.error('Error checking online status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
