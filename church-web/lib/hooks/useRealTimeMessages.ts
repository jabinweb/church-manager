'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSSE } from './useSSE'
import type { Conversation, Message } from '@/lib/types/messaging'

export function useRealTimeMessages(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const { isConnected } = useSSE()

  console.log('useRealTimeMessages: Hook initialized for user:', userId, 'Connected:', isConnected)

  const handleNewMessage = useCallback((message: Message) => {
    console.log('Real-time: New message received:', message)
    
    // Add message to current messages if we're viewing the same conversation
    setMessages((prevMessages: Message[]) => {
      const isCurrentConversation = prevMessages.length > 0 && 
        prevMessages[0]?.conversationId === message.conversationId
      
      if (isCurrentConversation) {
        // Avoid duplicate messages
        if (prevMessages.some(m => m.id === message.id)) {
          return prevMessages
        }
        console.log('Adding message to current conversation view')
        return [...prevMessages, message]
      }
      return prevMessages
    })

    // Update conversation list with new message and increment unread count
    setConversations((prev: Conversation[]) => {
      return prev.map((conv: Conversation) => {
        if (conv.id === message.conversationId) {
          const shouldIncrement = message.senderId !== userId
          const newUnreadCount = shouldIncrement ? (conv.unreadCount || 0) + 1 : conv.unreadCount
          
          console.log(`Updating conversation ${conv.name || conv.id}: unread ${conv.unreadCount || 0} -> ${newUnreadCount}`)
          
          return {
            ...conv,
            lastMessage: message,
            updatedAt: message.createdAt,
            unreadCount: newUnreadCount
          }
        }
        return conv
      })
    })
  }, [userId])

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
        updated[existingIndex] = {
          ...data.conversation,
          unreadCount: data.conversation.unreadCount || updated[existingIndex].unreadCount
        }
        
        // Move to top if it has new messages
        if (data.conversation.lastMessage) {
          const [movedConv] = updated.splice(existingIndex, 1)
          return [movedConv, ...updated]
        }
        return updated
      } else {
        // Add new conversation at top
        console.log('Adding new conversation to list:', data.conversation.name || data.conversation.id)
        return [data.conversation, ...prev]
      }
    })
  }, [])

  const handleNewBroadcastMessage = useCallback((data: {
    message: Message
    channelName: string
    timestamp: string
  }) => {
    console.log('Real-time: New broadcast message:', data)
    
    // Treat broadcast messages like regular messages
    handleNewMessage(data.message)
  }, [handleNewMessage])

  const handleNewBroadcastChannel = useCallback((data: {
    conversation: Conversation
    creatorName: string
    timestamp: string
  }) => {
    console.log('Real-time: New broadcast channel:', data)
    
    // Add the new broadcast channel to conversations
    setConversations((prev: Conversation[]) => {
      // Check if conversation already exists
      if (prev.some(conv => conv.id === data.conversation.id)) {
        return prev
      }
      console.log('Adding new broadcast channel:', data.conversation.name)
      return [data.conversation, ...prev]
    })
  }, [])

  const handleTypingStart = useCallback((data: { userId: string, conversationId: string }) => {
    console.log('Real-time: Typing start:', data)
    setTypingUsers(prev => {
      const newSet = new Set(Array.from(prev))
      newSet.add(data.userId)
      return newSet
    })
    
    // Remove typing indicator after 5 seconds
    setTimeout(() => {
      setTypingUsers(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(data.userId)
        return newSet
      })
    }, 5000)
  }, [])

  const handleTypingStop = useCallback((data: { userId: string }) => {
    console.log('Real-time: Typing stop:', data)
    setTypingUsers(prev => {
      const newSet = new Set(Array.from(prev))
      newSet.delete(data.userId)
      return newSet
    })
  }, [])

  // Enhanced markAsRead function
  const markAsRead = useCallback(async (conversationId: string, messageId?: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, messageId })
      })

      if (response.ok) {
        // Update local unread count immediately
        setConversations((prev: Conversation[]) => 
          prev.map((conv: Conversation) => 
            conv.id === conversationId 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        )
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [])

  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          isTyping
        })
      })

      if (!response.ok) {
        console.error('Failed to send typing indicator')
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  }, [userId])

  // Set up event listeners for SSE messages
  useEffect(() => {
    console.log('useRealTimeMessages: Setting up SSE listeners for user:', userId)
    
    const handleSSEMessage = (event: CustomEvent) => {
      const { type, data } = event.detail
      console.log('useRealTimeMessages: SSE message received:', { type, data }, 'for user:', userId)

      try {
        switch (type) {
          case 'new_message':
            if (data.message) {
              console.log('useRealTimeMessages: Processing new message:', data.message.id)
              handleNewMessage(data.message)
              
              // Trigger notification event for other components
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('newMessage', {
                  detail: {
                    message: data.message,
                    timestamp: new Date().toISOString()
                  }
                }))
              }, 100)
            }
            break
            
          case 'messages_read':
            if (data.conversationId && data.readByUserId) {
              console.log('useRealTimeMessages: Processing messages read event:', data)
              
              // Update messages in the current conversation to reflect read status
              setMessages((prevMessages: Message[]) => 
                prevMessages.map((msg: Message) => {
                  if (msg.conversationId === data.conversationId && msg.senderId === userId) {
                    // Add the user to readBy array if not already present
                    const updatedReadBy = msg.readBy?.includes(data.readByUserId) 
                      ? msg.readBy 
                      : [...(msg.readBy || []), data.readByUserId]
                    
                    return {
                      ...msg,
                      readBy: updatedReadBy
                    }
                  }
                  return msg
                })
              )
            }
            break

          case 'conversation_updated':
            if (data.conversation) {
              console.log('useRealTimeMessages: Processing conversation update:', data.conversation.id)
              handleConversationUpdated(data)
              
              // Trigger notification event
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('conversationUpdated', {
                  detail: data
                }))
              }, 100)
            }
            break
            
          case 'new_broadcast_message':
            if (data.message) {
              console.log('useRealTimeMessages: Processing broadcast message:', data.message.id)
              handleNewBroadcastMessage(data)
              
              // Trigger notification event
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('newBroadcastMessage', {
                  detail: data
                }))
              }, 100)
            }
            break
            
          case 'new_broadcast_channel':
            if (data.conversation) {
              console.log('useRealTimeMessages: Processing new broadcast channel:', data.conversation.id)
              handleNewBroadcastChannel(data)
              
              // Trigger notification event
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('newBroadcastChannel', {
                  detail: data
                }))
              }, 100)
            }
            break
            
          case 'new_conversation':
            console.log('useRealTimeMessages: Processing new conversation:', data.conversation?.id)
            
            // Add the new conversation to the list
            if (data.conversation) {
              setConversations((prev: Conversation[]) => {
                // Check if conversation already exists
                if (prev.some(conv => conv.id === data.conversation.id)) {
                  return prev
                }
                return [data.conversation, ...prev]
              })
            }
            
            // Trigger notification event
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('newConversation', {
                detail: data
              }))
            }, 100)
            break

          case 'typing_start':
            if (data.userId && data.conversationId) {
              console.log('useRealTimeMessages: Processing typing start:', data.userId)
              handleTypingStart(data)
            }
            break
            
          case 'typing_stop':
            if (data.userId) {
              console.log('useRealTimeMessages: Processing typing stop:', data.userId)
              handleTypingStop(data)
            }
            break
            
          case 'connection_established':
            console.log('useRealTimeMessages: SSE connection established for user:', data.userId)
            break
            
          case 'heartbeat':
            // Heartbeat received, connection is alive
            console.log('useRealTimeMessages: Heartbeat received for user:', userId)
            break
            
          case 'message_reaction':
            if (data.messageId && data.reactions) {
              console.log('useRealTimeMessages: Processing message reaction:', data.messageId)
              
              setMessages((prev: Message[]) => prev.map((msg: Message) => 
                msg.id === data.messageId 
                  ? { ...msg, reactions: data.reactions }
                  : msg
              ))

              // Show toast for reaction updates if window is not focused
              if (!document.hasFocus() && data.action === 'added') {
                console.log(`${data.userName} reacted with ${data.emoji}`)
              } else if (!document.hasFocus() && data.action === 'changed') {
                console.log(`${data.userName} changed reaction to ${data.emoji}`)
              }
            }
            break
            
          default:
            console.log('useRealTimeMessages: Unknown SSE message type:', type)
        }
      } catch (error) {
        console.error('useRealTimeMessages: Error handling SSE message:', error)
      }
    }

    window.addEventListener('sseMessage', handleSSEMessage as EventListener)

    return () => {
      console.log('useRealTimeMessages: Cleaning up SSE listeners for user:', userId)
      window.removeEventListener('sseMessage', handleSSEMessage as EventListener)
    }
  }, [
    userId,
    handleNewMessage,
    handleConversationUpdated,
    handleNewBroadcastMessage,
    handleNewBroadcastChannel,
    handleTypingStart,
    handleTypingStop,
    setConversations,
    setMessages
  ])

  // Log connection status changes
  useEffect(() => {
    console.log('SSE connection status changed:', isConnected)
  }, [isConnected])

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
