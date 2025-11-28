'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Mic, Video, BookOpen } from 'lucide-react'

interface SermonThumbnailProps {
  title: string
  videoUrl?: string | null
  audioUrl?: string | null
  className?: string
  aspectRatio?: 'video' | 'square'
  fallbackIcon?: 'mic' | 'video' | 'book'
  width?: number
  height?: number
  priority?: boolean
}

export default function SermonThumbnail({
  title,
  videoUrl,
  audioUrl,
  className = "",
  aspectRatio = "video",
  fallbackIcon = "mic",
  width = 500,
  height = 281,
  priority = false
}: SermonThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const getThumbnail = async () => {
      setLoading(true)
      
      // Check if YouTube URL
      if (videoUrl) {
        const youtubeId = extractYoutubeVideoId(videoUrl)
        if (youtubeId) {
          // Use YouTube thumbnail
          setThumbnailUrl(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`)
          setLoading(false)
          return
        }
        
        // Other video URL - could potentially extract poster from metadata
        // This would typically require server-side processing
      }
      
      // Fallback: no thumbnail available
      setThumbnailUrl(null)
      setLoading(false)
    }
    
    getThumbnail()
  }, [videoUrl])

  // Aspect ratio classes
  const aspectRatioClass = aspectRatio === 'video' 
    ? 'aspect-video' 
    : 'aspect-square'
    
  // Fallback icon based on sermon type
  const FallbackIcon = (() => {
    if (fallbackIcon === 'video') return Video
    if (fallbackIcon === 'book') return BookOpen
    return Mic
  })()

  if (loading) {
    return (
      <div 
        className={`${aspectRatioClass} bg-gradient-to-br from-purple-100 to-purple-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
      >
        <FallbackIcon className="h-10 w-10 text-purple-300" />
      </div>
    )
  }
  
  if (thumbnailUrl) {
    return (
      <div className={`${aspectRatioClass} relative overflow-hidden rounded-md ${className}`}>
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover !relative"
          sizes={`(max-width: 768px) 100vw, ${width}px`}
          priority={priority}
        />
        
        {/* Responsive play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all">
          <div className="h-[15%] w-[15%] min-h-8 min-w-8 max-h-12 max-w-12 rounded-full bg-purple-600 bg-opacity-80 flex items-center justify-center shadow-md">
            <Video className="h-[40%] w-[40%] min-h-4 min-w-4 text-white" />
          </div>
        </div>
      </div>
    )
  }
  
  // Fallback
  return (
    <div 
      className={`${aspectRatioClass} bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center rounded-md ${className}`}
      style={{ width: typeof width === 'number' ? `${width}px` : width }}
    >
      {audioUrl ? (
        <Mic className="h-10 w-10 text-purple-500" />
      ) : (
        <FallbackIcon className="h-10 w-10 text-purple-500" />
      )}
    </div>
  )
}

// Helper function to extract YouTube video ID from various YouTube URL formats
function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null
  
  // Regular YouTube watch URLs
  const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  
  if (match && match[2].length === 11) {
    return match[2]
  }
  
  // YouTube embed URLs
  const embedMatch = url.match(/^https?:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
  if (embedMatch) {
    return embedMatch[1]
  }
  
  return null
}
