'use client'

// Audio context singleton
let audioContext: AudioContext | null = null

const getAudioContext = (): AudioContext => {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext!
}

export interface TonePlayer {
  stop: () => void
}

// Generate a ringtone pattern (incoming call sound)
export function playRingtone(): TonePlayer | null {
  if (typeof window === 'undefined') return null
  
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    let isPlaying = true
    let timeoutId: NodeJS.Timeout | null = null
    let oscillator: OscillatorNode | null = null
    let gainNode: GainNode | null = null
    
    const playTone = () => {
      if (!isPlaying) return
      
      oscillator = ctx.createOscillator()
      gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Classic phone ring frequencies
      oscillator.frequency.setValueAtTime(440, ctx.currentTime) // A4
      oscillator.frequency.setValueAtTime(480, ctx.currentTime + 0.1) // Alternating
      
      oscillator.type = 'sine'
      
      // Ring pattern: on for 1s, off for 2s
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime + 1)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 1)
      
      // Schedule next ring
      timeoutId = setTimeout(playTone, 3000)
    }
    
    playTone()
    
    return {
      stop: () => {
        isPlaying = false
        if (timeoutId) clearTimeout(timeoutId)
        if (oscillator) {
          try { oscillator.stop() } catch (e) {}
        }
        if (gainNode) {
          gainNode.disconnect()
        }
      }
    }
  } catch (error) {
    console.log('Ringtone generation failed:', error)
    return null
  }
}

// Generate a calling/dialing tone (outgoing call sound)
export function playCallingTone(): TonePlayer | null {
  if (typeof window === 'undefined') return null
  
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    let isPlaying = true
    let timeoutId: NodeJS.Timeout | null = null
    let oscillator: OscillatorNode | null = null
    let gainNode: GainNode | null = null
    
    const playTone = () => {
      if (!isPlaying) return
      
      oscillator = ctx.createOscillator()
      gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Standard ringback tone (North American)
      oscillator.frequency.setValueAtTime(440, ctx.currentTime)
      oscillator.type = 'sine'
      
      // Pattern: 2 seconds on, 4 seconds off
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 2)
      
      // Schedule next tone
      timeoutId = setTimeout(playTone, 6000)
    }
    
    playTone()
    
    return {
      stop: () => {
        isPlaying = false
        if (timeoutId) clearTimeout(timeoutId)
        if (oscillator) {
          try { oscillator.stop() } catch (e) {}
        }
        if (gainNode) {
          gainNode.disconnect()
        }
      }
    }
  } catch (error) {
    console.log('Calling tone generation failed:', error)
    return null
  }
}

// Generate a busy tone
export function playBusyTone(): TonePlayer | null {
  if (typeof window === 'undefined') return null
  
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    let isPlaying = true
    let timeoutId: NodeJS.Timeout | null = null
    let oscillator: OscillatorNode | null = null
    let gainNode: GainNode | null = null
    
    const playTone = () => {
      if (!isPlaying) return
      
      oscillator = ctx.createOscillator()
      gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(480, ctx.currentTime)
      oscillator.type = 'sine'
      
      // Busy pattern: 0.5s on, 0.5s off
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime)
      gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.5)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
      
      timeoutId = setTimeout(playTone, 1000)
    }
    
    playTone()
    
    return {
      stop: () => {
        isPlaying = false
        if (timeoutId) clearTimeout(timeoutId)
        if (oscillator) {
          try { oscillator.stop() } catch (e) {}
        }
        if (gainNode) {
          gainNode.disconnect()
        }
      }
    }
  } catch (error) {
    console.log('Busy tone generation failed:', error)
    return null
  }
}

// Generate a call ended beep
export function playEndCallTone(): void {
  if (typeof window === 'undefined') return
  
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.setValueAtTime(480, ctx.currentTime)
    oscillator.frequency.setValueAtTime(620, ctx.currentTime + 0.15)
    oscillator.frequency.setValueAtTime(480, ctx.currentTime + 0.3)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch (error) {
    console.log('End call tone failed:', error)
  }
}

// Generate a connection established beep
export function playConnectedTone(): void {
  if (typeof window === 'undefined') return
  
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Pleasant ascending tone
    oscillator.frequency.setValueAtTime(523, ctx.currentTime)      // C5
    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1) // E5
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2) // G5
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch (error) {
    console.log('Connected tone failed:', error)
  }
}
