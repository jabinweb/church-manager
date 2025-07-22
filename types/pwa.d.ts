declare module 'next-pwa' {
  import { Configuration } from 'webpack'
  
  interface PWAConfig {
    dest: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    buildExcludes?: RegExp[]
    scope?: string
    sw?: string
    runtimeCaching?: any[]
  }

  function withPWA(config: PWAConfig): (nextConfig: any) => any
  export = withPWA
}

// Extend Navigator interface for PWA features
interface Navigator {
  standalone?: boolean
}

// Extend Window interface for PWA events
interface Window {
  workbox?: any
}

// Service Worker Registration with Push Manager
interface ServiceWorkerRegistration {
  showNotification(title: string, options?: NotificationOptions): Promise<void>
  pushManager: PushManager
}

// Push Manager interface
interface PushManager {
  subscribe(options?: PushSubscriptionOptions): Promise<PushSubscription>
  getSubscription(): Promise<PushSubscription | null>
  permissionState(options?: PushSubscriptionOptions): Promise<PushPermissionState>
}

// Push Subscription Options
interface PushSubscriptionOptions {
  userVisibleOnly?: boolean
  applicationServerKey?: string | BufferSource
}

// Push Permission State
type PushPermissionState = 'granted' | 'denied' | 'prompt'

// Push Subscription
interface PushSubscription {
  endpoint: string
  options: PushSubscriptionOptions
  getKey(name: string): ArrayBuffer | null
  toJSON(): PushSubscriptionJSON
  unsubscribe(): Promise<boolean>
}

interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// Notification API extensions
interface NotificationOptions {
  actions?: NotificationAction[]
  badge?: string
  body?: string
  data?: any
  dir?: NotificationDirection
  icon?: string
  image?: string
  lang?: string
  renotify?: boolean
  requireInteraction?: boolean
  silent?: boolean
  tag?: string
  timestamp?: number
  vibrate?: VibratePattern
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

type NotificationDirection = 'auto' | 'ltr' | 'rtl'
