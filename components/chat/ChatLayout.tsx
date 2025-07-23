'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, MessageCircle, Users, Megaphone, Hash } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConversationSidebar } from './ConversationSidebar'
import { ChatArea } from './ChatArea'
import { MobileChatView } from './MobileChatView'
import { NotificationBanner } from './NotificationBanner'
import { ConnectionStatus } from './ConnectionStatus'
import { NewConversationDialog } from './NewConversationDialog'
import { useRealTimeMessages } from '@/lib/hooks/useRealTimeMessages'
import { useNotification } from '@/lib/hooks/useNotification'
import { useNotificationHandlers } from '@/hooks/useNotificationHandlers'
import { ConversationType } from '@/lib/types/messaging'
import type { 
  Conversation as UnifiedConversation, 
  Message as UnifiedMessage 
} from '@/lib/types/messaging'

// Legacy interfaces for backward compatibility
export interface LegacyMessage {
  id: string
  content: string
  senderId?: string
  receiverId: string
  conversationId: string
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    name: string | null
    image: string | null
    role?: string
  }
  receiver: {
    id: string
    name: string | null
    image: string | null
  }
}

export interface LegacyConversation {
  id: string
  participants: Array<{
    id: string
    name: string | null
    image: string | null
  }>
  lastMessage: LegacyMessage | null
  unreadCount: number
  updatedAt: string
}

// Convert unified Conversation to legacy format for backward compatibility
const convertToLegacyConversation = (conversation: UnifiedConversation): LegacyConversation => {
  // For direct conversations, get the other participant
  const otherParticipant = conversation.participants?.find(p => p.userId !== conversation.createdById) || 
                           conversation.participants?.[0]

  return {
    id: conversation.id,
    participants: conversation.participants?.map(p => ({
      id: p.userId,
      name: p.user.name,
      image: p.user.image
    })) || [],
    lastMessage: conversation.lastMessage ? {
      id: conversation.lastMessage.id,
      content: conversation.lastMessage.content,
      senderId: conversation.lastMessage.senderId,
      receiverId: conversation.participants?.[0]?.userId || '', // fallback for legacy
      conversationId: conversation.lastMessage.conversationId,
      isRead: conversation.lastMessage.readBy?.length > 0,
      createdAt: conversation.lastMessage.createdAt,
      sender: conversation.lastMessage.sender,
      receiver: {
        id: otherParticipant?.userId || '',
        name: otherParticipant?.user.name || null,
        image: otherParticipant?.user.image || null
      }
    } : null,
    unreadCount: conversation.unreadCount || 0,
    updatedAt: conversation.updatedAt
  }
}

