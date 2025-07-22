'use client'

import { useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export function PWANotificationHandler() {
  const { data: session } = useSession()

  const subscribeToPushNotifications = useCallback(async (registration: ServiceWorkerRegistration) => {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Use a default VAPID key or skip if not configured
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        
        if (!vapidKey) {
          console.warn('VAPID public key not configured. Push notifications will use basic notifications only.')
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey
        })

        // Send subscription to your backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
            userId: session?.user?.id
          })
        })

        console.log('Push subscription successful')
      }
    } catch (error) {
      console.error('Push subscription failed:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Register service worker for push notifications
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('Service Worker registered:', registration)

          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data

            switch (type) {
              case 'CACHE_UPDATED':
                toast.info('App updated! Refresh to see changes.')
                break
              case 'OFFLINE_MESSAGE':
                toast.warning('You are offline. Some features may not work.')
                break
              case 'ONLINE_MESSAGE':
                toast.success('You are back online!')
                break
              case 'SYNC_COMPLETED':
                toast.success('Sync completed!')
                break
              default:
                break
            }
          })

          // Handle push subscription if user is logged in
          if (session?.user?.id) {
            await subscribeToPushNotifications(registration)
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    }

    registerServiceWorker()
  }, [session?.user?.id, subscribeToPushNotifications])

  // Handle app updates
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleAppUpdate = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration?.waiting) {
            toast.info(
              'New version available!',
              {
                action: {
                  label: 'Update',
                  onClick: () => {
                    registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  }
                }
              }
            )
          }
        })
      }
    }

    // Check for updates when the app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleAppUpdate()
      }
    })

    // Check for updates on focus
    window.addEventListener('focus', handleAppUpdate)

    return () => {
      document.removeEventListener('visibilitychange', handleAppUpdate)
      window.removeEventListener('focus', handleAppUpdate)
    }
  }, [])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      toast.success('You are back online!')
    }

    const handleOffline = () => {
      toast.warning('You are offline. Some features may not work.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}
