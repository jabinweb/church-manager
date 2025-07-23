'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types/messaging'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😯', '😢', '🙏']

interface QuickReactionsProps {
  message: Message
  session: any
  onReactionSelect: (emoji: string) => void
  className?: string
}

export const QuickReactions = memo(({ 
  message, 
  session, 
  onReactionSelect, 
  className 
}: QuickReactionsProps) => {
  // Get user's current reaction (only one allowed)
  const userReaction = message.reactions?.find(
    r => r.userId === session?.user?.id
  )

  return (
    <div className={cn(
      "flex items-center space-x-1 px-1",
      className
    )}>
      {QUICK_REACTIONS.map((emoji) => {
        const isSelected = userReaction?.emoji === emoji
        
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => onReactionSelect(emoji)}
            className={cn(
              "h-7 w-7 p-0 rounded-full hover:bg-gray-100 transition-all duration-200 flex items-center justify-center",
              isSelected && "bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300"
            )}
            title={`React with ${emoji}`}
          >
            <span className="text-base leading-none">{emoji}</span>
          </Button>
        )
      })}
    </div>
  )
})

QuickReactions.displayName = 'QuickReactions'
