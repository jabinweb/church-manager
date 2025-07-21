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
import { useSystemSettings } from '@/lib/useSystemSettings'
import { format } from 'date-fns'

interface HomePageData {
  recentSermons: Array<{
    id: string
    title: string
    speaker: string
    date: string
    slug: string
    imageUrl?: string
    views: number
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

  const ministries = [
    {
      icon: Cross,
      title: 'Discipleship',
      description: 'Growing deeper in relationship with Jesus through intentional spiritual formation.',
      image: '/images/discipleship.jpg',
      link: '/ministries/discipleship',
      verse: 'Matthew 28:19-20'
    },
    {
      icon: Heart,
      title: 'Youth Ministry',
      description: 'Empowering young hearts to live boldly for Christ in today&apos;s world.',
      image: '/images/youth-ministry.jpg',
      link: '/ministries/youth',
      verse: '1 Timothy 4:12'
    },
    {
      icon: BookOpen,
      title: 'Children&apos;s Ministry',
      description: 'Teaching little ones about God&apos;s amazing love through engaging Bible stories.',
      image: '/images/childrens-ministry.jpg',
      link: '/ministries/children',
      verse: 'Mark 10:14'
    },
    {
      icon: HandHeart,
      title: 'Outreach',
      description: 'Sharing the Gospel and God&apos;s love with our community and beyond.',
      image: '/images/outreach.jpg',
      link: '/ministries/outreach',
      verse: 'Matthew 28:19'
    }
  ]

  const serviceSchedule = [
    {
      title: 'Sunday Worship',
      times: ['9:00 AM', '11:00 AM'],
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
      content: 'Through this church, I\'ve experienced the transforming power of the Gospel firsthand. The community here truly lives out Christ&apos;s love.',
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

  // Safe data access
  const stats = data?.stats || { totalMembers: 0, totalSermons: 0, totalEvents: 0, totalPrayerRequests: 0 }
  const recentSermons = data?.recentSermons || []
  const upcomingEvents = data?.upcomingEvents || []

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Improved Typography */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/cross-pattern.svg')] opacity-5"></div>
        
        <div className="absolute inset-0">
          <Image
            src="/images/church-worship.jpg"
            alt="Worship Service"
            fill
            className="object-cover opacity-20"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-4 py-2">
                <Cross className="w-4 h-4 mr-2" />
                Christ-Centered • Gospel-Driven • Spirit-Led
              </Badge>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                <span className="block mb-2">Experience the</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-2">
                  Gospel
                </span>
                <span className="block">Transformation</span>
              </h1>
              
              <p className="text-md md:text-lg lg:text-xl mb-8 text-gray-200 leading-relaxed max-w-2xl mx-auto font-light">
                &ldquo;For I am not ashamed of the gospel, for it is the power of God for salvation 
                to everyone who believes.&rdquo; - Romans 1:16
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl text-base px-8 py-3 group" asChild>
                  <Link href="/events/plan-your-visit">
                    Visit This Sunday
                    <Sparkles className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white bg-transparent hover:bg-white hover:text-gray-900 text-base px-8 py-3" asChild>
                  <Link href="/sermons">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Sermons
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Improved Layout */}
      {/* <section className="py-12 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                number: stats.totalMembers || '2,500+',
                label: 'Believers',
                icon: Users
              },
              {
                number: stats.totalSermons || '500+',
                label: 'Sermons',
                icon: BookOpen
              },
              {
                number: stats.totalEvents || '50+',
                label: 'Events',
                icon: Calendar
              },
              {
                number: stats.totalPrayerRequests || '1,000+',
                label: 'Prayers',
                icon: Heart
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Recent Sermons - Better Typography */}
      {recentSermons.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Recent Messages
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
                  Hear God&apos;s Word proclaimed with power and truth
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {recentSermons.slice(0, 3).map((sermon, index) => (
                <motion.div
                  key={sermon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 h-full">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={sermon.imageUrl || '/images/sermon-default.jpg'}
                        alt={sermon.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "https://placehold.co/400x300/7c3aed/white?text=Sermon"
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <BookOpen className="h-5 w-5" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
                        {sermon.title}
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm">By {sermon.speaker}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {format(new Date(sermon.date), 'MMM dd, yyyy')}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sermons/${sermon.slug}`}>
                            Listen <Play className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button size="lg" variant="outline" asChild>
                <Link href="/sermons">
                  All Sermons
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Service Times - Improved Cards */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Worship With Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
              Join us as we gather to hear God&apos;s Word and worship Him in spirit and truth
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceSchedule.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group border-0 bg-white">
                  <CardContent className="p-6 text-center">
                    {service.highlight && (
                      <Badge className="mb-3 bg-purple-100 text-purple-800 text-xs">
                        {service.highlight}
                      </Badge>
                    )}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                    <div className="space-y-1 mb-3">
                      {service.times.map((time, i) => (
                        <div key={i} className="text-lg font-bold text-purple-600">{time}</div>
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">{service.description}</p>
                    {service.childcare && (
                      <div className="flex items-center justify-center text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Childcare Available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ministries - Improved Typography */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Gospel-Centered Ministries
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
              Every ministry exists to make disciples who make disciples
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ministries.map((ministry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group overflow-hidden border-0">
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={ministry.image}
                      alt={ministry.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `https://placehold.co/400x300/7c3aed/white?text=${encodeURIComponent(ministry.title)}`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <ministry.icon className="h-6 w-6" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-gray-900 text-xs">
                        {ministry.verse}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors">
                      {ministry.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">{ministry.description}</p>
                    <Button variant="outline" size="sm" className="group-hover:bg-purple-600 group-hover:text-white transition-colors text-xs" asChild>
                      <Link href={ministry.link}>
                        Learn More
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Refined */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Gospel Transformations
            </h2>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto font-light">
              &ldquo;Therefore, if anyone is in Christ, he is a new creation.&rdquo; - 2 Corinthians 5:17
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-6">
                    <Quote className="h-6 w-6 text-yellow-400 mb-3" />
                    <p className="text-base mb-4 leading-relaxed font-light">{testimonial.content}</p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        <div className="text-xs text-purple-200">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events - Improved Typography and Layout */}
      {upcomingEvents.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Upcoming Events
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
                  Join us for fellowship and growth opportunities
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.slice(0, 3).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow group">
                    <div className="relative h-48">
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
                        <Badge className="absolute top-4 right-4 bg-purple-600 text-white">
                          {event.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <div className="flex items-center text-gray-600 mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                        {event.location && (
                          <>
                            <MapPin className="h-4 w-4 ml-4 mr-2" />
                            <span>{event.location}</span>
                          </>
                        )}
                      </div>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button size="lg" variant="outline" asChild>
                <Link href="/events">
                  All Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section - Improved */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center mb-6">
                <Cross className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  Come & See
                </h2>
              </div>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                &ldquo;Come and see what God has done!&rdquo; - Psalm 66:5. 
                Experience the life-changing power of the Gospel with us.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Visit Us</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {churchAddress || '123 Faith Street, Springfield, IL 62701'}
                      <br />Free parking • Wheelchair accessible
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Connect</h3>
                    <p className="text-gray-600 text-sm">
                      {churchPhone || '(555) 123-4567'}
                      <br />{churchEmail || 'info@gracechurch.org'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700" asChild>
                  <Link href="/events/plan-your-visit">Plan Your Visit</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Get Directions</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0 overflow-hidden">
                <CardContent className="p-8">
                  <HandHeart className="h-12 w-12 text-yellow-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">Prayer & Support</h3>
                  <p className="text-base text-purple-100 mb-6 leading-relaxed font-light">
                    &ldquo;The prayer of a righteous person has great power as it is working.&rdquo; - James 5:16
                  </p>
                  
                  <div className="space-y-3">
                    <Button size="lg" className="w-full bg-white text-purple-600 hover:bg-gray-100" asChild>
                      <Link href="/prayer">
                        Submit Prayer Request
                        <Heart className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full border-white bg-transparent text-white hover:bg-white hover:text-purple-600" asChild>
                      <Link href="/giving">
                        Give Online
                        <HandHeart className="ml-2 h-4 w-4" />
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