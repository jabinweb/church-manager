'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface SSEMessage {
  type: 'connected' | 'heartbeat' | 'new_message' | 'messages_read' | 'user_typing'
  data?: any
  userId?: string
  timestamp?: string
}

export function useSSE() {
  const { data: session } = useSession()
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!session?.user?.id || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    try {
      console.log('Connecting to SSE for user:', session.user.id)
      const eventSource = new EventSource('/api/messages/sse')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE connected successfully')
        setIsConnected(true)
        setReconnectAttempts(0)
      }

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data)
          console.log('SSE message received:', message)
          
          if (message.type === 'heartbeat') {
            return
          }

          // Dispatch custom event for other components to listen
          window.dispatchEvent(new CustomEvent('sseMessage', { detail: message }))
        } catch (error) {
          console.error('Error parsing SSE message:', error, event.data)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        setIsConnected(false)
        eventSource.close()

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          console.log(`Reconnecting in ${timeout}ms (attempt ${reconnectAttempts + 1})`)
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, timeout)
        } else {
          console.log('Max reconnection attempts reached')
        }
      }

    } catch (error) {
      console.error('Error creating SSE connection:', error)
      setIsConnected(false)
    }
  }, [session?.user?.id, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (eventSourceRef.current) {
      console.log('Disconnecting SSE')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      console.log('Session found, connecting to SSE')
      connect()
    } else {
      console.log('No session, disconnecting SSE')
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id, connect, disconnect])

  return {
    isConnected,
    connect,
    disconnect,
    reconnectAttempts
  }
}