export function ChatLayout() {
  const { data: session } = useSession()
  
  // Cast the hook return types to ensure compatibility
  const {
    conversations: hookConversations,
    setConversations: hookSetConversations,
    messages,
    setMessages,
    typingUsers,
    isConnected,
    markAsRead,
    sendTypingIndicator
  } = useRealTimeMessages(session?.user?.id)

  // Ensure we're working with the correct types
  const conversations = hookConversations as UnifiedConversation[]
  const setConversations = hookSetConversations as React.Dispatch<React.SetStateAction<UnifiedConversation[]>>

  const {
    permission: notificationPermission,
    isWindowFocused,
    requestPermission,
    showMessageNotification,
    setSoundEnabled,
    soundEnabled
  } = useNotification()

  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [newConversationOpen, setNewConversationOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'direct' | 'groups' | 'broadcasts' | 'channels'>('direct')

  // Convert conversations to legacy format for notification handlers
  const legacyConversations = conversations.map(convertToLegacyConversation)

  // Create a wrapper function for showMessageNotification to match the expected signature
  const handleShowMessageNotification = (message: LegacyMessage) => {
    if (message.sender) {
      showMessageNotification(
        message.sender.name || 'Unknown User',
        message.content,
        message.sender.image || undefined,
        message.conversationId
      )
    }
  }

  // Set up notification handlers with legacy format
  useNotificationHandlers({
    session,
    conversations: legacyConversations,
    showMessageNotification: handleShowMessageNotification,
    setSelectedConversation: (legacyConv) => {
      if (!legacyConv) {
        setSelectedConversation(null)
        return
      }
      // Find the original conversation from the legacy one
      const originalConv = conversations.find(c => c.id === legacyConv.id)
      setSelectedConversation(originalConv || null)
    }
  })

  // Filter conversations by type - handle both legacy and new conversation formats
  const directConversations = conversations.filter(c => {
    // Only include actual DIRECT conversations, exclude broadcasts
    if (c.type === ConversationType.BROADCAST || c.type === ConversationType.GROUP || c.type === ConversationType.CHANNEL) {
      return false
    }
    // Check if it's a legacy conversation (no type property) - assume DIRECT
    if (!('type' in c)) return true
    return c.type === ConversationType.DIRECT
  })
  
  const groupConversations = conversations.filter(c => {
    if (!('type' in c)) return false
    return c.type === ConversationType.GROUP
  })
  
  const broadcastConversations = conversations.filter(c => {
    if (!('type' in c)) return false
    return c.type === ConversationType.BROADCAST
  })
  
  const channelConversations = conversations.filter(c => {
    if (!('type' in c)) return false
    return c.type === ConversationType.CHANNEL
  })

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('Fetching initial conversations data...')
        const conversationsResponse = await fetch('/api/messages/conversations')
        if (conversationsResponse.ok) {
          const data = await conversationsResponse.json()
          console.log('Initial conversations fetched:', data.conversations?.length, data.conversations)
          setConversations(data.conversations || [])
        } else {
          console.error('Failed to fetch conversations:', conversationsResponse.status)
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchInitialData()
    } else {
      setLoading(false)
    }
  }, [setConversations, session?.user?.id])

  useEffect(() => {
    console.log('ChatLayout: Setting up notification handlers')
    
    // Handle conversation notifications
    const handleNewConversation = (event: CustomEvent) => {
      const { conversation, initiatedBy } = event.detail
      console.log('ChatLayout: Handling new conversation notification:', conversation, initiatedBy)
      
      // Show notification if not in focus
      if (!isWindowFocused) {
        console.log('ChatLayout: Showing new conversation notification')
        showMessageNotification(
          'New Conversation',
          `${initiatedBy} started a conversation with you`,
          undefined,
          conversation.id
        )
      }
    }

    const handleNewMessage = (event: CustomEvent) => {
      const { message } = event.detail
      console.log('ChatLayout: Handling new message notification:', message)
      
      // Show notification if not viewing this conversation or window not focused
      if (!isWindowFocused || selectedConversation?.id !== message.conversationId) {
        console.log('ChatLayout: Showing new message notification')
        showMessageNotification(
          message.sender?.name || 'Someone',
          message.content,
          message.sender?.image,
          message.conversationId
        )
      }
    }

    const handleConversationUpdated = (event: CustomEvent) => {
      const { conversation } = event.detail
      console.log('ChatLayout: Handling conversation updated notification:', conversation)
      
      // Show notification for new messages if not viewing this conversation
      if (conversation.lastMessage && (!isWindowFocused || selectedConversation?.id !== conversation.id)) {
        const sender = conversation.lastMessage.sender
        console.log('ChatLayout: Showing conversation update notification')
        showMessageNotification(
          sender?.name || 'Someone',
          conversation.lastMessage.content,
          sender?.image,
          conversation.id
        )
      }
    }

    // Handle broadcast channel notifications
    const handleNewBroadcastChannel = (event: CustomEvent) => {
      const { conversation, creatorName } = event.detail
      console.log('ChatLayout: Handling new broadcast channel notification:', conversation, creatorName)
      
      // Show notification if not in focus or not on broadcasts tab
      if (!isWindowFocused || activeTab !== 'broadcasts') {
        console.log('ChatLayout: Showing new broadcast channel notification')
        showMessageNotification(
          'New Broadcast Channel',
          `${creatorName} created "${conversation.name}"`,
          undefined,
          conversation.id
        )
      }

      // Force refresh of conversations to ensure it appears
      setTimeout(() => {
        console.log('ChatLayout: Force refreshing conversations after broadcast channel creation')
        const refreshConversations = async () => {
          try {
            const response = await fetch('/api/messages/conversations')
            if (response.ok) {
              const data = await response.json()
              console.log('ChatLayout: Refreshed conversations:', data.conversations?.length)
              setConversations(data.conversations || [])
            }
          } catch (error) {
            console.error('ChatLayout: Error refreshing conversations:', error)
          }
        }
        refreshConversations()
      }, 1000)
    }

    const handleNewBroadcastMessage = (event: CustomEvent) => {
      const { message, channelName } = event.detail
      console.log('ChatLayout: Handling new broadcast message notification:', message, channelName)
      
      // Show notification if not in focus or not viewing the broadcast channel
      if (!isWindowFocused || selectedConversation?.id !== message.conversationId) {
        console.log('ChatLayout: Showing new broadcast message notification')
        showMessageNotification(
          channelName || 'Broadcast Channel',
          message.content,
          message.sender?.image,
          message.conversationId
        )
      }
    }

    // Handle focus conversation requests from notifications
    const handleFocusConversation = (event: CustomEvent) => {
      const { conversationId } = event.detail
      console.log('ChatLayout: Handling focus conversation request:', conversationId)
      
      // Find and select the conversation
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        setSelectedConversation(conversation)
        
        // Switch to appropriate tab based on conversation type
        if (conversation.type === 'BROADCAST') {
          setActiveTab('broadcasts')
        } else if (conversation.type === 'GROUP') {
          setActiveTab('groups')
        } else if (conversation.type === 'CHANNEL') {
          setActiveTab('channels')
        } else {
          setActiveTab('direct')
        }
      }
    }

    console.log('ChatLayout: Adding event listeners')
    window.addEventListener('newConversation', handleNewConversation as EventListener)
    window.addEventListener('newMessage', handleNewMessage as EventListener)
    window.addEventListener('conversationUpdated', handleConversationUpdated as EventListener)
    window.addEventListener('newBroadcastChannel', handleNewBroadcastChannel as EventListener)
    window.addEventListener('newBroadcastMessage', handleNewBroadcastMessage as EventListener)
    window.addEventListener('focusConversation', handleFocusConversation as EventListener)
    
    return () => {
      console.log('ChatLayout: Removing event listeners')
      window.removeEventListener('newConversation', handleNewConversation as EventListener)
      window.removeEventListener('newMessage', handleNewMessage as EventListener)
      window.removeEventListener('conversationUpdated', handleConversationUpdated as EventListener)
      window.removeEventListener('newBroadcastChannel', handleNewBroadcastChannel as EventListener)
      window.removeEventListener('newBroadcastMessage', handleNewBroadcastMessage as EventListener)
      window.removeEventListener('focusConversation', handleFocusConversation as EventListener)
    }
  }, [isWindowFocused, activeTab, selectedConversation?.id, showMessageNotification, setConversations, conversations, setSelectedConversation, setActiveTab])

  const getCurrentConversations = () => {
    switch (activeTab) {
      case 'direct': return directConversations
      case 'groups': return groupConversations
      case 'broadcasts': return broadcastConversations
      case 'channels': return channelConversations
      default: return directConversations
    }
  }

  // Calculate unread counts for each tab - fix the logic to properly separate conversation types
  const getTabUnreadCounts = () => {
    const counts = {
      direct: 0,
      groups: 0,
      broadcasts: 0,
      channels: 0
    }

    conversations.forEach(conv => {
      const unreadCount = conv.unreadCount || 0
      if (unreadCount > 0) {
        // Ensure proper type checking
        if (conv.type === ConversationType.DIRECT || (!conv.type && conv.participants?.length === 2)) {
          // Only count as direct if it's actually a direct conversation
          counts.direct += unreadCount
        } else if (conv.type === ConversationType.GROUP) {
          counts.groups += unreadCount
        } else if (conv.type === ConversationType.BROADCAST) {
          counts.broadcasts += unreadCount
        } else if (conv.type === ConversationType.CHANNEL) {
          counts.channels += unreadCount
        }
      }
    })

    return counts
  }

  const tabUnreadCounts = getTabUnreadCounts()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="md:h-screen h-[calc(100vh-4rem)] bg-gray-50 flex relative overflow-hidden">
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
      <div className="lg:hidden w-full h-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value: string) => {
          setActiveTab(value as any)
          setSelectedConversation(null)
        }} className="w-full h-full flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0 h-12">
            <TabsTrigger value="direct" className="flex items-center text-xs relative">
              <MessageCircle className="h-3 w-3 mr-1" />
              Direct
              {tabUnreadCounts.direct > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {tabUnreadCounts.direct > 99 ? '99+' : tabUnreadCounts.direct}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center text-xs relative">
              <Users className="h-3 w-3 mr-1" />
              Groups
              {tabUnreadCounts.groups > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {tabUnreadCounts.groups > 99 ? '99+' : tabUnreadCounts.groups}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="flex items-center text-xs relative">
              <Megaphone className="h-3 w-3 mr-1" />
              Broadcasts
              {tabUnreadCounts.broadcasts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {tabUnreadCounts.broadcasts > 99 ? '99+' : tabUnreadCounts.broadcasts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center text-xs relative">
              <Hash className="h-3 w-3 mr-1" />
              Channels
              {tabUnreadCounts.channels > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {tabUnreadCounts.channels > 99 ? '99+' : tabUnreadCounts.channels}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            {['direct', 'groups', 'broadcasts', 'channels'].map((tab) => (
              <TabsContent key={tab} value={tab} className="h-full m-0 data-[state=active]:flex data-[state=inactive]:hidden overflow-hidden">
                <MobileChatView
                  selectedConversation={selectedConversation}
                  setSelectedConversation={setSelectedConversation}
                  conversations={getCurrentConversations()}
                  setConversations={setConversations}
                  messages={messages}
                  setMessages={setMessages}
                  typingUsers={typingUsers}
                  markAsRead={markAsRead}
                  sendTypingIndicator={sendTypingIndicator}
                  session={session}
                  setNewConversationOpen={setNewConversationOpen}
                  conversationType={tab as any}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Desktop Layout */}
      <div className="hidden h-screen lg:flex w-full overflow-hidden">
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct" className="flex items-center relative">
                <MessageCircle className="h-4 w-4 mr-2" />
                Direct
                {tabUnreadCounts.direct > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {tabUnreadCounts.direct > 99 ? '99+' : tabUnreadCounts.direct}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center relative">
                <Users className="h-4 w-4 mr-2" />
                Groups
                {tabUnreadCounts.groups > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {tabUnreadCounts.groups > 99 ? '99+' : tabUnreadCounts.groups}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 mt-1">
              <TabsTrigger value="broadcasts" className="flex items-center relative">
                <Megaphone className="h-4 w-4 mr-2" />
                Broadcasts
                {tabUnreadCounts.broadcasts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {tabUnreadCounts.broadcasts > 99 ? '99+' : tabUnreadCounts.broadcasts}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="channels" className="flex items-center relative">
                <Hash className="h-4 w-4 mr-2" />
                Channels
                {tabUnreadCounts.channels > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {tabUnreadCounts.channels > 99 ? '99+' : tabUnreadCounts.channels}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            {['direct', 'groups', 'broadcasts', 'channels'].map((tab) => (
              <TabsContent key={tab} value={tab} className="flex-1 mt-0">
                <ConversationSidebar
                  conversations={getCurrentConversations()}
                  selectedConversation={selectedConversation}
                  setSelectedConversation={setSelectedConversation}
                  setConversations={setConversations}
                  session={session}
                  setNewConversationOpen={setNewConversationOpen}
                  conversationType={tab as any}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 h-full">
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
      </div>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        conversations={conversations}
        setConversations={setConversations}
        setSelectedConversation={setSelectedConversation}
        session={session}
        conversationType={activeTab}
      />
    </div>
  )
}

// Re-export unified types
export type { UnifiedConversation as Conversation, UnifiedMessage as Message }
