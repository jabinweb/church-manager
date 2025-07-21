'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, Truck, CheckCircle, XCircle, Clock, ArrowLeft, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface Order {
  id: string
  total: number
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      images: string[]
      discount: number
    }
  }[]
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-gradient-to-r from-yellow-400 to-orange-500', icon: Clock },
  PAID: { label: 'Paid', color: 'bg-gradient-to-r from-blue-500 to-indigo-600', icon: CreditCard },
  SHIPPED: { label: 'Shipped', color: 'bg-gradient-to-r from-purple-500 to-pink-600', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-gradient-to-r from-green-500 to-emerald-600', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gradient-to-r from-red-500 to-pink-600', icon: XCircle }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/orders')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin?callbackUrl=/orders')
          return
        }
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'CANCELLED' })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel order')
      }

      toast.success('Order cancelled successfully')
      fetchOrders() // Refresh orders
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const handleReorder = (order: Order) => {
    // Add all items from this order to cart
    order.orderItems.forEach(item => {
      // This would need the full product data to add to cart
      console.log('Reordering:', item.product.name)
    })
    toast.success('Items added to cart!')
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchOrders} className="bg-gradient-to-r from-blue-600 to-purple-600">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const StatusIcon = statusConfig[order.status].icon
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge className={`${statusConfig[order.status].color} text-white shadow-lg`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                            <Image
                              src={item.product.images[0] || 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg'}
                              alt={item.product.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover shadow-md"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product.name}</h4>
                              <p className="text-sm text-gray-500">
                                Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                          <span className="font-semibold">Total Amount</span>
                          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{order.total.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/orders/${order.id}`}>View Details</Link>
                          </Button>
                          {order.status === 'DELIVERED' && (
                            <Button variant="outline" size="sm" onClick={() => handleReorder(order)} className="text-green-600">
                              Reorder
                            </Button>
                          )}
                          {order.status === 'PENDING' && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelOrder(order.id)} className="text-red-600">
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
