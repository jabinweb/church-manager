'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const router = useRouter()

  const handleRetry = () => {
    if (navigator.onLine) {
      router.back()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;re Offline
          </h1>
          <p className="text-gray-600 mb-6">
            Please check your internet connection and try again.
          </p>
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
