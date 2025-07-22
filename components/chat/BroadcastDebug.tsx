'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

interface DebugInfo {
  userId: string
  conversations: any[]
  broadcastConversations: any[]
  sseConnected: boolean
  lastSSEMessage: any
  connectedUsers: string[]
  totalConnections: number
}

export function BroadcastDebug() {
  const { data: session } = useSession()
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    userId: '',
    conversations: [],
    broadcastConversations: [],
    sseConnected: false,
    lastSSEMessage: null,
    connectedUsers: [],
    totalConnections: 0
  })

  useEffect(() => {
    if (session?.user?.id) {
      setDebugInfo(prev => ({ ...prev, userId: session.user.id }))
    }
  }, [session])

  useEffect(() => {
    // Listen to all SSE events
    const handleSSEMessage = (event: CustomEvent) => {
      console.log('Debug: SSE Message received:', event.detail)
      setDebugInfo(prev => ({ 
        ...prev, 
        sseConnected: true,
        lastSSEMessage: {
          ...event.detail,
          timestamp: new Date().toISOString()
        }
      }))
    }

    const handleBroadcastChannel = (event: CustomEvent) => {
      console.log('Debug: Broadcast channel event:', event.detail)
    }

    const handleBroadcastMessage = (event: CustomEvent) => {
      console.log('Debug: Broadcast message event:', event.detail)
    }

    window.addEventListener('sseMessage', handleSSEMessage as EventListener)
    window.addEventListener('newBroadcastChannel', handleBroadcastChannel as EventListener)
    window.addEventListener('newBroadcastMessage', handleBroadcastMessage as EventListener)
    
    return () => {
      window.removeEventListener('sseMessage', handleSSEMessage as EventListener)
      window.removeEventListener('newBroadcastChannel', handleBroadcastChannel as EventListener)
      window.removeEventListener('newBroadcastMessage', handleBroadcastMessage as EventListener)
    }
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        const conversations = data.conversations || []
        const broadcastConversations = conversations.filter((c: any) => c.type === 'BROADCAST')
        
        setDebugInfo(prev => ({
          ...prev,
          conversations,
          broadcastConversations
        }))
      }
    } catch (error) {
      console.error('Debug: Error fetching conversations:', error)
    }
  }

  const checkSSEStatus = async () => {
    try {
      const response = await fetch('/api/messages/sse/status')
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(prev => ({
          ...prev,
          connectedUsers: data.connectedUsers || [],
          totalConnections: data.totalConnections || 0
        }))
      }
    } catch (error) {
      console.error('Debug: Error checking SSE status:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations()
      checkSSEStatus()
      
      // Check every 10 seconds
      const interval = setInterval(() => {
        checkSSEStatus()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [session?.user?.id])

  return (
    <Card className="mt-4 bg-red-50 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-700">Broadcast Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <p><strong>User ID:</strong> {debugInfo.userId}</p>
          <p><strong>SSE Connected:</strong> {debugInfo.sseConnected ? '✅' : '❌'}</p>
          <p><strong>Total SSE Connections:</strong> {debugInfo.totalConnections}</p>
          <p><strong>Connected Users:</strong> {debugInfo.connectedUsers.length}</p>
          <p><strong>User Connected:</strong> {debugInfo.connectedUsers.includes(debugInfo.userId) ? '✅' : '❌'}</p>
          <p><strong>Total Conversations:</strong> {debugInfo.conversations.length}</p>
          <p><strong>Broadcast Conversations:</strong> {debugInfo.broadcastConversations.length}</p>
          
          {debugInfo.broadcastConversations.length > 0 && (
            <div>
              <p><strong>Broadcast Channels:</strong></p>
              <ul className="ml-4">
                {debugInfo.broadcastConversations.map((conv: any) => (
                  <li key={conv.id}>
                    {conv.name} (ID: {conv.id.slice(-8)}, Participants: {conv.participants?.length || 0})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {debugInfo.lastSSEMessage && (
            <div>
              <p><strong>Last SSE Message ({debugInfo.lastSSEMessage.timestamp}):</strong></p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(debugInfo.lastSSEMessage, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button onClick={fetchConversations} size="sm">
              Refresh Conversations
            </Button>
            <Button onClick={checkSSEStatus} size="sm" variant="outline">
              Check SSE Status
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
