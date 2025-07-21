'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Heart, 
  BookOpen, 
  Music, 
  Globe,
  Clock,
  MapPin,
  User,
  ChevronRight
} from 'lucide-react'

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

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMinistries()
  }, [])

  const fetchMinistries = async () => {
    try {
      const response = await fetch('/api/ministries')
      if (response.ok) {
        const data = await response.json()
        setMinistries(data.ministries || [])
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
    } finally {
      setLoading(false)
    }
  }

  const featuredMinistries = [
    {
      name: 'Adult Ministry',
      description: 'Connect with other adults through Bible studies, fellowship, and service opportunities.',
      icon: Users,
      href: '/ministries/adults',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Youth Ministry',
      description: 'Empowering young people to grow in faith through engaging programs and activities.',
      icon: Heart,
      href: '/ministries/youth',
      color: 'bg-red-100 text-red-600'
    },
    {
      name: 'Children\'s Ministry',
      description: 'Nurturing young hearts with age-appropriate lessons and fun activities.',
      icon: BookOpen,
      href: '/ministries/children',
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Worship Ministry',
      description: 'Leading our congregation in meaningful worship through music and arts.',
      icon: Music,
      href: '/ministries/worship',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Outreach',
      description: 'Serving our community and sharing God\'s love beyond our walls.',
      icon: Globe,
      href: '/ministries/outreach',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Ministries
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover opportunities to grow in faith, connect with others, and serve our community. 
            There&apos;s a place for everyone at Grace Community Church.
          </p>
        </motion.div>

        {/* Featured Ministries */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Featured Ministries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredMinistries.map((ministry, index) => (
              <motion.div
                key={ministry.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow group cursor-pointer">
                  <Link href={ministry.href}>
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 ${ministry.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <ministry.icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-xl">{ministry.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="mb-4">
                        {ministry.description}
                      </CardDescription>
                      <div className="flex items-center justify-center text-purple-600 group-hover:text-purple-700">
                        <span className="text-sm font-medium">Learn More</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* All Ministries */}
        {ministries.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">All Ministries</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ministries.filter(m => m.isActive).map((ministry, index) => (
                  <motion.div
                    key={ministry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl mb-2">{ministry.name}</CardTitle>
                            {ministry.leader && (
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <User className="h-4 w-4 mr-1" />
                                Led by {ministry.leader}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">
                          {ministry.description || 'No description available'}
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
                        
                        <div className="mt-4">
                          <Button variant="outline" size="sm">
                            Get Involved
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
