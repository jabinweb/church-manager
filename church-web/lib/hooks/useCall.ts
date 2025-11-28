'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Peer, { MediaConnection } from 'peerjs'
import { useSession } from 'next-auth/react'
import type { CallState, CallType, CallParticipant, CallSignal } from '@/lib/types/call'
import { 
  playRingtone, 
  playCallingTone, 
  playBusyTone, 
  playEndCallTone, 
  playConnectedTone,
  type TonePlayer 
} from '@/lib/audio/callTones'

const initialCallState: CallState = {
  status: 'idle',
  type: 'audio',
  isOutgoing: false,
  caller: null,
  receiver: null,
  startTime: null,
  endTime: null,
  isMuted: false,
  isVideoEnabled: true,
  isSpeakerOn: false,
  callId: null,
  callerPeerId: null
}

// Global peer instance to survive hot reloads
const globalForPeer = globalThis as unknown as { 
  peerInstance: Peer | undefined
  peerId: string | undefined
}

export function useCall() {
  const { data: session } = useSession()
  const [callState, setCallState] = useState<CallState>(initialCallState)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  
  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)
  const tonePlayerRef = useRef<TonePlayer | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callStateRef = useRef<CallState>(initialCallState)
  const endCallRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const cleanupCallRef = useRef<() => void>(() => {})

  // Keep ref in sync with state
  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  // Stop any playing tone
  const stopTone = useCallback(() => {
    if (tonePlayerRef.current) {
      tonePlayerRef.current.stop()
      tonePlayerRef.current = null
    }
  }, [])

  // Cleanup tones on unmount
  useEffect(() => {
    return () => {
      if (tonePlayerRef.current) {
        tonePlayerRef.current.stop()
        tonePlayerRef.current = null
      }
    }
  }, [])

  // Cleanup function
  const cleanupCall = useCallback(() => {
    console.log('cleanupCall called')
    console.trace('cleanupCall stack trace')
    
    // Stop any playing tone
    stopTone()

    // Close peer call
    if (callRef.current) {
      callRef.current.close()
      callRef.current = null
    }
    
    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      setLocalStream(null)
      localStreamRef.current = null
    }
    
    // Stop remote stream
    setRemoteStream(null)
  }, [stopTone])

  // Keep cleanupCall ref in sync
  useEffect(() => {
    cleanupCallRef.current = cleanupCall
  }, [cleanupCall])

  // End call function
  const endCall = useCallback(async () => {
    const currentState = callStateRef.current
    
    console.log('endCall called, current state:', currentState.status, 'callId:', currentState.callId)
    
    // Send end signal first (before cleanup)
    if (currentState.callId && currentState.caller && currentState.receiver) {
      try {
        console.log('Sending call_ended signal...')
        const response = await fetch('/api/call/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'call_ended',
            callId: currentState.callId,
            callType: currentState.type,
            caller: currentState.caller,
            receiver: currentState.receiver
          })
        })
        const result = await response.json()
        console.log('call_ended signal result:', result)
      } catch (error) {
        console.error('Error sending end call signal:', error)
      }
    } else {
      console.log('No callId or participants, skipping signal')
    }
    
    cleanupCall()
    
    // Play end call tone
    playEndCallTone()
    
    setCallState(prev => ({
      ...prev,
      status: 'ended',
      endTime: new Date()
    }))
    
    setTimeout(() => {
      setCallState(initialCallState)
    }, 2000)
  }, [cleanupCall])

  // Keep endCall ref in sync
  useEffect(() => {
    endCallRef.current = endCall
  }, [endCall])

  // Handle incoming call
  const handleIncomingCall = useCallback((signal: CallSignal) => {
    console.log('Incoming call signal:', signal)
    
    // Play ringtone
    tonePlayerRef.current = playRingtone()
    
    setCallState({
      status: 'ringing',
      type: signal.callType,
      isOutgoing: false,
      caller: signal.caller,
      receiver: signal.receiver,
      startTime: null,
      endTime: null,
      isMuted: false,
      isVideoEnabled: signal.callType === 'video',
      isSpeakerOn: false,
      callId: signal.callId,
      callerPeerId: signal.peerId || null  // Store the caller's peer ID
    })
  }, [])

  // Handle call accepted
  const handleCallAccepted = useCallback(async (signal: CallSignal) => {
    console.log('Call accepted:', signal)
    
    // Stop calling tone
    stopTone()
    
    if (!peerRef.current || !localStreamRef.current) return
    
    // Connect to the receiver's peer using their actual peer ID from the signal
    const receiverPeerId = signal.peerId
    if (!receiverPeerId) {
      console.error('No peer ID in accepted signal')
      return
    }
    
    console.log('Connecting to peer:', receiverPeerId)
    console.log('My peer ID:', peerRef.current.id)
    console.log('My peer open:', peerRef.current.open)
    console.log('My peer disconnected:', peerRef.current.disconnected)
    console.log('My peer destroyed:', peerRef.current.destroyed)
    
    const call = peerRef.current.call(receiverPeerId, localStreamRef.current)
    
    if (!call) {
      console.error('Failed to create call - peerRef.current.call returned undefined')
      return
    }
    
    console.log('Call object created:', call)
    
    call.on('stream', (stream) => {
      console.log('Received remote stream from receiver')
      // Play connected tone
      playConnectedTone()
      setRemoteStream(stream)
      setCallState(prev => ({
        ...prev,
        status: 'connected',
        startTime: new Date()
      }))
    })
    
    call.on('close', () => {
      console.log('Call closed by remote (caller side)')
      // Don't call endCall here as it would send another signal
      // Just cleanup locally
      cleanupCall()
      playEndCallTone()
      setCallState(prev => ({
        ...prev,
        status: 'ended',
        endTime: new Date()
      }))
      setTimeout(() => {
        setCallState(initialCallState)
      }, 2000)
    })
    
    call.on('error', (err) => {
      console.error('Call error (caller side):', err)
      cleanupCall()
      setCallState(initialCallState)
    })
    
    callRef.current = call
    
    setCallState(prev => ({
      ...prev,
      status: 'connecting'
    }))
  }, [cleanupCall, stopTone])

  // Handle call rejected
  const handleCallRejected = useCallback((signal: CallSignal) => {
    console.log('Call rejected:', signal)
    
    cleanupCall()
    
    // Play busy tone briefly then stop
    const busyTone = playBusyTone()
    if (busyTone) {
      setTimeout(() => busyTone.stop(), 1500)
    }
    
    setCallState(prev => ({
      ...prev,
      status: 'rejected',
      endTime: new Date()
    }))
    
    setTimeout(() => {
      setCallState(initialCallState)
    }, 3000)
  }, [cleanupCall])

  // Handle call ended
  const handleCallEnded = useCallback((signal: CallSignal) => {
    console.log('handleCallEnded received signal:', signal)
    console.log('Current call state:', callStateRef.current.status)
    
    cleanupCall()
    
    // Play end call tone
    playEndCallTone()
    
    setCallState(prev => ({
      ...prev,
      status: 'ended',
      endTime: new Date()
    }))
    
    setTimeout(() => {
      setCallState(initialCallState)
    }, 2000)
  }, [cleanupCall])

  // Get stable user ID
  const userId = session?.user?.id

  // Initialize peer connection
  useEffect(() => {
    if (!userId) return

    const basePeerId = `church-${userId}`
    
    // Check if we already have a peer instance for this user
    if (globalForPeer.peerInstance && globalForPeer.peerId === basePeerId) {
      const existingPeer = globalForPeer.peerInstance
      
      // Check if it's still connected
      if (!existingPeer.destroyed && !existingPeer.disconnected) {
        console.log('Reusing existing peer connection:', basePeerId)
        peerRef.current = existingPeer
        return
      }
      
      // Destroy the old disconnected peer
      try {
        existingPeer.destroy()
      } catch (e) {
        // Ignore errors during destroy
      }
    }
    
    // Generate a unique peer ID with timestamp to avoid conflicts
    const uniquePeerId = `${basePeerId}-${Date.now()}`
    
    const peer = new Peer(uniquePeerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    })

    peer.on('open', (id) => {
      console.log('Peer connected with ID:', id)
      globalForPeer.peerInstance = peer
      globalForPeer.peerId = basePeerId
    })

    peer.on('call', async (incomingCall) => {
      console.log('Incoming peer call from:', incomingCall.peer)
      console.log('Current call state:', callStateRef.current.status)
      console.log('Local stream available:', !!localStreamRef.current)
      
      callRef.current = incomingCall
      
      // Set up event handlers for the call
      const setupCallHandlers = (stream: MediaStream) => {
        console.log('Setting up call handlers with stream')
        incomingCall.answer(stream)
        
        incomingCall.on('stream', (remoteStr) => {
          console.log('Received remote stream from caller')
          playConnectedTone()
          setRemoteStream(remoteStr)
          setCallState(prev => ({
            ...prev,
            status: 'connected',
            startTime: new Date()
          }))
        })
        
        incomingCall.on('close', () => {
          console.log('Peer call closed by remote')
          cleanupCallRef.current()
          playEndCallTone()
          setCallState(prev => ({
            ...prev,
            status: 'ended',
            endTime: new Date()
          }))
          setTimeout(() => {
            setCallState(initialCallState)
          }, 2000)
        })
        
        incomingCall.on('error', (err) => {
          console.error('Peer call error:', err)
          cleanupCallRef.current()
          setCallState(initialCallState)
        })
      }
      
      // If we have a local stream ready, answer immediately
      if (localStreamRef.current) {
        console.log('Answering incoming peer call immediately')
        setupCallHandlers(localStreamRef.current)
      } else {
        console.log('No local stream yet, waiting for it...')
        // Wait for local stream to be available (max 10 seconds)
        let attempts = 0
        const waitForStream = setInterval(() => {
          attempts++
          console.log(`Waiting for stream... attempt ${attempts}`)
          if (localStreamRef.current) {
            clearInterval(waitForStream)
            console.log('Local stream now available, answering call')
            setupCallHandlers(localStreamRef.current)
          } else if (attempts >= 100) { // 10 seconds
            clearInterval(waitForStream)
            console.error('Timeout waiting for local stream')
            setCallState(initialCallState)
          }
        }, 100)
      }
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      
      // Handle "ID taken" error by clearing global reference
      if (err.type === 'unavailable-id') {
        console.log('Peer ID taken, clearing global reference...')
        globalForPeer.peerInstance = undefined
        globalForPeer.peerId = undefined
      }
      
      if (callStateRef.current.status !== 'idle') {
        endCallRef.current()
      }
    })

    peer.on('disconnected', () => {
      console.log('Peer disconnected, attempting to reconnect...')
      if (!peer.destroyed) {
        peer.reconnect()
      }
    })

    peerRef.current = peer

    return () => {
      // Don't destroy on cleanup during development hot reloads
      // The global instance will be reused
    }
  }, [userId])  // Only depend on stable userId primitive

  // Listen for call signals via SSE
  useEffect(() => {
    const handleSSEMessage = (event: CustomEvent) => {
      const data = event.detail
      
      if (data.type === 'call_incoming') {
        handleIncomingCall(data.data as CallSignal)
      } else if (data.type === 'call_accepted') {
        handleCallAccepted(data.data as CallSignal)
      } else if (data.type === 'call_rejected') {
        handleCallRejected(data.data as CallSignal)
      } else if (data.type === 'call_ended') {
        handleCallEnded(data.data as CallSignal)
      }
    }

    window.addEventListener('sseMessage', handleSSEMessage as EventListener)
    
    return () => {
      window.removeEventListener('sseMessage', handleSSEMessage as EventListener)
    }
  }, [handleIncomingCall, handleCallAccepted, handleCallRejected, handleCallEnded])

  const getMediaStream = async (type: CallType): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video'
    }
    
    return await navigator.mediaDevices.getUserMedia(constraints)
  }

  const startCall = async (
    userId: string, 
    userName: string, 
    userImage: string | null, 
    type: CallType
  ) => {
    if (!session?.user?.id || !peerRef.current) {
      console.error('Cannot start call: no session or peer')
      return
    }
    
    try {
      // Get local media stream
      const stream = await getMediaStream(type)
      setLocalStream(stream)
      localStreamRef.current = stream
      
      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const caller: CallParticipant = {
        id: session.user.id,
        name: session.user.name || 'Unknown',
        image: session.user.image
      }
      
      const receiver: CallParticipant = {
        id: userId,
        name: userName,
        image: userImage
      }
      
      setCallState({
        status: 'calling',
        type,
        isOutgoing: true,
        caller,
        receiver,
        startTime: null,
        endTime: null,
        isMuted: false,
        isVideoEnabled: type === 'video',
        isSpeakerOn: false,
        callId,
        callerPeerId: peerRef.current.id  // Store our own peer ID
      })
      
      // Send call signal via API
      await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'call_incoming',
          callId,
          callType: type,
          caller,
          receiver,
          peerId: peerRef.current.id
        })
      })
      
      // Play calling tone (ringback)
      tonePlayerRef.current = playCallingTone()
      
    } catch (error) {
      console.error('Error starting call:', error)
      cleanupCall()
    }
  }

  const acceptCall = async () => {
    if (!session?.user?.id || !peerRef.current || !callState.callId) {
      console.error('Cannot accept call: missing data')
      return
    }
    
    try {
      // Stop ringtone
      stopTone()
      
      // Get local media stream first
      const stream = await getMediaStream(callState.type)
      setLocalStream(stream)
      localStreamRef.current = stream
      
      // Set state to connecting - the peer.on('call') handler will answer when the call arrives
      setCallState(prev => ({
        ...prev,
        status: 'connecting'
      }))
      
      // Send accept signal
      await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'call_accepted',
          callId: callState.callId,
          callType: callState.type,
          caller: callState.caller,
          receiver: callState.receiver,
          peerId: peerRef.current.id
        })
      })
      
    } catch (error) {
      console.error('Error accepting call:', error)
      cleanupCall()
    }
  }

  const rejectCall = async () => {
    if (!callState.callId) return
    
    // Stop ringtone
    stopTone()
    
    // Send reject signal
    await fetch('/api/call/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'call_rejected',
        callId: callState.callId,
        callType: callState.type,
        caller: callState.caller,
        receiver: callState.receiver,
        reason: 'rejected'
      })
    })
    
    cleanupCall()
    setCallState(initialCallState)
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }))
      }
    }
  }

  const toggleSpeaker = () => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }))
  }

  return {
    callState,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker
  }
}
