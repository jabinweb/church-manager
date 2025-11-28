'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Users, 
  Calendar, 
  BookOpen, 
  Music, 
  HandHeart,
  ChevronRight,
  MapPin,
  Clock,
  Phone,
  Play,
  ArrowRight,
  Quote,
  CheckCircle,
  Cross,
  Sparkles
} from 'lucide-react'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import { format } from 'date-fns'
import SermonCard from '@/components/sermon/SermonCard'
import { MinistriesSection } from '@/components/layout/MinistriesSection'
import { HeroSection } from '@/components/layout/HeroSection'
import { ServiceTimesSection } from '@/components/layout/ServiceTimesSection'

interface HomePageData {
  recentSermons: Array<{
    id: string
    title: string
    speaker: string
    date: string
    slug: string
    imageUrl?: string
    views: number
    series?: string | null
    duration?: string | null
    isPublished: boolean
    audioUrl?: string | null
    videoUrl?: string | null
    scriptureReference?: string | null
    tags: string[]
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    startDate: string
    location?: string
    imageUrl?: string
    category?: string
  }>
  recentPosts: Array<{
    id: string
    title: string
    excerpt?: string
    slug: string
    publishDate: string
    author: { name?: string }
    imageUrl?: string
  }>
  ministries: Array<{
    id: string
    name: string
    description?: string
    leader?: string
    meetingTime?: string
    location?: string
    imageUrl?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }>
  stats: {
    totalMembers: number
    totalSermons: number
    totalEvents: number
    totalPrayerRequests: number
  }
}

