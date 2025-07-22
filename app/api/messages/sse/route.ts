import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { SSEManager } from '@/lib/sse-manager'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.user.id
    const sseManager = SSEManager.getInstance()
    console.log('SSE connection request from user:', userId)

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        console.log('Starting SSE stream for user:', userId)
        
        // Store connection
        sseManager.addConnection(userId, controller)
        
        // Send initial connection message
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          userId,
          timestamp: new Date().toISOString()
        })}\n\n`))

        // Send periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`))
          } catch (error) {
            console.log('Heartbeat failed, cleaning up connection for user:', userId)
            clearInterval(heartbeat)
            sseManager.removeConnection(userId)
          }
        }, 30000) // 30 seconds

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          console.log('SSE connection aborted for user:', userId)
          sseManager.removeConnection(userId)
          clearInterval(heartbeat)
          try {
            controller.close()
          } catch (error) {
            // Controller already closed
          }
        })
      },
      cancel() {
        console.log('SSE stream cancelled for user:', userId)
        sseManager.removeConnection(userId)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error) {
    console.error('SSE connection error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
