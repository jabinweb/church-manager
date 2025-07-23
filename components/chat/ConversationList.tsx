'use client'

import { format } from 'date-fns'
import { MoreVertical, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Conversation, ConversationParticipant } from '@/lib/types/messaging'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  setSelectedConversation: (conversation: Conversation | null) => void
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void
  getOtherParticipant: (conversation: Conversation) => ConversationParticipant | undefined
  session: any
  onDeleteConversation: (conversationId: string, event: React.MouseEvent) => void
}

export function ConversationList({
  conversations,
  selectedConversation,
  setSelectedConversation,
  getOtherParticipant,
  session,
  onDeleteConversation
}: ConversationListProps) {
  
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) {
      return conversation.name
    }
    
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.user?.name || 'Unknown User'
  }

  const getConversationImage = (conversation: Conversation) => {
    if (conversation.imageUrl) {
      return conversation.imageUrl
    }
    
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.user?.image
  }

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet'
    }
    
    const isOwnMessage = conversation.lastMessage.senderId === session?.user?.id
    const prefix = isOwnMessage ? 'You: ' : ''
    
    return `${prefix}${conversation.lastMessage.content}`
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation) => {
        const conversationName = getConversationName(conversation)
        const conversationImage = getConversationImage(conversation)
        const lastMessagePreview = getLastMessagePreview(conversation)
        const isSelected = selectedConversation?.id === conversation.id

        return (
          <div
            key={conversation.id}
            onClick={() => setSelectedConversation(conversation)}
            className={cn(
              "p-4 hover:bg-gray-50 cursor-pointer transition-colors group relative",
              isSelected && "bg-purple-50 hover:bg-purple-50 border-r-2 border-purple-500"
            )}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              {conversationImage ? (
                <Image
                  src={conversationImage}
                  alt={conversationName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {conversationName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversationName}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {format(new Date(conversation.lastMessage.createdAt), 'MMM dd')}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={(e) => onDeleteConversation(conversation.id, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessagePreview}
                  </p>
                  {/* Unread Count Badge */}
                  {conversation.unreadCount && conversation.unreadCount > 0 && (
                    <div className="flex items-center">
                      <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-2">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