export default function Home() {
  const { churchName, churchAddress, churchPhone, churchEmail } = useSystemSettings()
  const [data, setData] = useState<HomePageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      const response = await fetch('/api/homepage')
      if (response.ok) {
        const homeData = await response.json()
        setData(homeData)
      }
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Safe data access
  const stats = data?.stats || { totalMembers: 0, totalSermons: 0, totalEvents: 0, totalPrayerRequests: 0 }
  const recentSermons = data?.recentSermons || []
  const upcomingEvents = data?.upcomingEvents || []
  const ministries = data?.ministries || []

  // Helper function to get ministry icon based on name or default
  const getMinistryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('youth')) return Heart
    if (lowerName.includes('children') || lowerName.includes('kids')) return BookOpen
    if (lowerName.includes('outreach') || lowerName.includes('mission')) return HandHeart
    if (lowerName.includes('worship') || lowerName.includes('music')) return Music
    if (lowerName.includes('prayer')) return Heart
    return Cross // Default icon
  }

  // Helper function to get ministry link
  const getMinistryLink = (ministry: any) => {
    return `/ministries/${ministry.id}` // Use ID-based routing
  }

  const serviceSchedule = [
    {
      title: 'Sunday Worship',
      times: ['9:00 AM - 11:00 AM'],
      description: 'Gospel-centered worship and biblical preaching',
      highlight: 'Main Service',
      childcare: true,
      icon: Cross
    },
    {
      title: 'Wednesday Bible Study',
      times: ['7:00 PM'],
      description: 'Deep dive into God\'s Word together',
      highlight: null,
      childcare: true,
      icon: BookOpen
    },
    {
      title: 'Prayer Meeting',
      times: ['6:00 PM'],
      description: 'Corporate prayer and intercession',
      highlight: 'Every Friday',
      childcare: false,
      icon: Heart
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Member since 2020',
      content: 'Through this church, I\'ve experienced the transforming power of the Gospel firsthand. The community here truly lives out Christ\'s love.',
      avatar: '/images/testimonial-1.jpg'
    },
    {
      name: 'Michael Chen',
      role: 'Youth Leader',
      content: 'This church doesn\'t just preach the Gospel - they live it. I\'ve seen lives transformed by God\'s grace through this ministry.',
      avatar: '/images/testimonial-2.jpg'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Small Group Leader',
      content: 'The Gospel isn\'t just preached here on Sundays - it\'s lived out daily in how we care for one another.',
      avatar: '/images/testimonial-3.jpg'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Service Times Section */}
      <ServiceTimesSection serviceSchedule={serviceSchedule} />

      {/* Recent Sermons - Mobile Responsive */}
      {recentSermons.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                  Recent Messages
                </h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                  Hear God&apos;s Word proclaimed with power and truth
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {recentSermons.slice(0, 3).map((sermon, index) => (
                <motion.div
                  key={sermon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="w-full"
                >
                  <SermonCard 
                    sermon={sermon} 
                    index={index}
                    priority={index < 3}
                    showActions={false}
                  />
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-12">
              <Button size="lg" variant="outline" className="text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto" asChild>
                <Link href="/sermons">
                  View All Sermons
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Ministries Section */}
      <MinistriesSection ministries={ministries} />

      {/* Upcoming Events - Mobile Responsive */}
      {upcomingEvents.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                  Upcoming Events
                </h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                  Join us for fellowship and growth opportunities
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {upcomingEvents.slice(0, 3).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="w-full"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow group h-full">
                    <div className="relative h-40 sm:h-48">
                      <Image
                        src={event.imageUrl || '/images/event-default.jpg'}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://placehold.co/400x300/7c3aed/white?text=${encodeURIComponent(event.title)}`
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      {event.category && (
                        <Badge className="absolute top-3 right-3 bg-purple-600 text-white text-xs">
                          {event.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-4 text-sm gap-1 sm:gap-0">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center sm:ml-4">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-10">
              <Button size="lg" variant="outline" className="text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto" asChild>
                <Link href="/events">
                  All Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials - Mobile Responsive */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Gospel Transformations
            </h2>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mx-auto font-light px-4">
              &ldquo;Therefore, if anyone is in Christ, he is a new creation.&rdquo; - 2 Corinthians 5:17
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="w-full"
              >
                <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-4 sm:p-6">
                    <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mb-3" />
                    <p className="text-sm sm:text-base mb-4 leading-relaxed font-light">{testimonial.content}</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{testimonial.name}</div>
                        <div className="text-xs text-purple-200 truncate">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Mobile Responsive */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center mb-4 sm:mb-6 px-2">
                <Cross className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2 sm:mr-3 flex-shrink-0" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  Come & See
                </h2>
              </div>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2">
                &ldquo;Come and see what God has done!&rdquo; - Psalm 66:5. 
                Experience the life-changing power of the Gospel with us.
              </p>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Visit Us</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {churchAddress || '123 Faith Street, Springfield, IL 62701'}
                      <br />Free parking • Wheelchair accessible
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Connect</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {churchPhone || '(555) 123-4567'}
                      <br />{churchEmail || 'info@gracechurch.org'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:flex-1 lg:w-auto" asChild>
                  <Link href="/events/plan-your-visit">Plan Your Visit</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:flex-1 lg:w-auto" asChild>
                  <Link href="/contact">Get Directions</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-8 lg:mt-0"
            >
              <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0 overflow-hidden">
                <CardContent className="p-6 sm:p-8 lg:p-10">
                  <HandHeart className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-yellow-400 mb-4 sm:mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Prayer & Support</h3>
                  <p className="text-base sm:text-lg text-purple-100 mb-6 sm:mb-8 leading-relaxed">
                    &ldquo;The prayer of a righteous person has great power as it is working.&rdquo; - James 5:16
                  </p>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <Button size="lg" className="w-full bg-white text-purple-600 hover:bg-gray-100 text-sm sm:text-base lg:text-lg py-3 sm:py-4" asChild>
                      <Link href="/prayer">
                        Submit Prayer Request
                        <Heart className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full border-white bg-transparent text-white hover:bg-white hover:text-purple-600 text-sm sm:text-base lg:text-lg py-3 sm:py-4" asChild>
                      <Link href="/giving">
                        Give Online
                        <HandHeart className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}