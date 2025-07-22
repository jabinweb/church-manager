'use client'

import { useState, useEffect, useCallback } from 'react'
import { notificationService, NotificationOptions } from '@/lib/services/notification'

export interface UseNotificationReturn {
  permission: NotificationPermission
  isSupported: boolean
  isWindowFocused: boolean
  soundEnabled: boolean
  requestPermission: () => Promise<NotificationPermission>
  showNotification: (options: NotificationOptions) => Promise<Notification | null>
  showMessageNotification: (senderName: string, message: string, senderImage?: string, conversationId?: string) => Promise<Notification | null>
  showSystemNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<Notification | null>
  playSound: (options?: { frequency?: number; duration?: number; volume?: number }) => void
  setSoundEnabled: (enabled: boolean) => void
  clearAll: () => void
}

export function useNotification(): UseNotificationReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isWindowFocused, setIsWindowFocused] = useState(true)
  const [soundEnabled, setSoundEnabledState] = useState(true)

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const newPermission = await notificationService.requestPermission()
    setPermission(newPermission)
    return newPermission
  }, [])

  useEffect(() => {
    // Initialize state from service
    setPermission(notificationService.getPermission())
    setIsSupported(notificationService.isSupported())
    setIsWindowFocused(notificationService.isWindowInFocus())

    // Set up listeners for permission changes
    const handleVisibilityChange = () => {
      setIsWindowFocused(notificationService.isWindowInFocus())
    }

    // Listen for focus/blur events
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('blur', handleVisibilityChange)

    // Auto-request permission if default
    if (notificationService.getPermission() === 'default') {
      // Small delay to avoid immediate permission request
      const timer = setTimeout(() => {
        requestPermission()
      }, 2000)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('focus', handleVisibilityChange)
        window.removeEventListener('blur', handleVisibilityChange)
      }
    }

    return () => {
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('blur', handleVisibilityChange)
    }
  }, [requestPermission])

  const showNotification = useCallback(async (options: NotificationOptions): Promise<Notification | null> => {
    return await notificationService.show(options)
  }, [])

  const showMessageNotification = useCallback(async (
    senderName: string, 
    message: string, 
    senderImage?: string, 
    conversationId?: string
  ): Promise<Notification | null> => {
    return await notificationService.showMessageNotification(senderName, message, senderImage, conversationId)
  }, [])

  const showSystemNotification = useCallback(async (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<Notification | null> => {
    return await notificationService.showSystemNotification(title, message, type)
  }, [])

  const playSound = useCallback((options?: { frequency?: number; duration?: number; volume?: number }): void => {
    notificationService.playNotificationSound(options)
  }, [])

  const setSoundEnabled = useCallback((enabled: boolean): void => {
    setSoundEnabledState(enabled)
    notificationService.setSoundEnabled(enabled)
  }, [])

  const clearAll = useCallback((): void => {
    notificationService.clearAllNotifications()
  }, [])

  return {
    permission,
    isSupported,
    isWindowFocused,
    soundEnabled,
    requestPermission,
    showNotification,
    showMessageNotification,
    showSystemNotification,
    playSound,
    setSoundEnabled,
    clearAll
  }
}
