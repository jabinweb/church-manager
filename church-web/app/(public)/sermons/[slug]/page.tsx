'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { 
  ArrowLeftIcon, 
  MessageSquareIcon, 
  Download, 
  Video, 
  Music, 
  Share2,
  BookOpen,
  Calendar,
  Clock,
  Eye
} from 'lucide-react'

// Import shared components
import ContentActions from '@/components/content/ContentActions'
import AuthorBio from '@/components/content/AuthorBio'
import RelatedContent from '@/components/content/RelatedContent'
import SermonThumbnail from '@/components/sermon/SermonThumbnail'
import { VideoPlayer } from '@/components/sermon/VideoPlayer'
import { AudioPlayer } from '@/components/sermon/AudioPlayer'
import { CommentSection } from '@/components/comments/CommentSection'
import { LikeButton } from '@/components/comments/LikeButton'

interface Sermon {
  id: string
  title: string
  slug: string
  speaker: string
  series: string | null
  date: string
  duration: string | null
  views: number
  isPublished: boolean
  audioUrl: string | null
  videoUrl: string | null
  scriptureReference: string | null
  tags: string[]
  description?: string | null
  content?: string
  authorId?: string
  author?: {
    name: string | null
    image: string | null
  }
  commentCount?: number
  likeCount?: number
}

