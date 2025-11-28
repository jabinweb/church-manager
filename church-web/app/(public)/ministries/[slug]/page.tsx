'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MapPin, User, Clock, ArrowLeft, Heart, Users, Calendar, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Ministry {
  id: string
  name: string
  slug: string | null
  description: string | null
  leader: string | null
  meetingTime: string | null
  location: string | null
  isActive: boolean
  imageUrl: string | null
}

export default function MinistryPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : ''
  const [ministry, setMinistry] = useState<Ministry | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/ministries/${slug}`)
      .then(res => res.json())
      .then(data => setMinistry(data.ministry))
      .catch(() => setMinistry(null))
      .finally(() => setLoading(false))
  }, [slug])

  const handleJoinMinistry = async () => {

    if (!session) {
      toast.error('Please sign in to join this ministry.')
      router.push('/auth/signin')
      return
    }

    if (!ministry) {
      console.log('No ministry found')
      return
    }

    setJoining(true)
    
    try {
      console.log('Making API request to /api/ministries/join')
      const response = await fetch('/api/ministries/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ministryId: ministry.id,
          position: 'Volunteer'
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        console.log('Join successful!')
        toast.success(`You've successfully joined ${ministry.name}!`, {
          description: "We'll be in touch soon!",
        })
      } else {
        if (response.status === 400 && data.error?.includes('Already volunteering')) {
          console.log('Already volunteering')
          toast.info('Already a Member', {
            description: 'You are already part of this ministry.',
          })
        } else {
          console.log('Error response:', data.error)
          throw new Error(data.error || 'Failed to join ministry')
        }
      }
    } catch (error) {
      console.error('Error joining ministry:', error)
      toast.error('Failed to join ministry', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      console.log('Finally block - setting joining to false')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!ministry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ministry Not Found</h1>
          <p className="text-gray-600 mb-6">The ministry you are looking for does not exist.</p>
          <Link href="/ministries">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ministries
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
      {/* Hero Section with Image */}
      <div className="relative h-[300px] overflow-hidden">
        {ministry.imageUrl ? (
          <div className="absolute inset-0">
            <Image
              src={ministry.imageUrl}
              alt={ministry.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
            {/* Animated gradient orbs */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
        )}
        
        {/* Content overlay */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
          <Link 
            href="/ministries"
            className="text-white/90 hover:text-white text-sm font-medium inline-flex items-center mb-6 w-fit backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full transition-all hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ministries
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {ministry.name}
            </h1>
            {ministry.leader && (
              <div className="flex items-center text-white/90 text-lg">
                <User className="h-5 w-5 mr-2" />
                <span>Led by {ministry.leader}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Ministry</h2>
              <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                {ministry.description || 'No description available.'}
              </div>
              
              {/* Call to Action */}
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Involved</h3>
                <p className="text-gray-600 mb-6">
                  We'd love to have you join us! Whether you're looking to serve, grow, or connect with others, there's a place for you here.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={handleJoinMinistry}
                    disabled={joining}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Join This Ministry
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="border-2 hover:bg-gray-50">
                    <Users className="h-4 w-4 mr-2" />
                    Contact Leader
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Meeting Details Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Meeting Details</h3>
              <div className="space-y-4">
                {ministry.meetingTime && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Clock className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">When</p>
                      <p className="text-base font-semibold text-gray-900">{ministry.meetingTime}</p>
                    </div>
                  </div>
                )}
                {ministry.location && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Where</p>
                      <p className="text-base font-semibold text-gray-900">{ministry.location}</p>
                    </div>
                  </div>
                )}
                {ministry.leader && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-pink-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Leader</p>
                      <p className="text-base font-semibold text-gray-900">{ministry.leader}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
              <Calendar className="h-8 w-8 mb-3" />
              <h3 className="text-lg font-bold mb-2">First Time Visitor?</h3>
              <p className="text-white/90 text-sm mb-4">
                Join us for your first meeting and discover how you can be part of this amazing community.
              </p>
              <Button className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
                Plan Your Visit
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
