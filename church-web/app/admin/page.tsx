'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Users, BookOpen, Calendar, DollarSign, Mic } from 'lucide-react'

interface DashboardStats {
  totalMembers: number
  totalEvents: number
  totalSermons: number
  totalGiving: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-10 text-center text-purple-700 tracking-tight">
        Admin Dashboard
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-blue-700">Total Members</CardTitle>
                <div className="text-xs text-blue-400 mt-1">Active registered users</div>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-blue-800">{stats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-green-700">Total Events</CardTitle>
                <div className="text-xs text-green-400 mt-1">Upcoming & past events</div>
              </div>
              <Calendar className="h-10 w-10 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-green-800">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-purple-700">Total Sermons</CardTitle>
                <div className="text-xs text-purple-400 mt-1">Published sermons</div>
              </div>
              <Mic className="h-10 w-10 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-purple-800">{stats.totalSermons}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-yellow-700">Total Giving</CardTitle>
                <div className="text-xs text-yellow-400 mt-1">All donations received</div>
              </div>
              <DollarSign className="h-10 w-10 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-yellow-800">
                ₹{stats.totalGiving.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