export default function SingleSermonPage() {
  const params = useParams()
  const router = useRouter()
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : ''
  
  const [sermon, setSermon] = useState<Sermon | null>(null)
  const [relatedSermons, setRelatedSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [playerType, setPlayerType] = useState<'video' | 'audio'>('video')

  // For scrolling effects
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!slug) return
    fetch(`/api/sermons/${slug}`)
      .then(res => res.json())
      .then(data => setSermon(data.sermon))
      .catch(() => setSermon(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    // Fetch all sermons for the right sidebar list
    fetch('/api/sermons')
      .then(res => res.json())
      .then(data => setRelatedSermons(data.sermons || []))
      .catch(() => setRelatedSermons([]))
  }, [])

  useEffect(() => {
    // Set default player type based on available URLs
    if (sermon) {
      if (sermon.videoUrl) setPlayerType('video')
      else if (sermon.audioUrl) setPlayerType('audio')
    }
  }, [sermon])

  // Memoize related sermons to prevent unnecessary re-renders
  const filteredRelatedSermons = useMemo(() => {
    if (!sermon || !relatedSermons.length) return [];
    return relatedSermons
      .filter(s => s.slug !== sermon.slug)
      .slice(0, 6)
      .map(s => ({
        ...s,
        // Ensure all sermons have the required base fields
        id: s.id,
        title: s.title,
        slug: s.slug
      }));
  }, [sermon, relatedSermons]);

  const formattedDate = sermon ? format(new Date(sermon.date), 'MMMM dd, yyyy') : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 animate-pulse">Loading sermon...</p>
        </div>
      </div>
    )
  }

  if (!sermon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 px-6">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-full inline-flex mb-4">
                <MessageSquareIcon size={32} className="text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Sermon Not Found</h1>
              <p className="text-gray-500 mb-6">The sermon you&apos;re looking for does not exist or has been removed.</p>
              <Button onClick={() => router.push('/sermons')} className="bg-purple-600 hover:bg-purple-700">
                <ArrowLeftIcon size={16} className="mr-2" />
                Back to Sermons
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCommentClick = () => {
    const commentsSection = document.querySelector('[data-comments]')
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 py-10">
        <div ref={contentRef} className="relative w-full h-full">
          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">           
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Left Sidebar - Social Sharing */}
              <div className="hidden lg:block">
                <ContentActions 
                  title={sermon.title}
                  vertical={true}
                  contentType="sermon"
                  contentId={sermon.id}
                  likes={[]} // Fetch actual likes from API
                  likeCount={sermon.likeCount || 0}
                  commentCount={sermon.commentCount || 0}
                  onCommentClick={handleCommentClick}
                />
              </div>
              
              {/* Main Content */}
              <div className="lg:flex-1 max-w-4xl">
                {/* Mobile sharing */}
                <ContentActions 
                  title={sermon.title}
                  vertical={false}
                  contentType="sermon"
                  contentId={sermon.id}
                  likes={[]} // Fetch actual likes from API
                  likeCount={sermon.likeCount || 0}
                  commentCount={sermon.commentCount || 0}
                  onCommentClick={handleCommentClick}
                  onBack={() => router.push('/sermons')}
                />

                <div className="overflow-hidden">
                 
                  <div className="">
                    {/* Media Toggle */}
                    {(sermon.videoUrl && sermon.audioUrl) && (
                      <div className="flex gap-2 mb-4">
                        <Button
                          variant={playerType === 'video' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlayerType('video')}
                        >
                          <Video className="h-4 w-4 mr-2" /> Video
                        </Button>
                        <Button
                          variant={playerType === 'audio' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlayerType('audio')}
                        >
                          <Music className="h-4 w-4 mr-2" /> Audio
                        </Button>
                      </div>
                    )}
                    
                    {/* Custom Media Players */}
                    <div className="mb-6">
                      {sermon.videoUrl && sermon.audioUrl ? (
                        playerType === 'video' ? (
                          <VideoPlayer
                            src={sermon.videoUrl}
                            title={sermon.title}
                            className="w-full"
                          />
                        ) : (
                          <AudioPlayer
                            src={sermon.audioUrl}
                            title={sermon.title}
                            speaker={sermon.speaker}
                            duration={sermon.duration || undefined}
                            className="w-full"
                          />
                        )
                      ) : sermon.videoUrl ? (
                        <VideoPlayer
                          src={sermon.videoUrl}
                          title={sermon.title}
                          className="w-full"
                        />
                      ) : sermon.audioUrl ? (
                        <AudioPlayer
                          src={sermon.audioUrl}
                          title={sermon.title}
                          speaker={sermon.speaker}
                          duration={sermon.duration || undefined}
                          className="w-full"
                        />
                      ) : (
                        <SermonThumbnail
                          title={sermon.title}
                          videoUrl={sermon.videoUrl}
                          audioUrl={sermon.audioUrl}
                          className="w-full rounded-lg"
                          aspectRatio="video"
                          priority={true}
                          height={400}
                        />
                      )}
                    </div>

                   {/* Sermon Title Header */}
                  <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{sermon.title}</h1>
                    
                    <div className="flex flex-wrap gap-3 md:gap-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={15} className="mr-1.5 text-purple-500" />
                        {formattedDate}
                      </div>
                      
                      <div className="flex items-center">
                        <BookOpen size={15} className="mr-1.5 text-purple-500" />
                        {sermon.speaker}
                      </div>
                      
                      {sermon.duration && (
                        <div className="flex items-center">
                          <Clock size={15} className="mr-1.5 text-purple-500" />
                          {sermon.duration}
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Eye size={15} className="mr-1.5 text-purple-500" />
                        {sermon.views} views
                      </div>
                    </div>
                  </div>
                    
                    {/* Scripture Reference */}
                    {sermon.scriptureReference && (
                      <div className="mb-6 bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-purple-900 mb-1 flex items-center">
                          <BookOpen size={16} className="mr-2 text-purple-700" />
                          Scripture Reference
                        </h3>
                        <p className="text-purple-900">{sermon.scriptureReference}</p>
                      </div>
                    )}

                    {/* Sermon Description */}
                    {sermon.description && (
                      <div className="prose max-w-none text-gray-700 mb-8">
                        <div dangerouslySetInnerHTML={{ __html: sermon.description }} />
                      </div>
                    )}
                    
                    {/* Tags */}
                    {sermon.tags && sermon.tags.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Related Topics:</h4>
                        <div className="flex flex-wrap gap-2">
                          {sermon.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="px-3 py-1 bg-gray-100 hover:bg-purple-50 transition-colors cursor-pointer"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {sermon.audioUrl && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(sermon.audioUrl!, '_blank')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Audio
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/sermons')}
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Sermons
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Sermon engagement */}
                <div className="mb-8 flex items-center gap-6">
                  <LikeButton
                    contentType="sermon"
                    contentId={sermon.id}
                    likes={[]} // Initialize with empty array instead of undefined
                    likeCount={sermon.likeCount || 0}
                  />
                  <div className="flex items-center gap-1 text-gray-500">
                    <MessageSquareIcon className="h-4 w-4" />
                    <span className="text-sm">{sermon.commentCount || 0} comments</span>
                  </div>
                </div>

                {/* Speaker Bio */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                  <AuthorBio
                    title="About the Speaker"
                    name={sermon.speaker}
                    image={null}
                    role="Pastor"
                    bio="Passionate about teaching God's word and helping others grow in their faith."
                  />
                </div>
                
                {/* Comments Section */}
                <div className="mt-10" data-comments>
                  <CommentSection
                    contentType="sermon"
                    contentId={sermon.id}
                    initialCommentCount={sermon.commentCount || 0}
                  />
                </div>
              </div>
              
              {/* Right Sidebar */}
              <div className="lg:w-80 mt-8 lg:mt-0">
                <div className="sticky top-24 space-y-8">
                  {/* Series info if applicable */}
                  {sermon.series && (
                    <Card className="border-0 shadow-md overflow-hidden bg-white">
                      <div className="h-3 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-500"></div>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Part of Series</h3>
                        <p className="text-purple-600 font-medium">{sermon.series}</p>
                        <Button 
                          className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                          onClick={() => router.push(`/sermons/series/${encodeURIComponent(sermon.series || '')}`)}
                        >
                          View Series
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Popular Sermons */}
                  <Card className="border-0 bg-transparent">
                    <CardContent className="p-0">
                      <h3 className="text-lg font-semibold mb-4">Popular Sermons</h3>
                      <div className="space-y-4">
                        {relatedSermons.slice(0, 3).map((s) => (
                          <div 
                            key={s.id} 
                            className="flex gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                            onClick={() => router.push(`/sermons/${s.slug}`)}
                          >
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                              <SermonThumbnail
                                title={s.title}
                                videoUrl={s.videoUrl}
                                audioUrl={s.audioUrl}
                                width={64}
                                height={64}
                                aspectRatio="square"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{s.title}</h4>
                              <p className="text-xs text-gray-500">{s.speaker}</p>
                              <p className="text-xs text-gray-400">{format(new Date(s.date), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/sermons')}>
                        View All Sermons
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
