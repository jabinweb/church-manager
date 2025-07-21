interface ConnectionStatusProps {
  isConnected: boolean
  notificationPermission: NotificationPermission
  isWindowFocused: boolean
  soundEnabled: boolean
}

export function ConnectionStatus({
  isConnected,
  notificationPermission,
  isWindowFocused,
  soundEnabled
}: ConnectionStatusProps) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-medium ${
      isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isConnected ? '🟢' : '🔴'}
      {/* {notificationPermission === 'granted' && !isWindowFocused && (
        <span className="ml-2">🔔</span>
      )}
      {soundEnabled && (
        <span className="ml-1">🔊</span>
      )} */}
    </div>
  )
}
