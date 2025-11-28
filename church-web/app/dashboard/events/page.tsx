'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Loader2,
  Plus,
  Eye,
  UserPlus,
  CalendarDays
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  capacity: number | null
  registrationFee: number | null
  requiresRegistration: boolean
  isPublished: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
  category: string | null
  imageUrl: string | null
  registrations?: Array<{
    id: string
    attendees: number
  }>
}

export default function EventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPastEvents, setShowPastEvents] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const filterEvents = useCallback(() => {
    let filtered = events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
      
      const eventDate = new Date(event.startDate)
      const now = new Date()
      const isPastEvent = eventDate < now
      
      const matchesTimeFilter = showPastEvents ? isPastEvent : !isPastEvent
      
      return matchesSearch && matchesCategory && matchesTimeFilter && event.isPublished
    })

    // Sort by start date
    filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    setFilteredEvents(filtered)
  }, [events, searchTerm, selectedCategory, showPastEvents])

  useEffect(() => {
    filterEvents()
  }, [filterEvents])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const registerForEvent = async (eventId: string) => {
    if (!session) {
      toast.error('Please sign in to register for events')
      return
    }

    try {
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      })

      if (response.ok) {
        toast.success('Successfully registered for event!')
        fetchEvents()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to register for event')
      }
    } catch (error) {
      console.error('Error registering for event:', error)
      toast.error('Failed to register for event')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Church Events
              </h1>
              <p className="text-gray-600 mt-2">Join us for upcoming church events and activities</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-bold text-blue-600">{filteredEvents.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Worship">Worship</option>
                    <option value="Fellowship">Fellowship</option>
                    <option value="Outreach">Outreach</option>
                    <option value="Youth">Youth</option>
                    <option value="Children">Children</option>
                  </select>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showPastEvents"
                      checked={showPastEvents}
                      onChange={(e) => setShowPastEvents(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="showPastEvents" className="text-sm text-gray-700">
                      Show past events
                    </label>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Filter className="h-4 w-4 mr-2" />
                    {filteredEvents.length} events
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredEvents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your search criteria'
                    : showPastEvents 
                      ? 'No past events to display'
                      : 'No upcoming events scheduled at the moment'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden">
                    {/* Event Image */}
                    {event.imageUrl ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={event.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className={`${getStatusBadgeColor(event.status)}`}>
                            {event.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                        <Calendar className="h-16 w-16 text-white opacity-50" />
                        <div className="absolute top-4 right-4">
                          <Badge className={`${getStatusBadgeColor(event.status)}`}>
                            {event.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Event Category */}
                        {event.category && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200">
                            {event.category}
                          </Badge>
                        )}

                        {/* Event Title */}
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                          {event.title}
                        </h3>

                        {/* Event Description */}
                        {event.description && (
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {event.description}
                          </p>
                        )}

                        {/* Event Details */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span>
                              {format(new Date(event.startDate), 'MMM dd, yyyy')} at{' '}
                              {format(new Date(event.startDate), 'h:mm a')}
                            </span>
                          </div>

                          {event.endDate && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                              <span>
                                Ends {format(new Date(event.endDate), 'MMM dd, yyyy')} at{' '}
                                {format(new Date(event.endDate), 'h:mm a')}
                              </span>
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}

                          {event.capacity && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                              <span>
                                {event.registrations?.reduce((sum, reg) => sum + reg.attendees, 0) || 0} / {event.capacity} registered
                              </span>
                            </div>
                          )}

                          {event.registrationFee && event.registrationFee > 0 && (
                            <div className="flex items-center">
                              <span className="text-green-600 font-semibold">
                                ₹{Number(event.registrationFee).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-4">
                          {event.requiresRegistration ? (
                            <Button
                              onClick={() => registerForEvent(event.id)}
                              disabled={!session || new Date(event.startDate) < new Date()}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {new Date(event.startDate) < new Date() ? 'Past Event' : 'Register'}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="flex-1"
                              disabled={new Date(event.startDate) < new Date()}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {new Date(event.startDate) < new Date() ? 'View Details' : 'Learn More'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
