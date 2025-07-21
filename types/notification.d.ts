// Extend the global Notification interface to include newer properties
interface NotificationOptions {
  actions?: NotificationAction[]
  badge?: string
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

// Extend the Notification constructor interface
declare var Notification: {
  new(title: string, options?: NotificationOptions): Notification
  readonly prototype: Notification
  readonly permission: NotificationPermission
  requestPermission(): Promise<NotificationPermission>
  requestPermission(callback: NotificationPermissionCallback): void
}
