'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  SkipBack, 
  SkipForward,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// YouTube API type declarations
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface VideoPlayerProps {
  src: string
  title: string
  poster?: string
  className?: string
}

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

// Helper function to check if URL is a YouTube video
const isYouTubeVideo = (url: string): boolean => {
  return getYouTubeVideoId(url) !== null
}

export function VideoPlayer({ src, title, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null) // YouTube player instance
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [youtubeReady, setYoutubeReady] = useState(false)

  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>()
  const timeUpdateRef = useRef<NodeJS.Timeout | undefined>()
  const isYouTube = isYouTubeVideo(src)
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(src) : null

  // Load YouTube API
  useEffect(() => {
    if (!isYouTube) return

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initYouTubePlayer()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)

      window.onYouTubeIframeAPIReady = () => {
        initYouTubePlayer()
      }
    }

    const initYouTubePlayer = () => {
      if (!youtubeVideoId) return

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: youtubeVideoId,
        playerVars: {
          controls: 0, // Hide YouTube controls
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 1,
          enablejsapi: 1,
          disablekb: 1, // Disable keyboard controls
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready')
            setIsLoading(false)
            setYoutubeReady(true)
            setDuration(event.target.getDuration())
            setVolume(event.target.getVolume())
            
            // Start time tracking
            startTimeTracking()
          },
          onStateChange: (event: any) => {
            const state = event.data
            setIsPlaying(state === window.YT.PlayerState.PLAYING)
            
            if (state === window.YT.PlayerState.PLAYING) {
              startTimeTracking()
            } else {
              stopTimeTracking()
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data)
            setIsLoading(false)
          }
        }
      })
    }

    const startTimeTracking = () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current)
        timeUpdateRef.current = undefined
      }
      
      timeUpdateRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime())
        }
      }, 100) as NodeJS.Timeout
    }

    const stopTimeTracking = () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current)
        timeUpdateRef.current = undefined
      }
    }

    loadYouTubeAPI()

    return () => {
      stopTimeTracking()
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [isYouTube, youtubeVideoId])

  // Regular video setup
  useEffect(() => {
    if (isYouTube) return

    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isYouTube])

  const togglePlay = () => {
    if (isYouTube && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    } else {
      const video = videoRef.current
      if (!video) return

      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    
    if (isYouTube && playerRef.current) {
      playerRef.current.seekTo(newTime, true)
    } else {
      const video = videoRef.current
      if (!video) return
      video.currentTime = newTime
    }
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    
    if (isYouTube && playerRef.current) {
      playerRef.current.setVolume(newVolume)
      if (newVolume === 0) {
        playerRef.current.mute()
        setIsMuted(true)
      } else {
        playerRef.current.unMute()
        setIsMuted(false)
      }
    } else {
      const video = videoRef.current
      if (!video) return
      
      video.volume = newVolume / 100
      setIsMuted(newVolume === 0)
    }
    setVolume(newVolume)
  }

  const toggleMute = () => {
    if (isYouTube && playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute()
        setIsMuted(false)
      } else {
        playerRef.current.mute()
        setIsMuted(true)
      }
    } else {
      const video = videoRef.current
      if (!video) return

      if (isMuted) {
        video.volume = volume / 100
        setIsMuted(false)
      } else {
        video.volume = 0
        setIsMuted(true)
      }
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (containerRef.current) {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen()
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            await (containerRef.current as any).webkitRequestFullscreen()
          } else if ((containerRef.current as any).msRequestFullscreen) {
            await (containerRef.current as any).msRequestFullscreen()
          }
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    
    if (isYouTube && playerRef.current) {
      playerRef.current.seekTo(newTime, true)
    } else {
      const video = videoRef.current
      if (!video) return
      video.currentTime = newTime
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (isYouTube && playerRef.current) {
      playerRef.current.setPlaybackRate(rate)
    } else {
      const video = videoRef.current
      if (!video) return
      video.playbackRate = rate
    }
    setPlaybackRate(rate)
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000) as NodeJS.Timeout
  }

  const openInYouTube = () => {
    if (youtubeVideoId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeVideoId}`, '_blank')
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group aspect-video",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isYouTube ? (
        // YouTube player with hidden controls
        <div className="relative w-full h-full">
          {/* Loading overlay for YouTube */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
                <p className="text-white text-sm">Loading YouTube video...</p>
              </div>
            </div>
          )}
          
          {/* YouTube iframe with hidden controls */}
          <div id="youtube-player" className="w-full h-full" />
        </div>
      ) : (
        // Regular video player
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          playsInline
        />
      )}

      {/* Loading overlay for regular videos */}
      {!isYouTube && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Top overlay with title and YouTube link */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium text-lg truncate">{title}</h3>
            {isYouTube && (
              <Button
                variant="secondary"
                size="sm"
                onClick={openInYouTube}
                className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm border border-white/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                YouTube
              </Button>
            )}
          </div>
        </div>

        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4 backdrop-blur-sm"
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </Button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(-10)}
                className="text-white hover:bg-white/20 p-2"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 p-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(10)}
                className="text-white hover:bg-white/20 p-2"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* Volume control */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20 p-2"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Playback speed */}
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(Number(e.target.value))}
                className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1"
              >
                <option value={0.25} className="text-black">0.25x</option>
                <option value={0.5} className="text-black">0.5x</option>
                <option value={0.75} className="text-black">0.75x</option>
                <option value={1} className="text-black">1x</option>
                <option value={1.25} className="text-black">1.25x</option>
                <option value={1.5} className="text-black">1.5x</option>
                <option value={2} className="text-black">2x</option>
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 p-2"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
