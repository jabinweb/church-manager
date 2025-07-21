'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MessageCircle, Send, Loader2, MoreVertical, Check, CheckCheck, Clock, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Conversation, Message } from './ChatLayout'

interface ChatAreaProps {
  selectedConversation: Conversation | null
  setSelectedConversation: (conversation: Conversation | null) => void
  conversations: Conversation[]
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  typingUsers: Set<string>
  markAsRead: (conversationId: string) => Promise<void>
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => void
  session: any
}

export function ChatArea({
  selectedConversation,
  conversations,
  setSelectedConversation,
  setConversations,
  messages,
  setMessages,
  typingUsers,
  markAsRead,
  sendTypingIndicator,
  session
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('')
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true)
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        await markAsRead(conversationId)
        
        setConversations((prev: Conversation[]) => prev.map((conv: Conversation) => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ))
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }, [markAsRead, setConversations, setMessages])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [])

  useEffect(() => {
    // Use a slight delay to ensure DOM is updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 50)
    
    return () => clearTimeout(timer)
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (selectedConversation && typingUsers.size > 0) {
      const hasTypingInCurrentConversation = Array.from(typingUsers).some(userId => 
        userId !== session?.user?.id && 
        selectedConversation.participants.some(p => p.id === userId)
      )
      
      if (hasTypingInCurrentConversation) {
        setTimeout(scrollToBottom, 150)
      }
    }
  }, [typingUsers, selectedConversation, session?.user?.id, scrollToBottom])

  // Also scroll when selectedConversation changes
  useEffect(() => {
    if (selectedConversation) {
      // Delay to ensure messages are loaded
      setTimeout(scrollToBottom, 200)
    }
  }, [selectedConversation, scrollToBottom])

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value)
    
    if (!selectedConversation) return

    if (value.trim() && !isTyping) {
      setIsTyping(true)
      sendTypingIndicator(selectedConversation.id, true)
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        sendTypingIndicator(selectedConversation.id, false)
      }
    }, 2000)

    setTypingTimeout(timeout)
  }, [selectedConversation, isTyping, sendTypingIndicator, typingTimeout])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    if (isTyping) {
      setIsTyping(false)
      sendTypingIndicator(selectedConversation.id, false)
    }

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      senderId: session?.user?.id || '',
      receiverId: selectedConversation.participants.find(p => p.id !== session?.user?.id)?.id || '',
      conversationId: selectedConversation.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: session?.user?.id || '',
        name: session?.user?.name || null,
        image: session?.user?.image || null
      },
      receiver: {
        id: selectedConversation.participants.find(p => p.id !== session?.user?.id)?.id || '',
        name: selectedConversation.participants.find(p => p.id !== session?.user?.id)?.name || null,
        image: selectedConversation.participants.find(p => p.id !== session?.user?.id)?.image || null
      }
    }

    setMessages((prev: Message[]) => [...prev, tempMessage])
    setPendingMessages(prev => new Set([...Array.from(prev), tempMessage.id]))
    
    const messageContent = newMessage.trim()
    setNewMessage('')

    setTimeout(scrollToBottom, 10)

    setSending(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: messageContent
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        setMessages((prev: Message[]) => prev.map((msg: Message) => 
          msg.id === tempMessage.id ? data.message : msg
        ))
        setPendingMessages(prev => {
          const newSet = new Set(Array.from(prev))
          newSet.delete(tempMessage.id)
          return newSet
        })
        
        setConversations((prev: Conversation[]) => prev.map((conv: Conversation) => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: data.message, updatedAt: data.message.createdAt }
            : conv
        ))

        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 10)
      } else {
        setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== tempMessage.id))
        setPendingMessages(prev => {
          const newSet = new Set(Array.from(prev))
          newSet.delete(tempMessage.id)
          return newSet
        })
        
        const error = await response.json()
        toast.error(error.error || 'Failed to send message')
      }
    } catch (error) {
      setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== tempMessage.id))
      setPendingMessages(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(tempMessage.id)
        return newSet
      })
      
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== session?.user?.id) return null
    
    if (pendingMessages.has(message.id)) {
      return 'pending'
    }
    
    if (message.isRead) {
      return 'read'
    }
    
    return 'delivered'
  }

  const renderMessageStatus = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 opacity-50" />
      case 'delivered':
        return <Check className="h-3 w-3" />
      case 'read':
        return <CheckCheck className="h-3 w-3" />
      default:
        return null
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== session?.user?.id)
  }

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p>Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant(selectedConversation)

  return (
    <div className="flex-1 flex flex-col h-full max-h-screen">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="p-2 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {otherParticipant?.image ? (
              <Image
                src={otherParticipant.image}
                alt={otherParticipant.name || 'User'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {otherParticipant?.name ? otherParticipant.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <h2 className="font-semibold text-gray-900">
              {otherParticipant?.name || 'Unknown User'}
            </h2>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete Conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth"
        style={{ 
          height: 'calc(100vh - 140px)',
          maxHeight: 'calc(100vh - 140px)',
          scrollBehavior: 'smooth'
        }}
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const messageStatus = getMessageStatus(message)
              const isPending = pendingMessages.has(message.id)
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.senderId === session?.user?.id ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg transition-opacity",
                      message.senderId === session?.user?.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-900",
                      isPending && "opacity-70"
                    )}
                  >
                    <p className="break-words">{message.content}</p>
                    <div className={cn(
                      "flex items-center justify-end mt-1 space-x-1",
                      message.senderId === session?.user?.id ? "text-purple-200" : "text-gray-500"
                    )}>
                      <span className="text-xs">
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </span>
                      {messageStatus && renderMessageStatus(messageStatus)}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Typing indicator */}
            {Array.from(typingUsers).some(userId => 
              userId !== session?.user?.id && 
              selectedConversation.participants.some(p => p.id === userId)
            ) && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1 items-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-xs text-gray-600 ml-2">typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex space-x-2">
          <Input
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            className="flex-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={sending}
            autoFocus={!!selectedConversation}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

