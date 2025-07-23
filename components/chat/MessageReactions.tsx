'use client'

import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Message } from '@/lib/types/messaging'

interface MessageReactionsProps {
  message: Message
  session: any
  onReactionToggle: (messageId: string, emoji: string) => Promise<void>
}

export const MessageReactions = memo(({
  message,
  session,
  onReactionToggle
}: MessageReactionsProps) => {
  const [loading, setLoading] = useState<string | null>(null)

  const handleReactionClick = async (emoji: string) => {
    if (!session?.user?.id) return
    
    setLoading(emoji)
    try {
      await onReactionToggle(message.id, emoji)
    } catch (error) {
      console.error('Error toggling reaction:', error)
      toast.error('Failed to update reaction')
    } finally {
      setLoading(null)
    }
  }

  // Group reactions by emoji and count them
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        userReacted: false
      }
    }
    acc[reaction.emoji].count++
    acc[reaction.emoji].users.push(reaction.user)
    if (reaction.userId === session?.user?.id) {
      acc[reaction.emoji].userReacted = true
    }
    return acc
  }, {} as Record<string, { emoji: string; count: number; users: any[]; userReacted: boolean }>)

  const reactionGroups = Object.values(groupedReactions || {})

  if (reactionGroups.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactionGroups.map((group) => (
        <Button
          key={group.emoji}
          variant="ghost"
          size="sm"
          onClick={() => handleReactionClick(group.emoji)}
          disabled={loading === group.emoji}
          className={cn(
            "h-6 px-2 text-xs rounded-full transition-all hover:scale-105",
            group.userReacted 
              ? "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200" 
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          )}
          title={`${group.users.map(u => u.name).join(', ')} reacted with ${group.emoji}`}
        >
          <span className="mr-1 text-sm">{group.emoji}</span>
          <span className="text-xs font-medium">{group.count}</span>
        </Button>
      ))}
    </div>
  )
})

MessageReactions.displayName = 'MessageReactions'
          