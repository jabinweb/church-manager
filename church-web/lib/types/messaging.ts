import { ConversationType as PrismaConversationType, ParticipantRole as PrismaParticipantRole, MessageType as PrismaMessageType } from '@prisma/client'

// Re-export Prisma enums for consistent usage
export { PrismaConversationType as ConversationType, PrismaParticipantRole as ParticipantRole, PrismaMessageType as MessageType }

export interface ConversationSettings {
  // Direct message settings
  allowFileSharing?: boolean
  
  // Group settings
  allowMemberInvites?: boolean
  requireApprovalToJoin?: boolean
  maxMembers?: number
  
  // Broadcast settings
  allowReplies?: boolean
  allowReactions?: boolean
  onlyAdminsCanPost?: boolean
  
  // Channel settings
  isPublic?: boolean
  category?: string
  tags?: string[]
}

export interface MessageMetadata {
  // File attachments
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileMimeType?: string
  
  // Images/Videos
  thumbnailUrl?: string
  duration?: number // for audio/video
  
  // System messages
  systemAction?: 'join' | 'leave' | 'promote' | 'demote' | 'rename' | 'archive'
  affectedUserIds?: string[]
  
  // Polls
  pollOptions?: Array<{
    id: string
    text: string
    votes: string[] // user IDs
  }>
  pollMultipleChoice?: boolean
  pollExpiresAt?: Date
  
  // Events
  eventId?: string
  eventTitle?: string
  eventDate?: Date
  
  // Rich content
  mentions?: Array<{
    userId: string
    userName: string
    startIndex: number
    length: number
  }>
  links?: Array<{
    url: string
    title?: string
    description?: string
    imageUrl?: string
  }>
}

export interface Conversation {
  id: string
  name?: string
  description?: string
  type: PrismaConversationType
  imageUrl?: string
  settings?: ConversationSettings
  metadata?: any
  isActive: boolean
  isArchived: boolean
  createdById?: string
  createdAt: string
  updatedAt: string
  
  participants: ConversationParticipant[]
  lastMessage?: Message
  unreadCount?: number
}

export interface ConversationParticipant {
  id: string
  conversationId: string
  userId: string
  role: PrismaParticipantRole
  joinedAt: string
  lastReadAt?: string
  isMuted: boolean
  isActive: boolean
  
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
  }
}

export interface Message {
  id: string
  content: string
  type: PrismaMessageType
  senderId?: string
  conversationId: string
  replyToId?: string | undefined // Changed from null to undefined
  metadata?: MessageMetadata | undefined // Changed from null to undefined
  isPinned: boolean
  isEdited: boolean
  editedAt?: string | undefined // Changed from null to undefined
  readBy: string[]
  createdAt: string
  updatedAt: string
  
  sender?: {
    id: string
    name: string | null
    image: string | null
    role: string
  }
  replyTo?: Message
  replies?: Message[]
  reactions?: MessageReaction[]
}

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt: string
  
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

// Export a type alias to avoid conflicts
export type UnifiedConversation = Conversation
export type UnifiedMessage = Message
