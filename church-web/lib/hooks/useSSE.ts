'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useSSE() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!session?.user?.id || eventSourceRef.current) {
      console.log('SSE Hook: Cannot connect - no session or already connected')
      return
    }

    console.log('SSE Hook: Connecting for user:', session.user.id)
    
    try {
      const eventSource = new EventSource('/api/messages/sse', {
        withCredentials: true // Ensure credentials are sent
      })
      eventSourceRef.current = eventSource

      eventSource.onopen = (event) => {
        console.log('SSE Hook: Connection opened successfully for user:', session.user.id, event)
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE Hook: Message received:', data.type, 'for user:', session.user.id)
          
          // Handle connection test messages
          if (data.type === 'connection_test') {
            console.log('SSE Hook: Connection test received - connection is working')
            return
          }
          
          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent('sseMessage', {
            detail: data
          }))
        } catch (error) {
          console.error('SSE Hook: Error parsing message data:', error, event.data)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE Hook: Connection error for user:', session.user.id, error)
        console.log('SSE Hook: EventSource readyState:', eventSource.readyState)
        setIsConnected(false)
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE Hook: Connection closed, will attempt to reconnect for user:', session.user.id)
          eventSourceRef.current = null
          
          if (reconnectAttempts.current < maxReconnectAttempts) {
            // Exponential backoff reconnection
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
            reconnectAttempts.current++
            
            console.log(`SSE Hook: Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts}) for user: ${session.user.id}`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, delay)
          } else {
            console.error('SSE Hook: Max reconnection attempts reached for user:', session.user.id)
          }
        }
      }
    } catch (error) {
      console.error('SSE Hook: Failed to create EventSource for user:', session.user.id, error)
      setIsConnected(false)
    }
  }, [session?.user?.id])

  const disconnect = useCallback(() => {
    console.log('SSE: Disconnecting...')
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      console.log('SSE: Session available, connecting...')
      connect()
    } else {
      console.log('SSE: No session, disconnecting...')
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id, connect, disconnect])

  // Reconnect on window focus if disconnected
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.id && !eventSourceRef.current) {
        console.log('SSE: Window focused, reconnecting...')
        connect()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user?.id && !eventSourceRef.current) {
        console.log('SSE: Page visible, reconnecting...')
        connect()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.user?.id, connect])

  return { isConnected }
}

