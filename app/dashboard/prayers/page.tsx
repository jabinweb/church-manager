'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Heart, 
  Plus, 
  Search, 
  Filter,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  Archive,
  AlertCircle,
  MessageCircle,
  Send,
  Edit,
  Trash2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PrayerRequest {
  id: string
  name: string
  email?: string | null
  request: string
  isAnonymous: boolean
  isUrgent: boolean
  status: 'PENDING' | 'APPROVED' | 'ANSWERED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  userId?: string | null
}

export default function PrayerRequestsPage() {
  const { data: session } = useSession()
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [editRequestOpen, setEditRequestOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null)
  const [newRequest, setNewRequest] = useState({
    name: '',
    request: '',
    isAnonymous: false,
    isUrgent: false
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPrayerRequests()
  }, [])

  const fetchPrayerRequests = async () => {
    try {
      const response = await fetch('/api/prayer-requests/my-requests')
      if (response.ok) {
        const data = await response.json()
        setPrayerRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching prayer requests:', error)
      toast.error('Failed to load prayer requests')
    } finally {
      setLoading(false)
    }
  }

  const submitPrayerRequest = async () => {
    if (!newRequest.request.trim()) {
      toast.error('Please enter your prayer request')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/prayer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequest,
          name: newRequest.isAnonymous ? 'Anonymous' : (newRequest.name || session?.user?.name || 'Anonymous')
        })
      })

      if (response.ok) {
        toast.success('Prayer request submitted successfully!')
        setNewRequestOpen(false)
        setNewRequest({
          name: '',
          request: '',
          isAnonymous: false,
          isUrgent: false
        })
        fetchPrayerRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit prayer request')
      }
    } catch (error) {
      console.error('Error submitting prayer request:', error)
      toast.error('Failed to submit prayer request')
    } finally {
      setSubmitting(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/prayer-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success('Prayer request updated successfully!')
        fetchPrayerRequests()
      } else {
        toast.error('Failed to update prayer request')
      }
    } catch (error) {
      console.error('Error updating prayer request:', error)
      toast.error('Failed to update prayer request')
    }
  }

  const filteredRequests = prayerRequests.filter(request => {
    const matchesSearch = request.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'ANSWERED': return <Heart className="h-4 w-4 text-green-500" />
      case 'ARCHIVED': return <Archive className="h-4 w-4 text-gray-500" />
      default: return <MessageCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ANSWERED': return 'bg-green-100 text-green-800 border-green-200'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Prayer Requests
              </h1>
              <p className="text-gray-600 mt-2">Share your prayer needs with our church family</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Prayer Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Prayer Request</DialogTitle>
                    <DialogDescription>
                      Share your prayer request with our church prayer team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="requestName">Your Name</Label>
                      <Input
                        id="requestName"
                        value={newRequest.name}
                        onChange={(e) => setNewRequest({...newRequest, name: e.target.value})}
                        placeholder={session?.user?.name || 'Enter your name'}
                        disabled={newRequest.isAnonymous}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={newRequest.isAnonymous}
                        onChange={(e) => setNewRequest({...newRequest, isAnonymous: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isAnonymous" className="text-sm">Submit anonymously</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isUrgent"
                        checked={newRequest.isUrgent}
                        onChange={(e) => setNewRequest({...newRequest, isUrgent: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isUrgent" className="text-sm">Mark as urgent</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="requestText">Prayer Request *</Label>
                      <Textarea
                        id="requestText"
                        value={newRequest.request}
                        onChange={(e) => setNewRequest({...newRequest, request: e.target.value})}
                        placeholder="Please share your prayer request..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setNewRequestOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={submitPrayerRequest}
                        disabled={submitting}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Request
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-purple-600">{filteredRequests.length}</p>
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
                    placeholder="Search prayer requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ANSWERED">Answered</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <div className="flex items-center text-sm text-gray-600">
                    <Filter className="h-4 w-4 mr-2" />
                    {filteredRequests.length} requests
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prayer Requests Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredRequests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No prayer requests found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'You haven\'t submitted any prayer requests yet'}
                </p>
                <Button onClick={() => setNewRequestOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Prayer Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {request.isUrgent && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          <Badge className={`text-xs ${getStatusBadgeColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status.toLowerCase()}</span>
                          </Badge>
                        </div>
                        
                        {request.userId === session?.user?.id && (
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.isAnonymous ? 'Anonymous Request' : request.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </p>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 line-clamp-4">{request.request}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                          </div>

                          {request.status === 'PENDING' && request.userId === session?.user?.id && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRequestStatus(request.id, 'ANSWERED')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mark Answered
                              </Button>
                            </div>
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

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['PENDING', 'APPROVED', 'ANSWERED', 'ARCHIVED'].map((status) => {
              const count = prayerRequests.filter(req => req.status === status).length
              return (
                <Card key={status} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-2">
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{status.toLowerCase()}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
