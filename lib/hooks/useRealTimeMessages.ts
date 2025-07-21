'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSSE } from './useSSE'

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  conversationId: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    image: string | null
  }
  receiver: {
    id: string
    name: string | null
    image: string | null
  }
}

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string | null
    image: string | null
  }>
  lastMessage: Message | null
  unreadCount: number
  updatedAt: string
}

export function useRealTimeMessages(userId?: string) {
  const { isConnected } = useSSE()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  const handleNewMessage = useCallback((message: Message) => {
    console.log('Real-time: New message received:', message)
    
    // Add message to current conversation
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id)
      if (exists) {
        console.log('Message already exists, skipping')
        return prev
      }
      
      console.log('Adding new message to messages array')
      const newMessages = [...prev, message]
      
      // Trigger scroll event for new message
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('newMessageReceived', { 
          detail: { message, isReceived: message.receiverId === userId } 
        }))
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
          unreadCount: message.receiverId === userId ? conv.unreadCount + 1 : conv.unreadCount
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
    
    // Update message read status for the sender's view
    setMessages(prev => prev.map(msg => {
      if (data.messageIds.includes(msg.id)) {
        console.log(`Marking message ${msg.id} as read`)
        return { ...msg, isRead: true }
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

  useEffect(() => {
    const handleSSEMessage = (event: CustomEvent) => {
      const { type, data } = event.detail
      console.log('SSE Message received:', type, data)

      switch (type) {
        case 'new_message':
          if (data && data.message) {
            handleNewMessage(data.message)
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
      }
    }

    console.log('Adding SSE message listener')
    window.addEventListener('sseMessage', handleSSEMessage as EventListener)
    
    return () => {
      console.log('Removing SSE message listener')
      window.removeEventListener('sseMessage', handleSSEMessage as EventListener)
    }
  }, [handleNewMessage, handleMessagesRead, handleUserTyping])

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      console.log('Marking messages as read for conversation:', conversationId)
      const response = await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Messages marked as read:', data)
        
        // Update local messages to mark them as read immediately
        setMessages(prev => prev.map(msg => 
          msg.conversationId === conversationId && msg.receiverId === userId 
            ? { ...msg, isRead: true } 
            : msg
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
