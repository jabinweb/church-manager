import { toast } from 'sonner'

interface NotificationBannerProps {
  notificationPermission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

export function NotificationBanner({
  notificationPermission,
  requestPermission,
  soundEnabled,
  setSoundEnabled
}: NotificationBannerProps) {
  if (notificationPermission !== 'default') return null

  return (
    <div className="fixed top-16 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm">
      <div className="flex items-start space-x-2">
        <div className="text-blue-600">🔔</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Enable Notifications</p>
          <p className="text-xs text-blue-700 mt-1">
            Get notified when you receive new messages
          </p>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={async () => {
                const permission = await requestPermission()
                if (permission === 'granted') {
                  toast.success('Notifications enabled!')
                } else {
                  toast.error('Notifications denied')
                }
              }}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Enable
            </button>
            <button
              onClick={() => {
                toast.info('You can enable notifications later in settings')
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-xs p-1 rounded hover:bg-blue-100"
          title={soundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  )
}
