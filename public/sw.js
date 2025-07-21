const CACHE_NAME = 'grace-church-v1'
const STATIC_CACHE_NAME = 'grace-church-static-v1'
const DYNAMIC_CACHE_NAME = 'grace-church-dynamic-v1'

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching essential files')
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ]).catch(error => {
        console.error('Service Worker: Failed to cache files', error)
      })
    })
  )
  
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, then cache
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache first
    event.respondWith(handleStaticAssets(request))
  } else if (url.pathname.startsWith('/admin')) {
    // Admin pages - network first
    event.respondWith(handleAdminRequest(request))
  } else {
    // Regular pages - network first, then cache
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests with church-specific caching
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone())
    
    // Cache successful GET responses for church data
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      
      // Cache church content for offline access
      if (url.pathname.includes('/sermons') || 
          url.pathname.includes('/events') || 
          url.pathname.includes('/news') ||
          url.pathname.includes('/blog')) {
        cache.put(request, networkResponse.clone())
      }
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for church API calls
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable',
        offline: true,
        message: 'You are currently offline. Some church features may not be available.',
        churchOfflineMode: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle admin requests (always require network)
async function handleAdminRequest(request) {
  try {
    return await fetch(request)
  } catch (error) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Admin Offline</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Admin Access Requires Internet</h1>
          <p>Church administration features require an internet connection.</p>
          <button onclick="location.reload()">Try Again</button>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// Handle static assets
async function handleStaticAssets(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Try network
    const networkResponse = await fetch(request)
    
    // Cache the response
    const cache = await caches.open(STATIC_CACHE_NAME)
    cache.put(request, networkResponse.clone())
    
    return networkResponse
  } catch (error) {
    // Return cached version or fail silently for assets
    return caches.match(request)
  }
}

// Handle page requests
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline')
    return offlineResponse || new Response('Offline', { status: 503 })
  }
}

// Background sync for offline church actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'prayer-requests-sync') {
    event.waitUntil(syncPrayerRequests())
  } else if (event.tag === 'donations-sync') {
    event.waitUntil(syncDonations())
  } else if (event.tag === 'sermon-notes-sync') {
    event.waitUntil(syncSermonNotes())
  } else if (event.tag === 'event-registration-sync') {
    event.waitUntil(syncEventRegistrations())
  } else if (event.tag === 'member-attendance-sync') {
    event.waitUntil(syncMemberAttendance())
  }
})

// Sync cart data when online
async function syncCart() {
  try {
    // Get stored cart data
    const cartData = await getStoredData('cart')
    if (cartData) {
      // Sync with server
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      })
      
      // Clear stored data
      await clearStoredData('cart')
    }
  } catch (error) {
    console.error('Cart sync failed:', error)
  }
}

// Sync order data when online
async function syncOrders() {
  try {
    const orderData = await getStoredData('orders')
    if (orderData) {
      await fetch('/api/orders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
      
      await clearStoredData('orders')
    }
  } catch (error) {
    console.error('Order sync failed:', error)
  }
}

// Sync prayer requests when online
async function syncPrayerRequests() {
  try {
    const prayerData = await getStoredData('prayer-requests')
    if (prayerData) {
      await fetch('/api/prayer-requests/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prayerData)
      })
      await clearStoredData('prayer-requests')
    }
  } catch (error) {
    console.error('Prayer requests sync failed:', error)
  }
}

// Sync donations when online
async function syncDonations() {
  try {
    const donationData = await getStoredData('donations')
    if (donationData) {
      await fetch('/api/donations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData)
      })
      await clearStoredData('donations')
    }
  } catch (error) {
    console.error('Donation sync failed:', error)
  }
}

// Sync sermon notes when online
async function syncSermonNotes() {
  try {
    const notesData = await getStoredData('sermon-notes')
    if (notesData) {
      await fetch('/api/sermon-notes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notesData)
      })
      await clearStoredData('sermon-notes')
    }
  } catch (error) {
    console.error('Sermon notes sync failed:', error)
  }
}

// Sync event registrations when online
async function syncEventRegistrations() {
  try {
    const registrationData = await getStoredData('event-registrations')
    if (registrationData) {
      await fetch('/api/events/registrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      })
      await clearStoredData('event-registrations')
    }
  } catch (error) {
    console.error('Event registration sync failed:', error)
  }
}

// Sync member attendance when online
async function syncMemberAttendance() {
  try {
    const attendanceData = await getStoredData('member-attendance')
    if (attendanceData) {
      await fetch('/api/members/attendance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      })
      await clearStoredData('member-attendance')
    }
  } catch (error) {
    console.error('Member attendance sync failed:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const data = event.data ? event.data.json() : {}
  const options = {
    body: data.body || 'New church update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1,
      type: data.type || 'general',
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Update',
        icon: '/icons/action-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ],
    requireInteraction: data.type === 'urgent',
    tag: data.type || 'church-update'
  }
  
  const title = data.title || 'Grace Community Church'
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  const notificationData = event.notification.data
  let urlToOpen = '/'
  
  if (event.action === 'view') {
    urlToOpen = notificationData.url || '/dashboard'
  } else if (event.action === 'close') {
    return // Just close the notification
  } else {
    // Default action based on notification type
    switch (notificationData.type) {
      case 'sermon':
        urlToOpen = '/sermons'
        break
      case 'event':
        urlToOpen = '/events'
        break
      case 'prayer':
        urlToOpen = '/prayer-requests'
        break
      case 'giving':
        urlToOpen = '/giving'
        break
      default:
        urlToOpen = '/'
    }
  }
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Utility functions
async function getStoredData(key) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const response = await cache.match(`/offline-data/${key}`)
    return response ? response.json() : null
  } catch (error) {
    return null
  }
}

async function clearStoredData(key) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    await cache.delete(`/offline-data/${key}`)
  } catch (error) {
    console.error('Failed to clear stored data:', error)
  }
}
