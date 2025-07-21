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
} from '@/components/icons'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface ContentActionsProps {
  url?: string
  title?: string
  backLink?: string
  onBack?: () => void
  vertical?: boolean
}

export default function ContentActions({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Shared content',
  backLink,
  onBack,
  vertical = true
}: ContentActionsProps) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleShare = (platform: string) => {
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    
    setShowShareMenu(false);
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
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full ${liked ? 'text-red-500' : 'text-gray-400'}`}
            onClick={() => setLiked(!liked)}
          >
            <HeartIcon size={16} className={liked ? 'fill-current' : ''} />
          </Button>
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
                  onClick={() => handleShare('facebook')}
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
                  onClick={() => handleShare('twitter')}
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
                  onClick={() => handleShare('linkedin')}
                >
                  <LinkedInIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Share on LinkedIn</p>
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
    </div>
  )
}
