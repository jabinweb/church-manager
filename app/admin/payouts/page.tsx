'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DollarSign, Clock, CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Payout {
  id: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  bankDetails: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface PayoutStats {
  totalRequests: number
  pendingAmount: number
  approvedAmount: number
  paidAmount: number
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: 'all',
    search: ''
  })
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPayouts()
    fetchStats()
  }, [])

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/admin/payouts')
      if (!response.ok) throw new Error('Failed to fetch payouts')
      const data = await response.json()
      setPayouts(data.payouts || [])
    } catch (error) {
      console.error('Error fetching payouts:', error)
      toast.error('Failed to load payouts')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/payouts/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleReviewPayout = async () => {
    if (!selectedPayout) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/payouts/${selectedPayout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          adminNotes
        })
      })

      if (!response.ok) throw new Error('Failed to update payout')

      toast.success(`Payout ${reviewStatus.toLowerCase()} successfully`)
      setReviewDialogOpen(false)
      setSelectedPayout(null)
      setAdminNotes('')
      fetchPayouts()
      fetchStats()
    } catch (error) {
      console.error('Error updating payout:', error)
      toast.error('Failed to update payout')
    } finally {
      setProcessing(false)
    }
  }

  const openReviewDialog = (payout: Payout) => {
    setSelectedPayout(payout)
    setAdminNotes(payout.adminNotes || '')
    setReviewDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'PAID': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredPayouts = payouts.filter(payout => {
    const matchesStatus = filter.status === 'all' || payout.status === filter.status
    const matchesSearch = !filter.search || 
      payout.user.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      payout.user.email.toLowerCase().includes(filter.search.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
            <p className="text-gray-600 mt-2">Review and manage user payout requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Requests</p>
                    <p className="text-2xl font-bold">{stats.totalRequests}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Pending Amount</p>
                    <p className="text-2xl font-bold">₹{stats.pendingAmount.toFixed(0)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Approved Amount</p>
                    <p className="text-2xl font-bold">₹{stats.approvedAmount.toFixed(0)}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Paid Amount</p>
                    <p className="text-2xl font-bold">₹{stats.paidAmount.toFixed(0)}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Payout Requests</CardTitle>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payout requests found</h3>
                <p className="text-gray-500">Payout requests will appear here when users submit them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayouts.map((payout, index) => (
                  <motion.div
                    key={payout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(payout.status)}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{payout.user.name}</span>
                          <Badge className={getStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{payout.user.email}</p>
                        <p className="text-xs text-gray-400">
                          Requested {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{payout.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          Updated {new Date(payout.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(payout)}
                        disabled={payout.status === 'PAID'}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {payout.status === 'PENDING' ? 'Review' : 'View'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Payout Request</DialogTitle>
              <DialogDescription>
                Review and take action on this payout request
              </DialogDescription>
            </DialogHeader>
            
            {selectedPayout && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{selectedPayout.user.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{selectedPayout.user.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-bold text-lg">₹{selectedPayout.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <Badge className={getStatusColor(selectedPayout.status)}>
                        {selectedPayout.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <Label>Bank Details</Label>
                  <div className="p-3 bg-gray-50 rounded border mt-1">
                    <pre className="text-sm whitespace-pre-wrap">{selectedPayout.bankDetails}</pre>
                  </div>
                </div>

                {/* Action Section */}
                {selectedPayout.status === 'PENDING' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Action</Label>
                      <Select value={reviewStatus} onValueChange={(value: 'APPROVED' | 'REJECTED') => setReviewStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPROVED">Approve</SelectItem>
                          <SelectItem value="REJECTED">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Admin Notes</Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this decision..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleReviewPayout} disabled={processing}>
                        {processing ? 'Processing...' : `${reviewStatus === 'APPROVED' ? 'Approve' : 'Reject'} Payout`}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Existing Notes */}
                {selectedPayout.adminNotes && selectedPayout.status !== 'PENDING' && (
                  <div>
                    <Label>Admin Notes</Label>
                    <div className="p-3 bg-gray-50 rounded border mt-1">
                      <p className="text-sm">{selectedPayout.adminNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
