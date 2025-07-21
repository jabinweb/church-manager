'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { useRealTimeMessages } from '@/lib/hooks/useRealTimeMessages'
import { useNotification } from '@/lib/hooks/useNotification'
import { ConversationSidebar } from './ConversationSidebar'
import { ChatArea } from './ChatArea'
import { MobileChatView } from './MobileChatView'
import { NotificationBanner } from './NotificationBanner'
import { ConnectionStatus } from './ConnectionStatus'
import { NewConversationDialog } from './NewConversationDialog'
import { useNotificationHandlers } from '@/hooks/useNotificationHandlers'

export interface Message {
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

export interface Conversation {
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

export interface User {
  id: string
  name: string | null
  image: string | null
  role: string
}

export function ChatLayout() {
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

  const {
    permission: notificationPermission,
    isWindowFocused,
    requestPermission,
    showMessageNotification,
    setSoundEnabled,
    soundEnabled
  } = useNotification()

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [newConversationOpen, setNewConversationOpen] = useState(false)

  // Set up notification handlers
  useNotificationHandlers({
    session,
    conversations,
    showMessageNotification,
    setSelectedConversation
  })

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch conversations
        const conversationsResponse = await fetch('/api/messages/conversations')
        if (conversationsResponse.ok) {
          const data = await conversationsResponse.json()
          setConversations(data.conversations || [])
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [setConversations])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="md:h-screen bg-gray-50 flex relative">
      <ConnectionStatus 
        isConnected={isConnected}
        notificationPermission={notificationPermission}
        isWindowFocused={isWindowFocused}
        soundEnabled={soundEnabled}
      />
      
      <NotificationBanner
        notificationPermission={notificationPermission}
        requestPermission={requestPermission}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <MobileChatView
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          conversations={conversations}
          setConversations={setConversations}
          messages={messages}
          setMessages={setMessages}
          typingUsers={typingUsers}
          markAsRead={markAsRead}
          sendTypingIndicator={sendTypingIndicator}
          session={session}
          setNewConversationOpen={setNewConversationOpen}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden h-screen lg:flex w-full">
        <ConversationSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          session={session}
          setNewConversationOpen={setNewConversationOpen}
        />
        
        <ChatArea
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          conversations={conversations}
          setConversations={setConversations}
          messages={messages}
          setMessages={setMessages}
          typingUsers={typingUsers}
          markAsRead={markAsRead}
          sendTypingIndicator={sendTypingIndicator}
          session={session}
        />
      </div>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        conversations={conversations}
        setConversations={setConversations}
        setSelectedConversation={setSelectedConversation}
        session={session}
      />
    </div>
  )
}
