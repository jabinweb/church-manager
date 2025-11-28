'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Play, 
  Download, 
  Calendar, 
  Clock, 
  User,
  BookOpen
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import SermonThumbnail from './SermonThumbnail'

interface Sermon {
  id: string
  title: string
  slug: string
  speaker: string
  series?: string | null | undefined
  date: string
  duration?: string | null | undefined
  views: number
  isPublished: boolean
  audioUrl?: string | null | undefined
  videoUrl?: string | null | undefined
  scriptureReference?: string | null | undefined
  tags: string[]
  imageUrl?: string | undefined
}

interface SermonCardProps {
  sermon: Sermon
  index?: number
  priority?: boolean
  showActions?: boolean
  onClick?: (sermon: Sermon) => void
}

export default function SermonCard({ 
  sermon, 
  index = 0, 
  priority = false, 
  showActions = true,
  onClick 
}: SermonCardProps) {
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playerType, setPlayerType] = useState<'video' | 'audio'>('video')
  const router = useRouter()

  const handleCardClick = () => {
    if (onClick) {
      onClick(sermon)
    } else {
      router.push(`/sermons/${sermon.slug}`)
    }
  }

  const handlePlay = (type: 'video' | 'audio') => {
    setPlayerType(type)
    setPlayerOpen(true)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (sermon.audioUrl) {
      window.open(sermon.audioUrl, '_blank')
    }
  }

  return (
    <>
      <Card
        className="h-full hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={handleCardClick}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${sermon.title}`}
      >
        <SermonThumbnail
          title={sermon.title}
          videoUrl={sermon.videoUrl || null}
          audioUrl={sermon.audioUrl || null}
          className="rounded-t-lg"
          aspectRatio="video"
          priority={priority}
        />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {sermon.series && (
                <Badge variant="secondary" className="mb-2 text-xs">
                  {sermon.series}
                </Badge>
              )}
              <CardTitle className="text-lg leading-tight group-hover:text-purple-600 transition-colors">
                {sermon.title}
              </CardTitle>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{sermon.speaker}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>{new Date(sermon.date).toLocaleDateString()}</span>
              </div>
              
              {sermon.duration && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{sermon.duration}</span>
                </div>
              )}
            </div>
            
            {sermon.scriptureReference && (
              <div className="flex items-center text-sm text-purple-600">
                <BookOpen className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{sermon.scriptureReference}</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {showActions && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                {sermon.videoUrl && (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={e => {
                      e.stopPropagation()
                      handlePlay('video')
                    }}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Watch
                  </Button>
                )}
                {sermon.audioUrl && (
                  <Button
                    size="sm"
                    variant={sermon.videoUrl ? "outline" : "default"}
                    className={!sermon.videoUrl ? "bg-purple-600 hover:bg-purple-700" : ""}
                    onClick={e => {
                      e.stopPropagation()
                      handlePlay('audio')
                    }}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Listen
                  </Button>
                )}
              </div>
              
              {sermon.audioUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  title="Download audio"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Add homepage-specific action when actions are hidden */}
          {!showActions && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-xs text-gray-500">
                <Play className="h-3 w-3 mr-1" />
                {sermon.views} views
              </div>
              <Button variant="outline" size="sm" onClick={handleCardClick}>
                Listen <Play className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
          
          {sermon.tags && sermon.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sermon.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {sermon.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{sermon.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Player Dialog */}
      <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
        <DialogContent className={playerType === 'video' ? "max-w-4xl" : "max-w-lg"}>
          <DialogHeader>
            <DialogTitle>{sermon.title}</DialogTitle>
            <div className="text-sm text-gray-600">
              {sermon.speaker} • {new Date(sermon.date).toLocaleDateString()}
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {playerType === 'video' && sermon.videoUrl ? (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={sermon.videoUrl}
                  title={sermon.title}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : playerType === 'audio' && sermon.audioUrl ? (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{sermon.title}</h3>
                  <p className="text-sm text-gray-600">{sermon.speaker}</p>
                </div>
                <audio controls autoPlay className="w-full">
                  <source src={sermon.audioUrl} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Media not available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
