'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useCallContext } from '@/lib/contexts/CallContext'

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function CallScreen() {
  const { 
    callState, 
    localStream, 
    remoteStream, 
    endCall, 
    toggleMute, 
    toggleVideo, 
    toggleSpeaker 
  } = useCallContext()
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isActive = ['calling', 'ringing', 'connecting', 'connected'].includes(callState.status)
  const isVideoCall = callState.type === 'video'
  const otherParty = callState.isOutgoing ? callState.receiver : callState.caller

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (callState.status === 'connected' && callState.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callState.startTime!.getTime()) / 1000)
        setDuration(elapsed)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callState.status, callState.startTime])

  if (!isActive || !otherParty) return null

  const getStatusText = () => {
    switch (callState.status) {
      case 'calling':
        return 'Calling...'
      case 'ringing':
        return 'Ringing...'
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return formatDuration(duration)
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed z-[100] bg-gray-900 flex flex-col",
        isFullscreen 
          ? "inset-0" 
          : "bottom-4 right-4 w-[400px] h-[500px] rounded-2xl shadow-2xl overflow-hidden"
      )}
    >
      {/* Video Area */}
      <div className="relative flex-1 bg-gray-800">
        {/* Remote Video (or avatar for audio calls) */}
        {isVideoCall && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            {otherParty.image ? (
              <Image
                src={otherParty.image}
                alt={otherParty.name}
                width={150}
                height={150}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-5xl font-bold">
                  {otherParty.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {isVideoCall && localStream && (
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="absolute top-4 right-4 w-24 h-32 md:w-32 md:h-44 rounded-xl overflow-hidden shadow-lg border-2 border-white/20"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!callState.isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-white" />
              </div>
            )}
          </motion.div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isVideoCall && otherParty.image && (
                <Image
                  src={otherParty.image}
                  alt={otherParty.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-white font-semibold">{otherParty.name}</h3>
                <p className="text-white/70 text-sm">{getStatusText()}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Calling Animation (when waiting) */}
        {callState.status === 'calling' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping opacity-75">
                <div className="w-40 h-40 rounded-full border-4 border-white/30"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900/95 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute Button */}
          <Button
            onClick={toggleMute}
            className={cn(
              "w-12 h-12 rounded-full",
              callState.isMuted 
                ? "bg-white text-gray-900 hover:bg-gray-200" 
                : "bg-gray-700 text-white hover:bg-gray-600"
            )}
          >
            {callState.isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Video Toggle (only for video calls) */}
          {isVideoCall && (
            <Button
              onClick={toggleVideo}
              className={cn(
                "w-12 h-12 rounded-full",
                !callState.isVideoEnabled 
                  ? "bg-white text-gray-900 hover:bg-gray-200" 
                  : "bg-gray-700 text-white hover:bg-gray-600"
              )}
            >
              {callState.isVideoEnabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* End Call Button */}
          <Button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </Button>

          {/* Speaker Toggle */}
          <Button
            onClick={toggleSpeaker}
            className={cn(
              "w-12 h-12 rounded-full",
              callState.isSpeakerOn 
                ? "bg-white text-gray-900 hover:bg-gray-200" 
                : "bg-gray-700 text-white hover:bg-gray-600"
            )}
          >
            {callState.isSpeakerOn ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>

          {/* More Options */}
          <Button
            className="w-12 h-12 rounded-full bg-gray-700 text-white hover:bg-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
