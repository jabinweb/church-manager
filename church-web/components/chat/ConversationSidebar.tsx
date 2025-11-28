'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Search, Plus } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { toast } from 'sonner'
import type { Conversation } from '@/lib/types/messaging'

interface ConversationSidebarProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  setSelectedConversation: (conversation: Conversation | null) => void
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void
  session: any
  setNewConversationOpen: (open: boolean) => void
  conversationType: 'direct' | 'groups' | 'broadcasts' | 'channels'
}

export function ConversationSidebar({
  conversations,
  selectedConversation,
  setSelectedConversation,
  setConversations,
  session,
  setNewConversationOpen,
  conversationType
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.userId !== session?.user?.id)
  }

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = getOtherParticipant(conv)
    return otherParticipant?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Find the conversation to determine the type
    const conversation = conversations.find(c => c.id === conversationId)
    const conversationType = conversation?.type || 'DIRECT'
    
    let confirmMessage = ''
    
    if (conversationType === 'DIRECT') {
      confirmMessage = 'Are you sure you want to delete this conversation? It will be removed from your chat list but the other person will still have it.'
    } else {
      confirmMessage = 'Are you sure you want to delete this conversation? This will delete it for all members and cannot be undone.'
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      console.log(`Attempting to delete conversation: ${conversationId}`)
      
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      console.log(`Delete response status: ${response.status}`)

      if (response.ok) {
        toast.success('Conversation deleted successfully')
        
        setConversations((prev: Conversation[]) => 
          prev.filter((conv: Conversation) => conv.id !== conversationId)
        )
        
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null)
        }
      } else {
        const errorData = await response.json()
        console.error('Delete conversation error:', errorData)
        toast.error(errorData.error || 'Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  return (
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
          <ConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            setConversations={setConversations}
            getOtherParticipant={getOtherParticipant}
            session={session}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
      </div>
    </div>
  )
}
