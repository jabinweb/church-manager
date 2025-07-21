'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Clock, Wrench } from 'lucide-react'

export default function MaintenancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/maintenance-check')
        if (response.ok) {
          const { maintenanceMode } = await response.json()
          
          // If maintenance mode is off, redirect to home
          if (!maintenanceMode) {
            router.push('/')
            return
          }
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
        // If there's an error, redirect to home to be safe
        router.push('/')
        return
      }
      
      setLoading(false)
    }

    checkMaintenanceMode()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="h-10 w-10 text-white animate-bounce" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Under Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            We&apos;re currently performing scheduled maintenance to improve your experience. 
            Please check back in a few minutes.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Expected downtime: 30 minutes</span>
          </div>
          <p className="text-sm text-gray-500">
            For urgent matters, contact us at{' '}
            <a href="mailto:support@mlmpro.com" className="text-blue-600 hover:underline">
              support@mlmpro.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
