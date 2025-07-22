'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

export function useSSE() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  const connect = () => {
    if (!session?.user?.id || eventSourceRef.current) return

    console.log('Connecting to SSE for user:', session.user.id)
    
    const eventSource = new EventSource('/api/messages/sse')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setIsConnected(true)
      reconnectAttempts.current = 0
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE data received:', data)
        
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('sseMessage', {
          detail: data
        }))
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setIsConnected(false)
      
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE connection closed, attempting to reconnect...')
        eventSourceRef.current = null
        
        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (eventSourceRef.current) {
      console.log('Disconnecting SSE')
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id])

  // Reconnect on window focus if disconnected
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.id && !eventSourceRef.current) {
        console.log('Window focused, reconnecting SSE...')
        connect()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [session?.user?.id])

  return { isConnected }
}
    
