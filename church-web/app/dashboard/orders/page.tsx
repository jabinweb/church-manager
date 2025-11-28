'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Eye, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

interface Order {
  id: string
  totalAmount: number
  status: string
  createdAt: string
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
      imageUrl: string | null
    }
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'PAID': return 'bg-blue-500'
      case 'SHIPPED': return 'bg-purple-500'
      case 'DELIVERED': return 'bg-green-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className=" space-y-8">
        <DashboardHeader
          title="My Orders"
          description="Track and manage your orders"
          icon={<Package className="h-6 w-6 text-white" />}
        />

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet</p>
              <Button asChild>
                <Link href="/products">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {order.status}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/order-confirmation?orderId=${order.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}
                        </span>
                        <span className="text-lg font-bold">₹{Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex space-x-3 overflow-x-auto">
                        {order.orderItems.slice(0, 3).map((item, itemIndex) => (
                          <div key={item.id} className="flex-shrink-0 flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              {item.product.imageUrl ? (
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[100px]">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {order.orderItems.length > 3 && (
                          <span className="text-sm text-gray-500 self-center">
                            +{order.orderItems.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
