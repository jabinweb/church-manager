'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  HeartIcon, 
  BookmarkIcon, 
  ShareIcon,
  FacebookIcon,
  TwitterIcon, 
  LinkedInIcon,
  ArrowLeftIcon
} from '@/components/layout/icons'
import { MessageCircle, Link as LinkIcon } from 'lucide-react'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { LikeButton } from '@/components/comments/LikeButton'

interface ContentActionsProps {
  url?: string
  title?: string
  backLink?: string
  onBack?: () => void
  vertical?: boolean
  // Add content interaction props
  contentType?: 'sermon' | 'blog'
  contentId?: string
  likes?: Array<{ id: string; type: string; userId: string }>
  likeCount?: number
  commentCount?: number
  onCommentClick?: () => void
}

export default function ContentActions({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Shared content',
  backLink,
  onBack,
  vertical = true,
  contentType,
  contentId,
  likes = [],
  likeCount = 0,
  commentCount = 0,
  onCommentClick
}: ContentActionsProps) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
  }

  const handleCommentClick = () => {
    if (onCommentClick) {
      onCommentClick()
    } else {
      // Default behavior: scroll to comments section
      const commentsSection = document.querySelector('.comments-section, [data-comments]')
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  if (!vertical) {
    return (
      <div className="flex justify-between items-center mb-6">
        {(backLink || onBack) && (
          <Button variant="outline" size="sm" onClick={onBack || (() => {})}>
            <ArrowLeftIcon size={16} className="mr-2" /> Back
          </Button>
        )}
        <div className="flex gap-2">
          {/* <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full ${liked ? 'text-red-500' : 'text-gray-400'}`}
            onClick={() => setLiked(!liked)}
          >
            <HeartIcon size={16} className={liked ? 'fill-current' : ''} />
          </Button> */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full ${bookmarked ? 'text-yellow-500' : 'text-gray-400'}`}
            onClick={() => setBookmarked(!bookmarked)}
          >
            <BookmarkIcon size={16} className={bookmarked ? 'fill-current' : ''} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400"
            onClick={() => setShowShareMenu(!showShareMenu)}
          >
            <ShareIcon size={16} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-24 flex flex-col space-y-4 items-center">
      <div className="flex flex-col items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full ${liked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
          onClick={() => setLiked(!liked)}
        >
          <HeartIcon size={22} className={liked ? 'fill-current' : ''} />
        </Button>
        <span className="text-xs text-gray-500 mt-1">
          {liked ? 'Liked' : 'Like'}
        </span>
      </div>
      
      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-gray-400 hover:text-purple-500"
          onClick={() => setShowShareMenu(!showShareMenu)}
        >
          <ShareIcon size={22} />
        </Button>
        <span className="text-xs text-gray-500 mt-1 block text-center">Share</span>
        
        {showShareMenu && (
          <div className="absolute left-full ml-2 bg-white shadow-lg rounded-lg p-2 space-y-2 w-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-blue-600"
                  onClick={() => openShareWindow(shareLinks.facebook)}
                >
                  <FacebookIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Share on Facebook</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-blue-400"
                  onClick={() => openShareWindow(shareLinks.twitter)}
                >
                  <TwitterIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Share on Twitter</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-blue-700"
                  onClick={() => openShareWindow(shareLinks.linkedin)}
                >
                  <LinkedInIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Share on LinkedIn</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-full ${copied ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}
                  onClick={copyToClipboard}
                >
                  <LinkIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{copied ? 'Copied!' : 'Copy link'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full ${bookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`}
          onClick={() => setBookmarked(!bookmarked)}
        >
          <BookmarkIcon size={22} className={bookmarked ? 'fill-current' : ''} />
        </Button>
        <span className="text-xs text-gray-500 mt-1">
          {bookmarked ? 'Saved' : 'Save'}
        </span>
      </div>

      {/* Content Interaction Buttons */}
      {contentType && contentId && (
        <div className="flex flex-col items-center space-y-3 pb-4 border-b border-gray-200 w-full">
          {/* Like Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center">
                <LikeButton
                  contentType={contentType}
                  contentId={contentId}
                  likes={likes}
                  likeCount={likeCount}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Like this {contentType}</p>
            </TooltipContent>
          </Tooltip>

          {/* Comment Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentClick}
                className="flex flex-col items-center p-2 h-auto text-gray-600 hover:text-purple-600 hover:bg-purple-50"
              >
                <MessageCircle className="h-5 w-5 mb-1" />
                <span className="text-xs">{commentCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>View comments ({commentCount})</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
