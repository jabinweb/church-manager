// PWA utility functions

export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

export const isOnline = (): boolean => {
  return navigator.onLine
}

export const addBeforeInstallPromptListener = (callback: (event: any) => void) => {
  window.addEventListener('beforeinstallprompt', callback)
}

export const removeBeforeInstallPromptListener = (callback: (event: any) => void) => {
  window.removeEventListener('beforeinstallprompt', callback)
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications')
  }

  const permission = await Notification.requestPermission()
  return permission
}

// Show local notification
export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options
        })
      })
    }
  }
}

// Show order notification
export const showOrderNotification = (orderTotal: number) => {
  showNotification('Order Confirmed! 🎉', {
    body: `Your order of ₹${orderTotal.toFixed(2)} has been confirmed`,
    icon: '/icons/icon-192x192.png',
    tag: 'order'
  })
}

// Cache management
export const clearCache = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
  }
}

// Background sync registration
export const registerBackgroundSync = (tag: string): void => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return (registration as any).sync.register(tag)
    })
  }
}

// Store data for offline use
export const storeOfflineData = async (key: string, data: any): Promise<void> => {
  if ('caches' in window) {
    const cache = await caches.open('church-manager-dynamic-v1')
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
    await cache.put(`/offline-data/${key}`, response)
  }
}

// Get stored offline data
export const getOfflineData = async (key: string): Promise<any> => {
  if ('caches' in window) {
    const cache = await caches.open('church-manager-dynamic-v1')
    const response = await cache.match(`/offline-data/${key}`)
    return response ? response.json() : null
  }
  return null
}

// Install prompt handling
export const installApp = async (deferredPrompt: any): Promise<boolean> => {
  if (!deferredPrompt) return false

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  return outcome === 'accepted'
}

  
