'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSSE } from './useSSE'
import type { Conversation, Message } from '@/lib/types/messaging'

export function useRealTimeMessages(userId?: string) {
  const { isConnected } = useSSE()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  const handleNewMessage = useCallback((message: Message) => {
    console.log('Real-time: New message received:', message)
    
    // Add message to current conversation if it matches
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id)
      if (exists) {
        console.log('Message already exists, skipping')
        return prev
      }
      
      console.log('Adding new message to messages array')
      const newMessages = [...prev, message]
      
      // Trigger notification events for new message
      const isReceived = message.senderId !== userId
      const isSent = message.senderId === userId
      
      console.log('Dispatching notification events:', { isReceived, isSent, userId })
      
      setTimeout(() => {
        // Dispatch both events to ensure compatibility
        window.dispatchEvent(new CustomEvent('newMessageReceived', { 
          detail: { 
            message, 
            isReceived,
            isSent
          } 
        }))
        
        // Also dispatch raw SSE message event
        window.dispatchEvent(new CustomEvent('sseMessage', {
          detail: {
            type: 'new_message',
            data: { message }
          }
        }))
        
        console.log('Notification events dispatched')
      }, 100)
      
      return newMessages
    })

    // Update conversations list
    setConversations(prev => prev.map(conv => {
      if (conv.id === message.conversationId) {
        console.log('Updating conversation with new message')
        return {
          ...conv,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: message.senderId !== userId ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0
        }
      }
      return conv
    }))
  }, [userId])

  const handleMessagesRead = useCallback((data: { 
    conversationId: string
    readBy: string
    messageIds: string[]
    readAt: string 
  }) => {
    console.log('Real-time: Messages read receipt:', data)
    
    // Update message read status
    setMessages(prev => prev.map(msg => {
      if (data.messageIds.includes(msg.id)) {
        console.log(`Marking message ${msg.id} as read`)
        // Update the readBy array to include the user who read it
        const updatedReadBy = [...(msg.readBy || []), data.readBy].filter((id, index, arr) => arr.indexOf(id) === index)
        return { ...msg, readBy: updatedReadBy }
      }
      return msg
    }))
  }, [])

  const handleUserTyping = useCallback((data: { 
    userId: string
    conversationId: string
    isTyping: boolean 
  }) => {
    console.log('Real-time: User typing:', data)
    
    setTypingUsers(prev => {
      const newSet = new Set(prev)
      if (data.isTyping) {
        newSet.add(data.userId)
      } else {
        newSet.delete(data.userId)
      }
      
      // Trigger scroll event for typing indicator (with delay)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('typingStatusChanged', { 
          detail: { userId: data.userId, isTyping: data.isTyping, conversationId: data.conversationId } 
        }))
      }, 150)
      
      return newSet
    })

    // Clear typing after 3 seconds
    if (data.isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }, 3000)
    }
  }, [])

  const handleNewBroadcastChannel = useCallback((data: {
    conversation: Conversation
    creatorName: string
    timestamp: string
  }) => {
    console.log('Real-time: New broadcast channel created:', data)
    
    // Add the new broadcast channel to conversations
    setConversations((prev: Conversation[]) => {
      // Check if conversation already exists
      const exists = prev.some(conv => conv.id === data.conversation.id)
      if (exists) {
        console.log('Broadcast channel already exists, skipping')
        return prev
      }
      
      console.log('Adding new broadcast channel to conversations list')
      return [data.conversation, ...prev]
    })

    // Show notification about new broadcast channel
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('newBroadcastChannel', {
        detail: data
      }))
    }, 100)
  }, [])

  const handleNewBroadcastMessage = useCallback((data: {
    message: Message
    channelName: string
    timestamp: string
  }) => {
    console.log('Real-time: New broadcast message:', data)
    
    // Handle like regular message but with special broadcast notification
    handleNewMessage(data.message)
    
    // Dispatch special broadcast message event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('newBroadcastMessage', {
        detail: data
      }))
    }, 100)
  }, [handleNewMessage])

  const handleNewConversation = useCallback((data: {
    conversation: Conversation
    initiatedBy: string
    timestamp: string
  }) => {
    console.log('Real-time: New conversation created:', data)
    
    // Add the new conversation to the list
    setConversations((prev: Conversation[]) => {
      // Check if conversation already exists
      const exists = prev.some(conv => conv.id === data.conversation.id)
      if (exists) {
        console.log('Conversation already exists, skipping')
        return prev
      }
      
      console.log('Adding new conversation to list')
      return [data.conversation, ...prev]
    })

    // Show notification about new conversation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('newConversation', {
        detail: data
      }))
    }, 100)
  }, [])

  const handleConversationUpdated = useCallback((data: {
    conversation: Conversation
    timestamp: string
  }) => {
    console.log('Real-time: Conversation updated:', data)
    
    setConversations((prev: Conversation[]) => {
      const existingIndex = prev.findIndex(conv => conv.id === data.conversation.id)
      
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev]
        updated[existingIndex] = data.conversation
        // Move to top if it has new messages
        if (data.conversation.lastMessage) {
          const [updatedConv] = updated.splice(existingIndex, 1)
          return [updatedConv, ...updated]
        }
        return updated
      } else {
        // Add new conversation
        return [data.conversation, ...prev]
      }
    })
  }, [])

  useEffect(() => {
    const handleSSEMessage = (event: CustomEvent) => {
      const { type, data } = event.detail
      console.log('SSE Message received in hook:', type, data)

      switch (type) {
        case 'new_message':
          if (data && data.message) {
            console.log('Processing new_message in hook:', data.message)
            handleNewMessage(data.message)
          }
          break
        case 'new_conversation':
          if (data) {
            console.log('Processing new_conversation in hook:', data)
            handleNewConversation(data)
          }
          break
        case 'conversation_updated':
          if (data) {
            console.log('Processing conversation_updated in hook:', data)
            handleConversationUpdated(data)
          }
          break
        case 'new_broadcast_channel':
          if (data) {
            console.log('Processing new_broadcast_channel in hook:', data)
            handleNewBroadcastChannel(data)
          }
          break
        case 'new_broadcast_message':
          if (data) {
            console.log('Processing new_broadcast_message in hook:', data)
            handleNewBroadcastMessage(data)
          }
          break
        case 'messages_read':
          if (data) {
            handleMessagesRead(data)
          }
          break
        case 'user_typing':
          if (data) {
            handleUserTyping(data)
          }
          break
        case 'connected':
          console.log('SSE connected for user:', data?.userId)
          break
        case 'heartbeat':
          // Just log heartbeat, don't process
          console.log('SSE heartbeat received')
          break
        default:
          console.log('Unknown SSE message type:', type)
      }
    }

    console.log('Adding SSE message listener in hook')
    window.addEventListener('sseMessage', handleSSEMessage as EventListener)
    
    return () => {
      console.log('Removing SSE message listener in hook')
      window.removeEventListener('sseMessage', handleSSEMessage as EventListener)
    }
  }, [handleNewMessage, handleMessagesRead, handleUserTyping, handleNewBroadcastChannel, handleNewBroadcastMessage, handleNewConversation, handleConversationUpdated])

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId) {
      console.warn('Cannot mark messages as read: no userId provided')
      return
    }

    try {
      console.log('Marking messages as read for conversation:', conversationId)
      const response = await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Messages marked as read:', data)
        
        // Update local messages to mark them as read immediately
        setMessages(prev => prev.map(msg => {
          if (msg.conversationId === conversationId && msg.senderId !== userId) {
            // Add userId to readBy array if not already there
            const currentReadBy = msg.readBy || []
            const updatedReadBy = currentReadBy.includes(userId) 
              ? currentReadBy 
              : [...currentReadBy, userId]
            return { ...msg, readBy: updatedReadBy }
          }
          return msg
        }))

        // Update conversation unread count
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        ))
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [userId])

  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          isTyping
        })
      })
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  }, [])

  return {
    conversations,
    setConversations,
    messages,
    setMessages,
    typingUsers,
    isConnected,
    markAsRead,
    sendTypingIndicator
  }
}
