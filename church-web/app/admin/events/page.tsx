'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Plus, 
  Search, 
  MapPin,
  Loader2,
  Users,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  capacity: number | null
  status: string
  category: string | null
  _count: {
    registrations: number
  }
}

interface EventStats {
  upcomingEvents: number
  thisMonthEvents: number
  totalRegistrations: number
  thisYearEvents: number
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEventsData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/events?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch events data')
      
      const data = await response.json()
      setEvents(data.events)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchEventsData()
  }, [fetchEventsData])

  const statsData = stats ? [
    { title: 'Upcoming Events', value: stats.upcomingEvents.toString(), icon: Calendar, color: 'text-blue-600' },
    { title: 'This Month', value: stats.thisMonthEvents.toString(), icon: Plus, color: 'text-green-600' },
    { title: 'Total Registrations', value: stats.totalRegistrations.toString(), icon: Users, color: 'text-purple-600' },
    { title: 'Events This Year', value: stats.thisYearEvents.toString(), icon: Calendar, color: 'text-orange-600' },
  ] : []

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Youth': return 'bg-blue-100 text-blue-800'
      case 'Adult': return 'bg-green-100 text-green-800'
      case 'Children': return 'bg-yellow-100 text-yellow-800'
      case 'Outreach': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-2">Create and manage church events and activities</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Events List */}
      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No events found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="flex items-start justify-between p-6 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                        {event.category && (
                          <Badge className="bg-blue-100 text-blue-800">
                            {event.category}
                          </Badge>
                        )}
                        <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{event.description || 'No description available'}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(event.startDate).toLocaleDateString()}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {event._count.registrations}{event.capacity ? `/${event.capacity}` : ''} registered
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${event.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
