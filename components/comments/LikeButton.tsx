'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Heart, ThumbsUp, HandHeart, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface Like {
  id: string
  type: string
  userId: string
}

interface LikeButtonProps {
  contentType: 'sermon' | 'blog' | 'comment'
  contentId: string
  likes?: Like[] | null
  likeCount: number
}

const LIKE_TYPES = {
  LIKE: { icon: ThumbsUp, label: 'Like', color: 'text-blue-600' },
  LOVE: { icon: Heart, label: 'Love', color: 'text-red-600' },
  PRAY: { icon: HandHeart, label: 'Pray', color: 'text-purple-600' },
  AMEN: { icon: Sparkles, label: 'Amen', color: 'text-yellow-600' }
}

export function LikeButton({ contentType, contentId, likes = [], likeCount = 0 }: LikeButtonProps) {
  const { data: session } = useSession()
  const [currentLikes, setCurrentLikes] = useState<Like[]>(likes || [])
  const [currentCount, setCurrentCount] = useState(likeCount)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Safely find user like with null checks
  const userLike = currentLikes?.find(like => like?.userId === session?.user?.id)
  const currentLikeType = userLike?.type as keyof typeof LIKE_TYPES

  const handleLike = async (type: string) => {
    if (!session?.user?.id || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          [`${contentType}Id`]: contentId
        })
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      const data = await response.json()
      
      if (data.liked) {
        // Add or update like
        const newLike = { id: 'temp', type: data.type, userId: session.user.id }
        setCurrentLikes(prev => {
          const filtered = (prev || []).filter(like => like?.userId !== session.user.id)
          return [...filtered, newLike]
        })
        if (!userLike) {
          setCurrentCount(prev => prev + 1)
        }
      } else {
        // Remove like
        setCurrentLikes(prev => (prev || []).filter(like => like?.userId !== session.user.id))
        setCurrentCount(prev => prev - 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update reaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <ThumbsUp className="h-4 w-4" />
        <span className="text-sm">{currentCount}</span>
      </div>
    )
  }

  const CurrentIcon = currentLikeType ? LIKE_TYPES[currentLikeType].icon : ThumbsUp
  const currentColor = currentLikeType ? LIKE_TYPES[currentLikeType].color : 'text-gray-500'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`p-0 h-auto hover:bg-transparent ${currentLikeType ? currentColor : 'text-gray-500 hover:text-blue-600'}`}
          disabled={isSubmitting}
        >
          <CurrentIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">{currentCount}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[120px]">
        {Object.entries(LIKE_TYPES).map(([type, config]) => {
          const Icon = config.icon
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => handleLike(type)}
              className={`flex items-center gap-2 ${currentLikeType === type ? config.color : 'text-gray-700'}`}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
