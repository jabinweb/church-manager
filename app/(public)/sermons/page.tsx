'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Download, 
  Calendar, 
  Clock, 
  User,
  Search,
  Filter,
  Mic,
  BookOpen
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useState as useDialogState } from 'react'
import SermonThumbnail from '@/components/sermon/SermonThumbnail'

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
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeries, setSelectedSeries] = useState('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playerSermon, setPlayerSermon] = useState<Sermon | null>(null)

  useEffect(() => {
    fetchSermons()
  }, [])

  const fetchSermons = async () => {
    try {
      const response = await fetch('/api/sermons')
      if (response.ok) {
        const data = await response.json()
        setSermons(data.sermons || [])
      }
    } catch (error) {
      console.error('Error fetching sermons:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSermons = sermons.filter(sermon => {
    const matchesSearch = sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sermon.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sermon.series && sermon.series.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSeries = selectedSeries === 'all' || sermon.series === selectedSeries
    return matchesSearch && matchesSeries && sermon.isPublished
  })

  const uniqueSeries = Array.from(new Set(sermons.filter(s => s.series).map(s => s.series)))

  const handleCardClick = (sermon: Sermon) => {
    router.push(`/sermons/${sermon.slug}`)
  }

  const handlePlay = (sermon: Sermon) => {
    setPlayerSermon(sermon)
    setPlayerOpen(true)
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sermons, speakers, or series..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedSeries} 
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Series</option>
                  {uniqueSeries.map((series) => (
                    <option key={series ?? ''} value={series ?? ''}>{series ?? 'Unknown Series'}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sermons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="text-center py-16">
            <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sermons found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSermons.map((sermon, index) => (
              <motion.div
                key={sermon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCardClick(sermon)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${sermon.title}`}
                >
                  <SermonThumbnail
                    title={sermon.title}
                    videoUrl={sermon.videoUrl}
                    audioUrl={sermon.audioUrl}
                    className="rounded-t-lg"
                    aspectRatio="video"
                    priority={index < 3}
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {sermon.series && (
                          <Badge variant="secondary" className="mb-2">
                            {sermon.series}
                          </Badge>
                        )}
                        <CardTitle className="text-lg mb-2">{sermon.title}</CardTitle>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {sermon.speaker}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(sermon.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {sermon.duration && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {sermon.duration}
                      </div>
                    )}
                    
                    {sermon.scriptureReference && (
                      <div className="flex items-center text-sm text-purple-600">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {sermon.scriptureReference}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {sermon.videoUrl && (
                          <Dialog open={playerOpen && playerSermon?.id === sermon.id} onOpenChange={setPlayerOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={e => {
                                  e.stopPropagation()
                                  handlePlay(sermon)
                                }}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Watch
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{sermon.title}</DialogTitle>
                              </DialogHeader>
                              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe
                                  src={sermon.videoUrl}
                                  title={sermon.title}
                                  allow="autoplay; encrypted-media"
                                  allowFullScreen
                                  className="w-full h-72 rounded"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {sermon.audioUrl && (
                          <Dialog open={playerOpen && playerSermon?.id === sermon.id} onOpenChange={setPlayerOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation()
                                  handlePlay(sermon)
                                }}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Listen
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>{sermon.title}</DialogTitle>
                              </DialogHeader>
                              <audio controls autoPlay className="w-full mt-4">
                                <source src={sermon.audioUrl} />
                                Your browser does not support the audio element.
                              </audio>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      {sermon.audioUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation()
                            if (sermon.audioUrl) {
                              window.open(sermon.audioUrl, '_blank')
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {sermon.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {sermon.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
