import type { Conversation } from '@/lib/types/messaging'

export const getOtherParticipant = (conversation: Conversation, currentUserId: string) => {
  return conversation.participants.find(p => p.userId !== currentUserId)
}

export const getConversationName = (conversation: Conversation, currentUserId: string) => {
  if (conversation.name) {
    return conversation.name
  }
  
  const otherParticipant = getOtherParticipant(conversation, currentUserId)
  return otherParticipant?.user?.name || 'Unknown User'
}

export const getConversationAvatar = (conversation: Conversation, currentUserId: string) => {
  if (conversation.imageUrl) {
    return conversation.imageUrl
  }
  
  const otherParticipant = getOtherParticipant(conversation, currentUserId)
  return otherParticipant?.user?.image
}

export const getParticipantCount = (conversation: Conversation) => {
  return conversation.participants.length
}

export const getTypingUsers = (
  conversation: Conversation, 
  typingUsers: Set<string>, 
  currentUserId: string
) => {
  return Array.from(typingUsers)
    .filter(userId => 
      userId !== currentUserId && 
      conversation.participants.some(p => p.userId === userId)
    )
    .map(userId => {
      const participant = conversation.participants.find(p => p.userId === userId)
      return participant?.user?.name || 'Someone'
    })
}
