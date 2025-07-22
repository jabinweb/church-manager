'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MapPin, User, Clock, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Ministry {
  id: string
  name: string
  description: string | null
  leader: string | null
  meetingTime: string | null
  location: string | null
  isActive: boolean
  imageUrl: string | null
}

export default function MinistryPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const [ministry, setMinistry] = useState<Ministry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/ministries/${id}`)
      .then(res => res.json())
      .then(data => setMinistry(data.ministry))
      .catch(() => setMinistry(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!ministry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Ministry Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              The ministry you are looking for does not exist.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{ministry.name}</CardTitle>
            {ministry.leader && (
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <User className="h-4 w-4 mr-1" />
                Led by {ministry.leader}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              {ministry.description || 'No description available.'}
            </CardDescription>
            <div className="space-y-2 text-sm text-gray-600">
              {ministry.meetingTime && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {ministry.meetingTime}
                </div>
              )}
              {ministry.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {ministry.location}
                </div>
              )}
            </div>
              <Image
                src={ministry.imageUrl || '/placeholder.png'}
                alt={ministry.name}
                className="mt-6 rounded-lg w-full object-cover max-h-72"
                width={800}
                height={288}
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            <div className="mb-6">
              <Link 
                href="/ministries/"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Ministries
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
