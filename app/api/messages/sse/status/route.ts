import { NextResponse } from 'next/server'
import { SSEManager } from '@/lib/sse-manager'

export async function GET() {
  try {
    const sseManager = SSEManager.getInstance()
    
    return NextResponse.json({
      totalConnections: sseManager.getActiveConnections(),
      connectedUsers: sseManager.getConnectedUsers(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting SSE status:', error)
    return NextResponse.json({ error: 'Failed to get SSE status' }, { status: 500 })
  }
}
