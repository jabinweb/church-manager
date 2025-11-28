import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { SSEManager } from '@/lib/sse-manager'

// Force Node.js runtime to ensure globalThis singleton works
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      console.log('SSE: Unauthorized connection attempt - no session')
      return new Response('Unauthorized', { status: 401 })
    }

    console.log(`SSE: Starting connection setup for user: ${session.user.id}`)

    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        let heartbeatInterval: NodeJS.Timeout | null = null
        let isConnectionClosed = false
        
        try {
          // Add connection immediately using the global SSE Manager instance
          console.log(`SSE: Adding connection for user: ${session.user.id}`)
          
          // Add connection and verify it was added
          SSEManager.addConnection(session.user.id, controller)
          
          // Verify the connection was actually added
          const connectedUsers = SSEManager.getConnectedUsers()
          console.log(`SSE: Connection verification - User ${session.user.id} in connected users:`, connectedUsers.includes(session.user.id))
          console.log(`SSE: Total active connections after adding: ${SSEManager.getActiveConnections()}`)
          console.log(`SSE: All connected users: [${connectedUsers.join(', ')}]`)

          // Send initial connection message
          const initialMessage = {
            type: 'connection_established',
            data: {
              userId: session.user.id,
              timestamp: new Date().toISOString(),
              connectionId: Math.random().toString(36).substr(2, 9),
              totalConnections: SSEManager.getActiveConnections()
            }
          }
          
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`))
            console.log(`SSE: Initial message sent to user: ${session.user.id}`)
          } catch (error) {
            console.error('SSE: Error sending initial message:', error)
            SSEManager.removeConnection(session.user.id)
            return
          }

          // Set up heartbeat interval
          heartbeatInterval = setInterval(() => {
            if (isConnectionClosed) {
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval)
                heartbeatInterval = null
              }
              return
            }

            try {
              const heartbeat = {
                type: 'heartbeat',
                data: { 
                  timestamp: new Date().toISOString(),
                  userId: session.user.id,
                  activeConnections: SSEManager.getActiveConnections(),
                  connectedUsers: SSEManager.getConnectedUsers()
                }
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`))
              console.log(`SSE: Heartbeat sent to user: ${session.user.id} (${SSEManager.getActiveConnections()} total connections)`)
            } catch (error) {
              console.log(`SSE: Heartbeat failed for user ${session.user.id}, cleaning up`)
              isConnectionClosed = true
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval)
                heartbeatInterval = null
              }
              SSEManager.removeConnection(session.user.id)
            }
          }, 30000) // Every 30 seconds

          // Handle request abort
          request.signal?.addEventListener('abort', () => {
            console.log(`SSE: Request aborted for user: ${session.user.id}`)
            isConnectionClosed = true
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval)
              heartbeatInterval = null
            }
            SSEManager.removeConnection(session.user.id)
          })

        } catch (error) {
          console.error('SSE: Error in start():', error)
          try {
            controller.close()
          } catch (closeError) {
            // Ignore close errors
          }
        }
      },

      cancel() {
        console.log(`SSE: Stream cancelled for user: ${session.user.id}`)
        SSEManager.removeConnection(session.user.id)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('SSE: Fatal error setting up connection:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
