'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  MessageCircle, 
  Search, 
  Send, 
  User, 
  Loader2,
  Plus,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRealTimeMessages } from '@/lib/hooks/useRealTimeMessages'

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

interface User {
  id: string
  name: string | null
  image: string | null
  role: string
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const {
    conversations,
    setConversations,
    messages,
    setMessages,
    typingUsers,
    isConnected,
    markAsRead,
    sendTypingIndicator
  } = useRealTimeMessages(session?.user?.id)

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [newConversationOpen, setNewConversationOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set())
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [setConversations])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/directory')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.members?.map((member: any) => ({
          id: member.id,
          name: member.name,
          image: member.image,
          role: member.role
        })) || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    fetchUsers()
  }, [fetchConversations, fetchUsers])

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true)
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        await markAsRead(conversationId)
        
        // Update conversation unread count locally
        setConversations(prev => prev.map(conv => 
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

  // Handle typing indicator with debouncing
  const handleTyping = useCallback((value: string) => {
    setNewMessage(value)
    
    if (!selectedConversation) return

    if (value.trim() && !isTyping) {
      setIsTyping(true)
      sendTypingIndicator(selectedConversation.id, true)
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        sendTypingIndicator(selectedConversation.id, false)
      }
    }, 2000)

    setTypingTimeout(timeout)
  }, [selectedConversation, isTyping, sendTypingIndicator, typingTimeout])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Scroll to bottom when new messages arrive, conversation changes, or typing status changes
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Scroll when typing users change (someone starts/stops typing)
  useEffect(() => {
    if (selectedConversation && typingUsers.size > 0) {
      const hasTypingInCurrentConversation = Array.from(typingUsers).some(userId => 
        userId !== session?.user?.id && 
        selectedConversation.participants.some(p => p.id === userId)
      )
      
      if (hasTypingInCurrentConversation) {
        setTimeout(scrollToBottom, 100)
      }
    }
  }, [typingUsers, selectedConversation, session?.user?.id, scrollToBottom])

  // Also scroll when selectedConversation changes
  useEffect(() => {
    if (selectedConversation) {
      // Slight delay to ensure messages are loaded
      setTimeout(scrollToBottom, 100)
    }
  }, [selectedConversation, scrollToBottom])

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      sendTypingIndicator(selectedConversation.id, false)
    }

    // Create temporary message for instant display
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

    // Add to messages immediately for instant display
    setMessages(prev => [...prev, tempMessage])
    setPendingMessages(prev => new Set([...Array.from(prev), tempMessage.id]))
    
    const messageContent = newMessage.trim()
    setNewMessage('')

    // Auto-scroll immediately after adding optimistic message
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
        console.log('Message sent successfully:', data.message)
        
        // Replace temporary message with actual message
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? data.message : msg
        ))
        setPendingMessages(prev => {
          const newSet = new Set(Array.from(prev))
          newSet.delete(tempMessage.id)
          return newSet
        })
        
        // Update conversation with new last message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: data.message, updatedAt: data.message.createdAt }
            : conv
        ))

        // Auto-focus input after message is sent
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 10)
      } else {
        // Remove failed message
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        setPendingMessages(prev => {
          const newSet = new Set(Array.from(prev))
          newSet.delete(tempMessage.id)
          return newSet
        })
        
        const error = await response.json()
        toast.error(error.error || 'Failed to send message')
        
        // Focus input even if there's an error
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 10)
      }
    } catch (error) {
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      setPendingMessages(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(tempMessage.id)
        return newSet
      })
      
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      
      // Focus input even if there's an error
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 10)
    } finally {
      setSending(false)
    }
  }

  // Function to get message status
  const getMessageStatus = (message: Message) => {
    if (message.senderId !== session?.user?.id) return null // Don't show status for received messages
    
    if (pendingMessages.has(message.id)) {
      return 'pending' // No check - message is being sent
    }
    
    if (message.isRead) {
      return 'read' // Double check - message was read
    }
    
    return 'delivered' // Single check - message was delivered but not read
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

  const startNewConversation = async () => {
    if (!selectedUser) return

    try {
      // Check if conversation already exists locally first
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.id === selectedUser.id)
      )

      if (existingConversation) {
        setSelectedConversation(existingConversation)
        setNewConversationOpen(false)
        setSelectedUser(null)
        return
      }

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: selectedUser.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Check if this conversation already exists in our list
        const existingIndex = conversations.findIndex(conv => conv.id === data.conversation.id)
        
        if (existingIndex >= 0) {
          // Update existing conversation
          setConversations(prev => prev.map((conv, index) => 
            index === existingIndex ? data.conversation : conv
          ))
        } else {
          // Add new conversation
          setConversations(prev => [data.conversation, ...prev])
        }
        
        setSelectedConversation(data.conversation)
        setNewConversationOpen(false)
        setSelectedUser(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start conversation')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== session?.user?.id)
  }

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = getOtherParticipant(conv)
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const filteredUsers = users.filter(user => 
    user.id !== session?.user?.id &&
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !conversations.some(conv => 
      conv.participants.some(p => p.id === user.id)
    )
  )

  // Add debugging
  useEffect(() => {
    console.log('Messages page mounted')
    console.log('Session user:', session?.user?.id)
    console.log('SSE connected:', isConnected)
    console.log('Current messages count:', messages.length)
  }, [session?.user?.id, isConnected, messages.length])

  // Log when new messages arrive
  useEffect(() => {
    console.log('Messages updated:', messages.length, messages)
  }, [messages])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex relative">
      {/* Connection status indicator */}
      <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-medium ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Mobile: Show conversations list or chat */}
      <div className="lg:hidden w-full flex flex-col">
        {!selectedConversation ? (
          /* Mobile Conversations List */
          <div className="w-full bg-white flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                <Button
                  size="sm"
                  onClick={() => setNewConversationOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No conversations yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewConversationOpen(true)}
                    className="mt-2"
                  >
                    Start a conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation)
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
                      >
                        <div className="flex items-start space-x-3">
                          {/* Avatar */}
                          {otherParticipant?.image ? (
                            <Image
                              src={otherParticipant.image}
                              alt={otherParticipant.name || 'User'}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {otherParticipant?.name ? otherParticipant.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">
                                {otherParticipant?.name || 'Unknown User'}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-purple-600 text-white text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            
                            {conversation.lastMessage && (
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-1">
                              {conversation.lastMessage && formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mobile Chat View */
          <div className="w-full flex flex-col h-full">
            {/* Chat Header with Back Button */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedConversation(null)
                    setIsMobileConversationOpen(true)
                  }}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {(() => {
                  const otherParticipant = getOtherParticipant(selectedConversation)
                  return (
                    <>
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
                      <h2 className="font-semibold text-gray-900 flex-1">
                        {otherParticipant?.name || 'Unknown User'}
                      </h2>
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
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
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
                  
                  {/* Invisible div for auto-scroll target */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
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
        )}
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden lg:flex w-full">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              <Button
                size="sm"
                onClick={() => setNewConversationOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No conversations yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewConversationOpen(true)}
                  className="mt-2"
                >
                  Start a conversation
                </Button>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation)
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors",
                        selectedConversation?.id === conversation.id
                          ? "bg-purple-100 border border-purple-200"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        {otherParticipant?.image ? (
                          <Image
                            src={otherParticipant.image}
                            alt={otherParticipant.name || 'User'}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {otherParticipant?.name ? otherParticipant.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {otherParticipant?.name || 'Unknown User'}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-purple-600 text-white text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-1">
                            {conversation.lastMessage && formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const otherParticipant = getOtherParticipant(selectedConversation)
                      return (
                        <>
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
                        </>
                      )
                    })()}
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
                className="flex-1 overflow-y-auto p-4 space-y-4"
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
                    
                    {/* Invisible div for auto-scroll target */}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={newConversationOpen} onOpenChange={setNewConversationOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Choose a church member to start messaging
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-60 h-auto overflow-y-auto space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors border",
                    selectedUser?.id === user.id
                      ? "bg-purple-100 border-purple-200"
                      : "hover:bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 capitalize truncate">{user.role.toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="outline" onClick={() => setNewConversationOpen(false)} className="order-2 sm:order-1">
                Cancel
              </Button>
              <Button
                onClick={startNewConversation}
                disabled={!selectedUser}
                className="bg-purple-600 hover:bg-purple-700 order-1 sm:order-2"
              >
                Start Conversation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

