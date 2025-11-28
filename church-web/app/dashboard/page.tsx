'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Package, 
  Heart,
  DollarSign,
  ShoppingCart,
  Calendar,
  BookOpen,
  Gift,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'

interface DashboardStats {
  totalOrders: number
  totalDonations: number
  upcomingEvents: number
  prayerRequests: number
  recentOrders: {
    id: string
    total: number
    status: string
    createdAt: string
    orderItems: {
      quantity: number
      product: {
        name: string
      }
    }[]
  }[]
  recentDonations: {
    id: string
    amount: number
    fund: { name: string }
    status: string
    createdAt: string
  }[]
  recentEvents: {
    id: string
    title: string
    startDate: string
    location: string
    status: string
  }[]
  recentPrayers: {
    id: string
    request: string
    status: string
    createdAt: string
  }[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/member')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin?callbackUrl=/dashboard')
          return
        }
        throw new Error('Failed to fetch dashboard stats')
      }
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard')
      return
    }
    if (status === 'authenticated') {
      fetchDashboardStats()
    }
  }, [status, router, fetchDashboardStats])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Welcome back, {session?.user?.name || 'Member'}!
            </h1>
            <p className="text-gray-600 mt-2">Here&apos;s your church dashboard overview</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild>
              <Link href="/bookstore">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shop Bookstore
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/giving">
                <DollarSign className="h-4 w-4 mr-2" />
                Give Now
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Masonry Layout */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="break-inside-avoid mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Orders</p>
                    <p className="text-2xl font-bold">{stats?.totalOrders ?? 0}</p>
                    <p className="text-purple-100 text-xs mt-1">Your purchases</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="break-inside-avoid mb-6"
          >
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Donations</p>
                    <p className="text-2xl font-bold">₹{stats?.totalDonations?.toFixed(2) ?? '0.00'}</p>
                    <p className="text-green-100 text-xs mt-1">Total given</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="break-inside-avoid mb-6"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Upcoming Events</p>
                    <p className="text-2xl font-bold">{stats?.upcomingEvents ?? 0}</p>
                    <p className="text-blue-100 text-xs mt-1">Registered</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="break-inside-avoid mb-6"
          >
            <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm">Prayer Requests</p>
                    <p className="text-2xl font-bold">{stats?.prayerRequests ?? 0}</p>
                    <p className="text-pink-100 text-xs mt-1">Submitted</p>
                  </div>
                  <Heart className="h-8 w-8 text-pink-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="break-inside-avoid mb-6"
          >
            <Link href="/dashboard/orders">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">View Orders</h3>
                      <p className="text-sm text-gray-500">See your purchases</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="break-inside-avoid mb-6"
          >
            <Link href="/dashboard/giving">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">My Donations</h3>
                      <p className="text-sm text-gray-500">Giving history</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="break-inside-avoid mb-6"
          >
            <Link href="/dashboard/events">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">My Events</h3>
                      <p className="text-sm text-gray-500">Upcoming & past</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/orders">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <Button className="mt-4" asChild>
                      <Link href="/bookstore">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">₹{order.total?.toFixed(2) ?? '0.00'}</p>
                          <p className="text-sm text-gray-500">
                            {order.orderItems?.length ?? 0} items • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Donations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Donations</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/giving">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!stats?.recentDonations || stats.recentDonations.length === 0) ? (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No donations yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentDonations.slice(0, 5).map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">₹{donation.amount?.toFixed(2) ?? '0.00'}</p>
                          <p className="text-sm text-gray-500">
                            {donation.fund?.name || 'General Fund'} • {donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <Badge variant={donation.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {donation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          {/* Upcoming Events Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {(!stats?.recentEvents || stats.recentEvents.length === 0) ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {event.location} • {new Date(event.startDate).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/events/${event.id}`}>
                            RSVP
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* This Week's Sermon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>This Week&apos;s Sermon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sermon Title</p>
                    <p className="text-lg font-semibold">The Power of Faith</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Notes</p>
                  <Button variant="link" size="sm" asChild>
                    <Link href="/sermon-notes/this-weeks-sermon">
                      View Notes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prayer Request Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Prayer Request Status</CardTitle>
              </CardHeader>
              <CardContent>
                {(!stats?.recentPrayers || stats.recentPrayers.length === 0) ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent prayer requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentPrayers.slice(0, 3).map((prayer) => (
                      <div key={prayer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{prayer.request}</p>
                          <p className="text-sm text-gray-500">
                            {prayer.createdAt ? new Date(prayer.createdAt).toLocaleString() : ''}
                          </p>
                        </div>
                        <Badge variant={prayer.status === 'ANSWERED' ? 'default' : 'secondary'}>
                          {prayer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Giving Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Giving Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Year-to-Date Giving</p>
                    <p className="text-2xl font-bold">₹{stats?.totalDonations?.toFixed(2) ?? '0.00'}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Next Recurring Gift</p>
                  <p className="text-lg font-semibold">₹{((stats?.totalDonations ?? 0) / 12).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Group Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Group Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Men&apos;s Bible Study</p>
                      <p className="text-sm text-gray-500">Every Tuesday at 7 PM</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/groups/mens-bible-study">
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Women&apos;s Fellowship</p>
                      <p className="text-sm text-gray-500">Every Thursday at 6 PM</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/groups/womens-fellowship">
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Youth Group</p>
                      <p className="text-sm text-gray-500">Fridays at 7 PM</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/groups/youth-group">
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Volunteer Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Volunteer Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Ushering Team</p>
                      <p className="text-sm text-gray-500">Next: Sunday, 9 AM</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/volunteer-schedule/ushering-team">
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Children&apos;s Church</p>
                      <p className="text-sm text-gray-500">Next: Sunday, 10:30 AM</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/volunteer-schedule/childrens-church">
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Media Team</p>
                      <p className="text-sm text-gray-500">Next: Saturday, 5 PM</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/volunteer-schedule/media-team">
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/prayer-requests/new">
                      Submit Prayer Request
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/check-in">
                      Check-in
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/giving">
                      Give Now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Church Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Church Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                {(!(stats as any)?.recentAnnouncements || (stats as any).recentAnnouncements.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No announcements yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(stats as any).recentAnnouncements.slice(0, 3).map((announcement: any) => (
                      <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-gray-500">{announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Family Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15 }}
            className="break-inside-avoid mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Family Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">John&apos;s Birthday</p>
                      <p className="text-sm text-gray-500">March 10, 2023</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/family-calendar/johns-birthday">
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Anniversary Celebration</p>
                      <p className="text-sm text-gray-500">March 20, 2023</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/family-calendar/anniversary-celebration">
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Family Reunion</p>
                      <p className="text-sm text-gray-500">April 15, 2023</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/family-calendar/family-reunion">
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
