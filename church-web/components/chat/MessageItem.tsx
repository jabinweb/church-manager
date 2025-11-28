'use client'

import { memo, useState } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { MessageContextMenu } from './MessageContextMenu'
import { MessageReactions } from './MessageReactions'
import { QuickReactions } from './QuickReactions'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Smile } from 'lucide-react'
import type { Message, Conversation } from '@/lib/types/messaging'

interface MessageItemProps {
  message: Message
  previousMessage?: Message
  conversation: Conversation
  session: any
  isPending: boolean
  messageStatus: string | null
  onDelete: (messageId: string) => void
  onReply: (message: Message) => void
  onEdit: (messageId: string) => void
  onCopy: (content: string) => void
  onReactionToggle: (messageId: string, emoji: string) => Promise<void>
  renderMessageStatus: (status: string | null) => React.ReactNode
}

export const MessageItem = memo(({
  message,
  previousMessage,
  conversation,
  session,
  isPending,
  messageStatus,
  onDelete,
  onReply,
  onEdit,
  onCopy,
  onReactionToggle,
  renderMessageStatus
}: MessageItemProps) => {
  const [showQuickReactions, setShowQuickReactions] = useState(false)
  const isOwnMessage = message.senderId === session?.user?.id
  const showAvatar = !isOwnMessage && (
    !previousMessage || 
    previousMessage.senderId !== message.senderId ||
    new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 300000
  )

  const handleReactionSelect = async (emoji: string) => {
    await onReactionToggle(message.id, emoji)
    setShowQuickReactions(false)
  }

  return (
    <div
      className={cn(
        "flex items-end space-x-2 flex-shrink-0 relative group w-full",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && (
        <div className="flex-shrink-0 w-6 md:w-8">
          {showAvatar ? (
            message.sender?.image ? (
              <Image
                src={message.sender.image}
                alt={message.sender.name || 'User'}
                width={32}
                height={32}
                className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )
          ) : null}
        </div>
      )}

      {/* Message content container */}
      <div className={cn(
        "flex items-end max-w-[80%]",
        isOwnMessage ? "flex-row space-x-1" : "flex-row-reverse space-x-reverse space-x-1"
      )}>
        {/* Emoji reaction button */}
        <div className="flex items-end pb-2 flex-shrink-0">
          <Popover open={showQuickReactions} onOpenChange={setShowQuickReactions}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100",
                  showQuickReactions && "opacity-100"
                )}
                onClick={() => setShowQuickReactions(!showQuickReactions)}
              >
                <Smile className="h-3 w-3 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-2 bg-white border border-gray-200 rounded-full shadow-lg"
              side={isOwnMessage ? "left" : "right"}
              align="center"
              sideOffset={5}
            >
              <QuickReactions
                message={message}
                session={session}
                onReactionSelect={handleReactionSelect}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Message bubble */}
        <MessageContextMenu
          message={message}
          isOwnMessage={isOwnMessage}
          onDelete={onDelete}
          onReply={onReply}
          onCopy={onCopy}
          onEdit={onEdit}
        >
          <div className="max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px]">
            {/* Reply indicator */}
            {message.replyTo && (
              <div className={cn(
                "text-xs text-gray-500 mb-1 p-2 border-l-2 bg-gray-50 rounded text-xs",
                isOwnMessage ? "border-purple-300" : "border-gray-300"
              )}>
                <div className="font-medium truncate">{message.replyTo.sender?.name}</div>
                <div className="truncate">{message.replyTo.content}</div>
              </div>
            )}

            <div
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-lg transition-opacity cursor-pointer group relative",
                isOwnMessage
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-900",
                isPending && "opacity-70",
                showAvatar ? "rounded-bl-sm" : "",
                isOwnMessage ? "rounded-br-sm" : "rounded-bl-sm"
              )}
            >
              {/* Sender name for group messages */}
              {!isOwnMessage && conversation.type !== 'DIRECT' && showAvatar && (
                <div className="text-xs font-medium mb-1 text-gray-600">
                  {message.sender?.name}
                </div>
              )}

              <p className="break-words text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              
              {/* Message reactions */}
              <MessageReactions
                message={message}
                session={session}
                onReactionToggle={onReactionToggle}
              />

              <div className={cn(
                "flex items-center justify-end mt-1 space-x-1 text-xs",
                isOwnMessage ? "text-purple-200" : "text-gray-500"
              )}>
                <span>
                  {format(new Date(message.createdAt), 'HH:mm')}
                </span>
                {message.isEdited && (
                  <span className="italic">edited</span>
                )}
                {messageStatus && (
                  <div className="flex items-center">
                    {renderMessageStatus(messageStatus)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </MessageContextMenu>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - re-render if reactions change
  const prevReactions = prevProps.message.reactions || []
  const nextReactions = nextProps.message.reactions || []
  
  if (prevReactions.length !== nextReactions.length) return false
  
  // Check if any reaction changed
  const reactionsEqual = prevReactions.every((r, i) => 
    r.id === nextReactions[i]?.id && r.emoji === nextReactions[i]?.emoji
  )
  
  if (!reactionsEqual) return false
  
  // Check other props
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isPending === nextProps.isPending &&
    prevProps.messageStatus === nextProps.messageStatus
  )
})

MessageItem.displayName = 'MessageItem'
