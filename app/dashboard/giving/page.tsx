'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Heart,
  Target,
  BarChart3,
  Plus,
  Filter,
  Search,
  Loader2,
  Gift,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import Link from 'next/link'
import { toast } from 'sonner'

interface Donation {
  id: string
  amount: number
  fundId: string
  fund: {
    name: string
    description?: string
  }
  paymentMethod: string
  status: string
  isRecurring: boolean
  recurringFrequency?: string
  transactionId?: string
  notes?: string
  createdAt: string
}

interface Fund {
  id: string
  name: string
  description?: string
  targetAmount?: number
  isActive: boolean
}

interface GivingStats {
  totalGiven: number
  donationsCount: number
  averageDonation: number
  largestDonation: number
  currentYearTotal: number
  lastYearTotal: number
  monthlyAverage: number
  favoritesFund: string
}

export default function GivingDashboard() {
  const { data: session } = useSession()
  const { currencySymbol } = useSystemSettings()
  const [donations, setDonations] = useState<Donation[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [stats, setStats] = useState<GivingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFund, setSelectedFund] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [subscriptions, setSubscriptions] = useState([])

  useEffect(() => {
    fetchGivingData()
    fetchFunds()
  }, [])

  const fetchGivingData = async () => {
    try {
      const response = await fetch('/api/dashboard/giving')
      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching giving data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFunds = async () => {
    try {
      const response = await fetch('/api/funds')
      if (response.ok) {
        const data = await response.json()
        setFunds(data.funds || [])
      }
    } catch (error) {
      console.error('Error fetching funds:', error)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/user/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/user/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Subscription cancelled successfully')
        fetchSubscriptions()
      } else {
        toast.error('Failed to cancel subscription')
      }
    } catch (error) {
      toast.error('Error cancelling subscription')
    }
  }

  // Filter and sort donations
  let filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.notes && donation.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFund = selectedFund === 'all' || donation.fundId === selectedFund
    const matchesYear = new Date(donation.createdAt).getFullYear().toString() === selectedYear
    return matchesSearch && matchesFund && matchesYear
  })

  // Sort donations
  if (sortBy === 'date-asc') {
    filteredDonations = [...filteredDonations].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else if (sortBy === 'date-desc') {
    filteredDonations = [...filteredDonations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy === 'amount-asc') {
    filteredDonations = [...filteredDonations].sort((a, b) => a.amount - b.amount)
  } else if (sortBy === 'amount-desc') {
    filteredDonations = [...filteredDonations].sort((a, b) => b.amount - a.amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'FAILED': return <AlertCircle className="h-4 w-4" />
      case 'REFUNDED': return <Receipt className="h-4 w-4" />
      default: return <Receipt className="h-4 w-4" />
    }
  }

  const availableYears = Array.from(new Set(donations.map(d => new Date(d.createdAt).getFullYear()))).sort((a, b) => b - a)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600 text-lg">Loading your giving history...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                My Giving History
              </h1>
              <p className="text-gray-600 mt-2">Track your donations and giving impact</p>
            </div>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" asChild>
              <Link href="/giving">
                <Plus className="h-4 w-4 mr-2" />
                Make a Donation
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Given</p>
                    <p className="text-2xl font-bold">{currencySymbol}{stats.totalGiven.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Donations Made</p>
                    <p className="text-2xl font-bold">{stats.donationsCount}</p>
                  </div>
                  <Gift className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Average Donation</p>
                    <p className="text-2xl font-bold">{currencySymbol}{stats.averageDonation.toFixed(2)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-400 to-red-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">This Year</p>
                    <p className="text-2xl font-bold">{currencySymbol}{stats.currentYearTotal.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search donations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedFund} onValueChange={setSelectedFund}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Funds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    {funds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="amount-desc">Highest Amount</SelectItem>
                    <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-6 w-6 mr-2 text-red-500" />
                Donation History ({filteredDonations.length})
              </CardTitle>
              <CardDescription>
                All your donations and their impact on our ministry
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDonations.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No donations found</h3>
                  <p className="text-gray-600 mb-6">
                    {donations.length === 0 
                      ? "You haven't made any donations yet." 
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" asChild>
                    <Link href="/giving">Make Your First Donation</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDonations.map((donation, index) => (
                    <motion.div
                      key={donation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{donation.fund.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(donation.createdAt), 'MMM dd, yyyy')}
                            </span>
                            <span className="capitalize">{donation.paymentMethod.replace('_', ' ').toLowerCase()}</span>
                            {donation.isRecurring && (
                              <Badge variant="outline" className="text-xs">
                                Recurring
                              </Badge>
                            )}
                          </div>
                          {donation.notes && (
                            <p className="text-sm text-gray-500 mt-1">{donation.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {currencySymbol}{donation.amount.toFixed(2)}
                        </div>
                        <Badge className={`${getStatusColor(donation.status)} mt-2`}>
                          <span className="flex items-center">
                            {getStatusIcon(donation.status)}
                            <span className="ml-1">{donation.status}</span>
                          </span>
                        </Badge>
                        {donation.transactionId && (
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {donation.transactionId}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recurring Subscriptions */}
        {subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-600" />
                Recurring Donations
              </CardTitle>
              <CardDescription>
                Manage your recurring giving subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription: any) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{subscription.fund?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {currencySymbol}{subscription.amount} • {subscription.recurringFrequency}
                      </p>
                      <p className="text-xs text-gray-500">
                        Started: {format(new Date(subscription.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={subscription.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {subscription.status === 'COMPLETED' ? 'Active' : subscription.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelSubscription(subscription.transactionId)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Gift className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Make a Donation</h3>
              <p className="text-gray-600 text-sm mb-4">Support our ministry with a one-time or recurring gift</p>
              <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                <Link href="/giving">Give Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Download className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Download Statement</h3>
              <p className="text-gray-600 text-sm mb-4">Get your annual giving statement for tax purposes</p>
              <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                Download PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Set Goals</h3>
              <p className="text-gray-600 text-sm mb-4">Set personal giving goals and track your progress</p>
              <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
                Set Goals
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
