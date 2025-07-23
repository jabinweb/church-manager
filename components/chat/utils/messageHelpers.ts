import React from 'react'
import { Check, CheckCheck, Clock } from 'lucide-react'
import type { Message, Conversation } from '@/lib/types/messaging'

export const getMessageStatus = (
  message: Message, 
  selectedConversation: Conversation | null, 
  pendingMessages: Set<string>, 
  currentUserId: string
) => {
  if (message.senderId !== currentUserId) return null
  
  if (pendingMessages.has(message.id)) {
    return 'pending'
  }
  
  if (selectedConversation?.type === 'DIRECT') {
    const otherParticipant = selectedConversation.participants.find(p => p.userId !== currentUserId)
    if (otherParticipant && message.readBy && message.readBy.includes(otherParticipant.userId)) {
      return 'read'
    }
  } else {
    if (message.readBy && message.readBy.length > 0) {
      return 'read'
    }
  }
  
  return 'delivered'
}

export const renderMessageStatus = (status: string | null): React.ReactNode => {
  switch (status) {
    case 'pending':
      return React.createElement(Clock, { className: "h-3 w-3 opacity-50 text-gray-400" })
    case 'delivered':
      return React.createElement(Check, { className: "h-3 w-3 text-gray-400" })
    case 'read':
      return React.createElement(CheckCheck, { className: "h-3 w-3 text-blue-500" })
    default:
      return null
  }
}

export const createTempMessage = (
  messageContent: string,
  selectedConversation: Conversation,
  replyingTo: Message | null,
  session: any
): Message => ({
  id: `temp-${Date.now()}`,
  content: messageContent,
  type: 'TEXT' as any,
  senderId: session?.user?.id || '',
  conversationId: selectedConversation.id,
  replyToId: replyingTo?.id || undefined,
  metadata: undefined,
  isPinned: false,
  isEdited: false,
  editedAt: undefined,
  readBy: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sender: {
    id: session?.user?.id || '',
    name: session?.user?.name || null,
    image: session?.user?.image || null,
    role: session?.user?.role || ''
  },
  replyTo: replyingTo || undefined,
  replies: [],
  reactions: []
})
