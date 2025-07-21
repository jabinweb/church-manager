'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Download, MoreHorizontal, Eye, Package, Truck, CheckCircle, XCircle, Clock, CreditCard, Filter } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Order {
  id: string
  totalAmount: number // Changed from total to totalAmount to match API
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' // Updated to match schema
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      imageUrl: string | null // Changed from images to imageUrl
    }
  }[]
}

const statusConfig = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500', 
    icon: Clock,
    description: 'Awaiting payment'
  },
  PROCESSING: { 
    label: 'Processing', 
    color: 'bg-gradient-to-r from-blue-500 to-indigo-600', 
    icon: CreditCard,
    description: 'Payment confirmed'
  },
  SHIPPED: { 
    label: 'Shipped', 
    color: 'bg-gradient-to-r from-purple-500 to-pink-600', 
    icon: Truck,
    description: 'Order shipped'
  },
  DELIVERED: { 
    label: 'Delivered', 
    color: 'bg-gradient-to-r from-green-500 to-emerald-600', 
    icon: CheckCircle,
    description: 'Successfully delivered'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'bg-gradient-to-r from-red-500 to-pink-600', 
    icon: XCircle,
    description: 'Order cancelled'
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()
      
      // Ensure orders is always an array
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
      setOrders([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(o => o.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId])
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId))
    }
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order')
      return
    }

    setBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrders,
          status: newStatus
        })
      })

      if (!response.ok) throw new Error('Bulk update failed')

      toast.success(`Successfully updated ${selectedOrders.length} orders`)
      setSelectedOrders([])
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update orders')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Status update failed')

      toast.success('Order status updated successfully')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Orders Management
            </h1>
            <p className="text-gray-600 mt-2">Manage customer orders and track shipments</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {Object.entries(statusConfig).map(([status, config], index) => {
            const StatusIcon = config.icon
            const count = Array.isArray(orders) ? orders.filter(order => order.status === status).length : 0
            return (
              <Card key={status} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{config.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <StatusIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{config.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>

        {/* Main Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <CardTitle className="text-2xl font-bold">All Orders</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedOrders.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200"
                    >
                      <span className="text-sm font-medium text-blue-700">
                        {selectedOrders.length} selected
                      </span>
                      <Select onValueChange={handleBulkStatusUpdate}>
                        <SelectTrigger className="w-40 bg-white">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROCESSING">Mark as Processing</SelectItem>
                          <SelectItem value="SHIPPED">Mark as Shipped</SelectItem>
                          <SelectItem value="DELIVERED">Mark as Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Mark as Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders, customers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-64 bg-white shadow-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white shadow-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="w-10 h-10 border-4 border-gray-100 border-t-purple-500 rounded-full animate-spin absolute top-1 left-1"></div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={Array.isArray(orders) && selectedOrders.length === orders.length && orders.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="font-semibold">Order</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(orders) && orders.map((order, index) => {
                        const StatusIcon = statusConfig[order.status]?.icon || Clock
                        return (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900">#{order.id.slice(-8)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {order.user.name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{order.user.name || 'Unknown'}</p>
                                  <p className="text-sm text-gray-500">{order.user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {order.orderItems.slice(0, 2).map((item) => (
                                  <div key={item.id} className="text-sm">
                                    <span className="font-medium">{item.quantity}x</span>{' '}
                                    <span className="text-gray-600">{item.product.name}</span>
                                  </div>
                                ))}
                                {order.orderItems.length > 2 && (
                                  <p className="text-xs text-blue-600 font-medium">
                                    +{order.orderItems.length - 2} more items
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                ₹{Number(order.totalAmount || 0).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig[order.status]?.color || 'bg-gray-500'} text-white shadow-md`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[order.status]?.label || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/orders/${order.id}`} className="flex items-center">
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  {order.status === 'PENDING' && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order.id, 'PROCESSING')}
                                      className="text-blue-600"
                                    >
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Mark as Processing
                                    </DropdownMenuItem>
                                  )}
                                  {order.status === 'PROCESSING' && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                                      className="text-purple-600"
                                    >
                                      <Truck className="h-4 w-4 mr-2" />
                                      Mark as Shipped
                                    </DropdownMenuItem>
                                  )}
                                  {order.status === 'SHIPPED' && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                                      className="text-green-600"
                                    >
                                      <Package className="h-4 w-4 mr-2" />
                                      Mark as Delivered
                                    </DropdownMenuItem>
                                  )}
                                  {['PENDING', 'PROCESSING'].includes(order.status) && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                      className="text-red-600"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancel Order
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!loading && (!Array.isArray(orders) || orders.length === 0) && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
    