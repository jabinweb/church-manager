'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Volume2, VolumeX, TestTube } from 'lucide-react'
import { useNotification } from '@/lib/hooks/useNotification'
import { toast } from 'sonner'

export function NotificationSettings() {
  const {
    permission,
    isSupported,
    soundEnabled,
    requestPermission,
    setSoundEnabled,
  } = useNotification()

  const handlePermissionRequest = async () => {
    const newPermission = await requestPermission()
    if (newPermission === 'granted') {
      toast.success('Notifications enabled!')
    } else if (newPermission === 'denied') {
      toast.error('Notifications denied. You can enable them in your browser settings.')
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellOff className="h-5 w-5" />
            <span>Notifications Not Supported</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Your browser doesn&apos;t support notifications. Please use a modern browser for the best experience.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notification Settings</span>
          <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
            {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Disabled' : 'Not Set'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Browser Notifications</Label>
              <p className="text-sm text-gray-600">
                Get notified when you receive new messages or system updates
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {permission === 'granted' ? (
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              ) : permission === 'denied' ? (
                <Badge variant="destructive">Denied</Badge>
              ) : (
                <Button onClick={handlePermissionRequest} size="sm">
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>

          {permission === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Notifications are blocked. To enable them:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Click the lock icon in your browser&apos;s address bar</li>
                <li>• Change notifications from &quot;Block&quot; to &quot;Allow&quot;</li>
                <li>• Refresh this page</li>
              </ul>
            </div>
          )}
        </div>

        {/* Sound Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Notification Sounds</Label>
              <p className="text-sm text-gray-600">
                Play a sound when notifications are shown
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                disabled={permission !== 'granted'}
              />
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-green-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
