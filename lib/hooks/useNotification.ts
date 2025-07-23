'use client'

import { useState, useEffect, useCallback } from 'react'

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isWindowFocused, setIsWindowFocused] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    // Check initial notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Track window focus
    const handleFocus = () => {
      console.log('Window focused')
      setIsWindowFocused(true)
    }
    const handleBlur = () => {
      console.log('Window blurred')
      setIsWindowFocused(false)
    }
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      console.log('Visibility changed:', isVisible)
      setIsWindowFocused(isVisible)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      console.log('Notification permission result:', result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [])

  const showMessageNotification = useCallback((
    title: string,
    body: string,
    icon?: string,
    conversationId?: string
  ) => {
    console.log('showMessageNotification called:', { title, body, icon, conversationId, permission, isWindowFocused })
    
    // Don't show notification if window is focused
    if (isWindowFocused) {
      console.log('Window is focused, skipping notification')
      return
    }

    // Check if notifications are supported and permitted
    if (!('Notification' in window) || permission !== 'granted') {
      console.log('Notifications not supported or not granted:', permission)
      return
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: conversationId || 'message',
        requireInteraction: false,
        silent: !soundEnabled
      })

      console.log('Notification created:', notification)

      // Handle notification click
      notification.onclick = () => {
        console.log('Notification clicked for conversation:', conversationId)
        window.focus()
        
        // Focus the conversation if conversationId is provided
        if (conversationId) {
          // Dispatch custom event to focus conversation
          window.dispatchEvent(new CustomEvent('focusConversation', {
            detail: { conversationId }
          }))
        }
        
        notification.close()
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }, [permission, isWindowFocused, soundEnabled])

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return

    try {
      // Create and play notification sound
      const audio = new Audio('/notification.mp3') // Add a notification sound file
      audio.volume = 0.5
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error)
      })
    } catch (error) {
      console.log('Error playing notification sound:', error)
    }
  }, [soundEnabled])

  return {
    permission,
    isWindowFocused,
    requestPermission,
    showMessageNotification,
    playNotificationSound,
    soundEnabled,
    setSoundEnabled
  }
}
