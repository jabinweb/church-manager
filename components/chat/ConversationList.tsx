'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Conversation } from './ChatLayout'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  setSelectedConversation: (conversation: Conversation) => void
  getOtherParticipant: (conversation: Conversation) => any
}

export function ConversationList({
  conversations,
  selectedConversation,
  setSelectedConversation,
  getOtherParticipant
}: ConversationListProps) {
  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation) => {
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
  )
}
