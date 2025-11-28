'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  capacity: number | null
  category: string | null
  imageUrl: string | null
  registrationFee: number | null
  requiresRegistration: boolean
  registrations: { id: string }[]
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const upcomingEvents = filteredEvents.filter(event => new Date(event.startDate) >= new Date())
  const uniqueCategories = Array.from(new Set(events.filter(e => e.category).map(e => e.category)))

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
            Upcoming Events
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join us for special events, community gatherings, and ministry activities. 
            There&apos;s always something happening at Grace Community Church!
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories
                    .filter((category): category is string => category !== null)
                    .map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200"></div>
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
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events</h3>
            <p className="text-gray-600">Check back soon for new events and activities!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                  {event.imageUrl && (
                    <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500"></div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {event.category && (
                          <Badge variant="secondary" className="mb-2">
                            {event.category}
                          </Badge>
                        )}
                        <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                      </div>
                    </div>
                    
                    <CardDescription className="text-gray-600">
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(event.startDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                          {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`}
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {event.capacity && (
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span>
                            {event.registrations.length} / {event.capacity} registered
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        {event.registrationFee && (
                          <span className="text-lg font-semibold text-green-600">
                            ${event.registrationFee}
                          </span>
                        )}
                        {!event.registrationFee && event.requiresRegistration && (
                          <span className="text-lg font-semibold text-green-600">Free</span>
                        )}
                      </div>
                      
                      {event.requiresRegistration ? (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Register
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          Learn More
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
