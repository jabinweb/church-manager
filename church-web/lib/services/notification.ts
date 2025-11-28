// Define NotificationAction interface for better TypeScript support
export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  actions?: NotificationAction[]
  data?: any
  onClick?: () => void
  onClose?: () => void
  onError?: (error: any) => void
}

export interface NotificationSoundOptions {
  frequency?: number
  duration?: number
  volume?: number
  type?: OscillatorType
}

export class NotificationService {
  private static instance: NotificationService
  private audioContext: AudioContext | null = null
  private permission: NotificationPermission = 'default'
  private isWindowFocused: boolean = true
  private soundEnabled: boolean = true

  private constructor() {
    this.initializeService()
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private initializeService() {
    if (typeof window === 'undefined') return

    // Initialize notification permission
    if ('Notification' in window) {
      this.permission = Notification.permission
    }

    // Initialize audio context
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('AudioContext not supported:', error)
    }

    // Track window focus more reliably
    this.trackWindowFocus()
  }

  private trackWindowFocus() {
    const handleFocus = () => {
      console.log('Window focused')
      this.isWindowFocused = true
    }
    
    const handleBlur = () => {
      console.log('Window blurred')
      this.isWindowFocused = false
    }

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      console.log('Visibility changed:', isVisible)
      this.isWindowFocused = isVisible && document.hasFocus()
    }

    // Use multiple event listeners for better detection
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Set initial state
    this.isWindowFocused = !document.hidden && document.hasFocus()

    // Cleanup function
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    if (this.permission === 'granted') {
      return 'granted'
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  public getPermission(): NotificationPermission {
    return this.permission
  }

  public isSupported(): boolean {
    return 'Notification' in window
  }

  public isWindowInFocus(): boolean {
    return this.isWindowFocused
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
  }

  public async show(options: NotificationOptions): Promise<Notification | null> {
    
    // Show notification if window is not focused OR if explicitly requested
    if (this.isWindowFocused && !options.requireInteraction) {
      console.log('Skipping notification - window is focused and not required')
      return null
    }

    // Check permission
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted:', this.permission)
      return null
    }

    try {
      // Create notification options with proper browser API structure
      const browserNotificationOptions = {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: false, // Always set to false so we can control sound manually
        data: options.data
      } as any

      // Only add actions if the browser supports them
      if ('actions' in Notification.prototype && options.actions) {
        browserNotificationOptions.actions = options.actions
      }

      // Create notification with title and options
      const notification = new Notification(options.title, browserNotificationOptions)

      // Play notification sound if enabled and not silent
      if (this.soundEnabled && !options.silent) {
        console.log('Playing notification sound')
        // Use setTimeout to ensure audio context is ready
        setTimeout(() => {
          this.playNotificationSound()
        }, 100)
      }

      // Set up event handlers
      if (options.onClick) {
        notification.onclick = (event) => {
          console.log('Notification clicked')
          event.preventDefault()
          window.focus()
          options.onClick?.()
          notification.close()
        }
      }

      if (options.onClose) {
        notification.onclose = options.onClose
      }

      if (options.onError) {
        notification.onerror = (error) => {
          console.error('Notification error:', error)
          options.onError?.(error)
        }
      }

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          console.log('Auto-closing notification')
          notification.close()
        }, 5000)
      }

      return notification
    } catch (error) {
      console.error('Error showing notification:', error)
      options.onError?.(error)
      return null
    }
  }

  public playNotificationSound(options: NotificationSoundOptions = {}): void {
    console.log('playNotificationSound called, soundEnabled:', this.soundEnabled)
    
    if (!this.soundEnabled) {
      console.log('Sound disabled, skipping')
      return
    }

    // Try to play a simple beep sound first
    this.playSystemBeep()

    // Also try Web Audio API
    if (this.audioContext) {
      this.playWebAudioSound(options)
    }
  }

  private playSystemBeep(): void {
    try {
      // Create a simple audio element for system beep
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYTBkOa3PbMcCMEJHzA9t+UPwgVY7Tr7ZxPDwtCptPzu2ESDUSa2/fNayEEJ3bE9uKQPwkSY6/k7KdTGAhJqeXzuV8SDUGm0PPfNwsGJ3/A9+KRNS0FNKzX8Lx1IAoaX6rf9qpTFQ1MqN/2wXIgCALx1+DMXys')
      audio.volume = 0.3
      audio.play().catch(e => console.log('System beep failed:', e))
    } catch (error) {
      console.log('System beep not available')
    }
  }

  private playWebAudioSound(options: NotificationSoundOptions = {}): void {
    if (!this.audioContext) return

    try {
      const audioContext = this.audioContext
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      const {
        frequency = 800,
        duration = 0.3,
        volume = 0.3,
        type = 'sine'
      } = options

      // Create oscillator and gain nodes
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure sound
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(frequency * 0.75, audioContext.currentTime + duration * 0.3)

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration)

      // Play sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)

      console.log('Web Audio sound played successfully')
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }

  public showMessageNotification(senderName: string, message: string, senderImage?: string, conversationId?: string): Promise<Notification | null> {
    
    return this.show({
      title: `New message from ${senderName}`,
      body: message,
      icon: senderImage || '/favicon.ico',
      tag: conversationId ? `message-${conversationId}` : 'message',
      data: { type: 'message', conversationId, senderName },
      onClick: () => {
        console.log('Message notification clicked')
        // This will be handled by the component using the service
        window.dispatchEvent(new CustomEvent('notificationClick', {
          detail: { type: 'message', conversationId, senderName }
        }))
      }
    })
  }

  public showSystemNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<Notification | null> {
    const icons = {
      info: '/favicon.ico',
      success: '/favicon.ico',
      warning: '/favicon.ico',
      error: '/favicon.ico'
    }

    return this.show({
      title,
      body: message,
      icon: icons[type],
      tag: `system-${type}`,
      data: { type: 'system', level: type }
    })
  }

  public clearAllNotifications(): void {
    // Note: There's no direct way to clear all notifications
    // This is a limitation of the Notifications API
    console.log('Clearing notifications (browser-dependent)')
  }

  public destroy(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()
