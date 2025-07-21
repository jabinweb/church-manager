'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  Search,
  Filter,
  CreditCard,
  Users,
  Target,
  PieChart,
  Plus,
  Settings,
  ArrowUpDown,
  Eye,
  Edit,
  BarChart3,
  Receipt,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface Donation {
  id: string
  amount: number
  paymentMethod: string
  transactionId: string | null
  isRecurring: boolean
  status: string
  donorName: string | null
  donorEmail: string | null
  createdAt: string
  user?: {
    name: string | null
    email: string
  }
  fund: {
    name: string
  }
}

interface RecurringDonor {
  id: string
  name: string
  amount: number
  frequency: string
  nextDate: string
  status: string
  totalDonations: number
}

interface Fund {
  id: string
  name: string
  description: string | null
  targetAmount: number | null
  isActive: boolean
  totalAmount: number
}

interface FundDistribution {
  name: string
  amount: number
  percentage: number
}

interface GivingStats {
  thisMonthTotal: number
  thisYearTotal: number
  recurringDonorsCount: number
  activeFundsCount: number
}

interface GivingData {
  donations: Donation[]
  funds: Fund[]
  recurringDonors: RecurringDonor[]
  stats: GivingStats
  fundDistribution: FundDistribution[]
}

export default function GivingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('this-month')
  const [activeTab, setActiveTab] = useState('donations')
  const [donations, setDonations] = useState<Donation[]>([])
  const [recurringDonors, setRecurringDonors] = useState<RecurringDonor[]>([])
  const [fundManagement, setFundManagement] = useState<Fund[]>([])
  const [funds, setFunds] = useState<FundDistribution[]>([])
  const [stats, setStats] = useState<GivingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchGivingData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      params.append('dateFilter', dateFilter)

      const response = await fetch(`/api/admin/giving?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch giving data')
      
      const data: GivingData = await response.json()
      setDonations(data.donations)
      setRecurringDonors(data.recurringDonors || [])
      setFundManagement(data.funds || [])
      setStats(data.stats)
      
      // Calculate fund distribution for sidebar
      const totalAmount = data.funds?.reduce((sum, fund) => sum + fund.totalAmount, 0) || 1
      const distribution: FundDistribution[] = data.funds?.map(fund => ({
        name: fund.name,
        amount: fund.totalAmount,
        percentage: Math.round((fund.totalAmount / totalAmount) * 100)
      })) || []
      setFunds(distribution)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, dateFilter])

  useEffect(() => {
    if (mounted) {
      fetchGivingData()
    }
  }, [fetchGivingData, mounted])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const statsData = stats ? [
    { title: 'Total This Month', value: `$${stats.thisMonthTotal.toLocaleString()}`, change: '+8%', icon: DollarSign, color: 'text-green-600' },
    { title: 'Total This Year', value: `$${stats.thisYearTotal.toLocaleString()}`, change: '+12%', icon: TrendingUp, color: 'text-blue-600' },
    { title: 'Recurring Donors', value: stats.recurringDonorsCount.toString(), change: '+5', icon: Users, color: 'text-purple-600' },
    { title: 'Funds Active', value: stats.activeFundsCount.toString(), change: '2 new', icon: Target, color: 'text-orange-600' },
  ] : []

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'CREDIT_CARD': return 'bg-blue-100 text-blue-800'
      case 'BANK_TRANSFER': return 'bg-green-100 text-green-800'
      case 'CHECK': return 'bg-yellow-100 text-yellow-800'
      case 'CASH': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'donations', label: 'Recent Donations', icon: DollarSign },
    { id: 'recurring', label: 'Recurring Donors', icon: Users },
    { id: 'funds', label: 'Fund Management', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading giving data: {error}</p>
          <Button onClick={fetchGivingData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Giving & Donations</h1>
          <p className="text-gray-600 mt-2">Track donations, manage funds, and view giving reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/giving/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" asChild>
            <Link href="/admin/giving/funds/new">
              <Plus className="mr-2 h-4 w-4" />
              New Fund
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsData.length === 0 ? (
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
                <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex border-b mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'donations' && 'Recent Donations'}
                {activeTab === 'recurring' && 'Recurring Donors'}
                {activeTab === 'funds' && 'Fund Management'}
                {activeTab === 'analytics' && 'Giving Analytics'}
              </CardTitle>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {activeTab !== 'analytics' && (
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="this-year">This Year</option>
                  </select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Donations Tab */}
              {activeTab === 'donations' && (
                loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading donations...</span>
                  </div>
                ) : donations.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No donations found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold">{donation.donorName || donation.user?.name || 'Anonymous'}</p>
                              {donation.isRecurring && (
                                <Badge variant="outline" className="text-xs">Recurring</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="font-medium text-green-600">
                                ${donation.amount.toFixed(2)}
                              </span>
                              <span>{donation.fund.name}</span>
                              <Badge className={getMethodColor(donation.paymentMethod)} variant="secondary">
                                {donation.paymentMethod.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                              {donation.transactionId && (
                                <>
                                  <span>•</span>
                                  <span>{donation.transactionId}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={donation.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {donation.status}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/giving/donations/${donation.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Recurring Donors Tab */}
              {activeTab === 'recurring' && (
                loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading recurring donors...</span>
                  </div>
                ) : recurringDonors.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recurring donors found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recurringDonors.map((donor) => (
                      <div key={donor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{donor.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="font-medium text-blue-600">
                                ${donor.amount.toFixed(2)} {donor.frequency}
                              </span>
                              <span>Next: {donor.nextDate}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Total donated: ${donor.totalDonations.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={donor.status === 'Active' ? 'default' : 'secondary'}>
                            {donor.status}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/giving/recurring/${donor.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Fund Management Tab */}
              {activeTab === 'funds' && (
                loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading funds...</span>
                  </div>
                ) : fundManagement.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No funds found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fundManagement.map((fund) => (
                      <div key={fund.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{fund.name}</h3>
                            <p className="text-sm text-gray-600">{fund.description || 'No description'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{fund.isActive ? 'Active' : 'Inactive'}</Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/giving/funds/${fund.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                        {fund.targetAmount && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: ${fund.totalAmount.toLocaleString()} / ${fund.targetAmount.toLocaleString()}</span>
                              <span className="font-medium">{Math.round((fund.totalAmount / fund.targetAmount) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${Math.min((fund.totalAmount / fund.targetAmount) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Monthly Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-center justify-center text-gray-500">
                          Chart Placeholder - Monthly giving trends
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Payment Methods</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-center justify-center text-gray-500">
                          Chart Placeholder - Payment method breakdown
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Funds Breakdown Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Fund Distribution</CardTitle>
              <CardDescription>This month&apos;s giving breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {funds.map((fund) => (
                    <div key={fund.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{fund.name}</span>
                        <span className="text-gray-600">${fund.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${fund.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">{fund.percentage}% of total</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/giving/reports">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Full Report
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/giving/donations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Donation
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/giving/export">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/giving/reconcile">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Reconcile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
