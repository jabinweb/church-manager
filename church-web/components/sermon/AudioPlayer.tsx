'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Download,
  Share2,
  Music
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  src: string
  title: string
  speaker?: string
  duration?: string
  className?: string
}

export function AudioPlayer({ src, title, speaker, duration, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (value[0] / 100) * totalDuration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0] / 100
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(totalDuration, audio.currentTime + seconds))
  }

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.playbackRate = rate
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

  const downloadAudio = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = `${title}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareAudio = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Listen to "${title}" by ${speaker}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <Card className={cn("bg-gradient-to-br from-purple-50 via-white to-blue-50 border-0 shadow-lg", className)}>
      <CardContent className="p-6">
        <audio ref={audioRef} src={src} preload="metadata" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Music className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{title}</h3>
              {speaker && <p className="text-gray-600 text-sm">{speaker}</p>}
              {duration && <p className="text-gray-500 text-xs">{duration}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadAudio}
              className="text-gray-600 hover:text-purple-600"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={shareAudio}
              className="text-gray-600 hover:text-purple-600"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 mb-6">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip(-15)}
              className="text-gray-600 hover:text-purple-600 p-2"
              disabled={isLoading}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={togglePlay}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 rounded-full p-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip(15)}
              className="text-gray-600 hover:text-purple-600 p-2"
              disabled={isLoading}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-4">
            {/* Playback speed */}
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              disabled={isLoading}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Volume control */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-gray-600 hover:text-purple-600 p-2"
                disabled={isLoading}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
