import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '../ui/button'

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
  const [dismissed, setDismissed] = useState(false)

  const shouldShow = notificationPermission === 'default' && !dismissed

  useEffect(() => {
    console.log('NotificationBanner: Current permission:', notificationPermission)
    console.log('NotificationBanner: Should show banner:', shouldShow)
  }, [notificationPermission, shouldShow])

  if (!shouldShow) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 shadow-lg z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-5 w-5" />
          <div>
            <p className="font-medium">Enable notifications to stay updated</p>
            <p className="text-sm text-blue-100">Get notified when you receive new messages</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sound toggle */}
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>Sound</span>
            </button>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              console.log('NotificationBanner: Requesting permission')
              const result = await requestPermission()
              console.log('NotificationBanner: Permission result:', result)
              if (result === 'granted') {
                setDismissed(true)
              }
            }}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('NotificationBanner: Dismissed by user')
              setDismissed(true)
            }}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
