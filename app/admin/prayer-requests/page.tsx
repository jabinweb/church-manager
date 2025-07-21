'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Heart, 
  Search, 
  Eye,
  Check,
  X,
  Clock,
  User,
  Mail,
  AlertTriangle,
  Archive,
  Loader2,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PrayerRequest {
  id: string
  name: string
  email: string | null
  request: string
  isAnonymous: boolean
  isUrgent: boolean
  status: 'PENDING' | 'APPROVED' | 'ANSWERED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  user?: {
    name: string | null
    email: string
  } | null
}

interface PrayerStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  urgentRequests: number
}

export default function PrayerRequestsPage() {
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [stats, setStats] = useState<PrayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [urgentFilter, setUrgentFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/prayer-requests')
      if (!response.ok) throw new Error('Failed to fetch prayer requests')
      
      const data = await response.json()
      setRequests(Array.isArray(data.requests) ? data.requests : [])
      setStats(data.stats || {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        urgentRequests: 0
      })
    } catch (error) {
      console.error('Error fetching prayer requests:', error)
      toast.error('Failed to load prayer requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      setActionLoading(id)
      const response = await fetch(`/api/admin/prayer-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      toast.success(`Prayer request ${status.toLowerCase()} successfully`)
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.email && request.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesUrgent = urgentFilter === 'all' || 
      (urgentFilter === 'urgent' && request.isUrgent) ||
      (urgentFilter === 'normal' && !request.isUrgent)
    
    return matchesSearch && matchesStatus && matchesUrgent
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'ANSWERED': return 'bg-blue-100 text-blue-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'APPROVED': return Check
      case 'ANSWERED': return Heart
      case 'ARCHIVED': return Archive
      default: return Clock
    }
  }

  const safeStats = stats || {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    urgentRequests: 0
  }

  const statsData = [
    { title: 'Total Requests', value: safeStats.totalRequests.toString(), icon: Heart, color: 'text-purple-600' },
    { title: 'Pending', value: safeStats.pendingRequests.toString(), icon: Clock, color: 'text-yellow-600' },
    { title: 'Approved', value: safeStats.approvedRequests.toString(), icon: Check, color: 'text-green-600' },
    { title: 'Urgent', value: safeStats.urgentRequests.toString(), icon: AlertTriangle, color: 'text-red-600' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prayer Requests</h1>
          <p className="text-gray-600 mt-2">Manage and respond to prayer requests from the community</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsData.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search prayer requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ANSWERED">Answered</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgentFilter} onValueChange={setUrgentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading prayer requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {requests.length === 0 ? 'No prayer requests found' : 'No requests match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const StatusIcon = getStatusIcon(request.status)
                return (
                  <div key={request.id} className="border rounded-lg p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">
                              {request.isAnonymous ? 'Anonymous' : request.name}
                            </h3>
                            {request.isUrgent && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-4 line-clamp-3">{request.request}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {!request.isAnonymous && request.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {request.email}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <Heart className="h-5 w-5 text-purple-600" />
                                <span>Prayer Request Details</span>
                                {selectedRequest?.isUrgent && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Urgent
                                  </Badge>
                                )}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">From:</label>
                                  <p className="text-gray-900">
                                    {selectedRequest.isAnonymous ? 'Anonymous Request' : selectedRequest.name}
                                  </p>
                                  {!selectedRequest.isAnonymous && selectedRequest.email && (
                                    <p className="text-gray-600 text-sm">{selectedRequest.email}</p>
                                  )}
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Request:</label>
                                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.request}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <label className="font-medium text-gray-700">Status:</label>
                                    <Badge className={`ml-2 ${getStatusColor(selectedRequest.status)}`}>
                                      {selectedRequest.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="font-medium text-gray-700">Submitted:</label>
                                    <p className="text-gray-600">{format(new Date(selectedRequest.createdAt), 'PPpp')}</p>
                                  </div>
                                </div>
                                
                                <div className="flex justify-end space-x-2 pt-4 border-t">
                                  {selectedRequest.status === 'PENDING' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        onClick={() => updateRequestStatus(selectedRequest.id, 'APPROVED')}
                                        disabled={actionLoading === selectedRequest.id}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => updateRequestStatus(selectedRequest.id, 'ARCHIVED')}
                                        disabled={actionLoading === selectedRequest.id}
                                      >
                                        <Archive className="h-4 w-4 mr-1" />
                                        Archive
                                      </Button>
                                    </>
                                  )}
                                  {selectedRequest.status === 'APPROVED' && (
                                    <Button
                                      onClick={() => updateRequestStatus(selectedRequest.id, 'ANSWERED')}
                                      disabled={actionLoading === selectedRequest.id}
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      <Heart className="h-4 w-4 mr-1" />
                                      Mark as Answered
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, 'APPROVED')}
                              disabled={actionLoading === request.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, 'ARCHIVED')}
                              disabled={actionLoading === request.id}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
