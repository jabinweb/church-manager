'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Calendar, MapPin, Mail, CreditCard, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface OrderDetails {
  id: string
  total: number
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  user: {
    name: string
    email: string
  }
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      images: string[]
      discount: number
      sku: string
    }
  }[]
}

const statusConfig = {
  PENDING: { 
    label: 'Order Placed', 
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500', 
    icon: Clock,
    description: 'Your order is being processed'
  },
  PAID: { 
    label: 'Payment Confirmed', 
    color: 'bg-gradient-to-r from-blue-500 to-indigo-600', 
    icon: CreditCard,
    description: 'Payment received successfully'
  },
  SHIPPED: { 
    label: 'Order Shipped', 
    color: 'bg-gradient-to-r from-purple-500 to-pink-600', 
    icon: Truck,
    description: 'Your order is on the way'
  },
  DELIVERED: { 
    label: 'Delivered', 
    color: 'bg-gradient-to-r from-green-500 to-emerald-600', 
    icon: CheckCircle,
    description: 'Order delivered successfully'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'bg-gradient-to-r from-red-500 to-pink-600', 
    icon: XCircle,
    description: 'Order was cancelled'
  }
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!params.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/orders/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin?callbackUrl=/orders/' + params.id)
          return
        }
        throw new Error('Order not found')
      }
      
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleCancelOrder = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })

      if (!response.ok) throw new Error('Failed to cancel order')

      toast.success('Order cancelled successfully')
      fetchOrder()
    } catch (error) {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="w-12 h-12 border-4 border-gray-100 border-t-purple-500 rounded-full animate-spin absolute top-2 left-2 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Order not found'}
          </h1>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/orders">Back to Orders</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  const StatusIcon = statusConfig[order.status].icon
  const statusInfo = statusConfig[order.status]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" asChild className="mb-6 hover:bg-gray-100">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Order #{order.id.slice(-8)}
                </h1>
                <p className="text-gray-600 flex items-center mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <Badge className={`${statusInfo.color} text-white px-4 py-2 text-sm font-medium shadow-lg`}>
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {statusInfo.label}
                </Badge>
                <p className="text-sm text-gray-500 mt-2">{statusInfo.description}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <Package className="h-6 w-6 mr-3 text-blue-600" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.orderItems.map((item, index) => {
                      const discountedPrice = item.product.discount > 0 
                        ? item.price - (item.price * item.product.discount / 100)
                        : item.price

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="group flex items-center space-x-4 p-6 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300 hover:border-gray-200 bg-gradient-to-r from-white to-gray-50"
                        >
                          <div className="relative">
                            <Image
                              src={item.product.images[0] || 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg'}
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow"
                            />
                            {item.product.discount > 0 && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {item.product.discount}% OFF
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.product.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>SKU: {item.product.sku}</span>
                              <span>•</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                            <div className="flex items-center mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                              ))}
                              <span className="text-xs text-gray-500 ml-2">(4.5)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              ₹{(discountedPrice * item.quantity).toFixed(2)}
                            </p>
                            {item.product.discount > 0 && (
                              <p className="text-sm text-gray-400 line-through">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Order Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Order Placed */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Order Placed</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <div className="w-full bg-green-100 h-1 rounded-full mt-2"></div>
                      </div>
                    </div>
                    
                    {/* Payment Confirmed */}
                    {['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Payment Confirmed</p>
                          <p className="text-sm text-gray-500">Payment processed successfully</p>
                          <div className="w-full bg-blue-100 h-1 rounded-full mt-2"></div>
                        </div>
                      </div>
                    )}

                    {/* Order Shipped */}
                    {['SHIPPED', 'DELIVERED'].includes(order.status) && (
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <Truck className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Order Shipped</p>
                          <p className="text-sm text-gray-500">Your package is on the way</p>
                          <div className="w-full bg-purple-100 h-1 rounded-full mt-2"></div>
                        </div>
                      </div>
                    )}

                    {/* Order Delivered */}
                    {order.status === 'DELIVERED' && (
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Order Delivered</p>
                          <p className="text-sm text-gray-500">Package delivered successfully</p>
                          <div className="w-full bg-green-100 h-1 rounded-full mt-2"></div>
                        </div>
                      </div>
                    )}

                    {/* Order Cancelled */}
                    {order.status === 'CANCELLED' && (
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <XCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Order Cancelled</p>
                          <p className="text-sm text-gray-500">Order was cancelled</p>
                          <div className="w-full bg-red-100 h-1 rounded-full mt-2"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary & Actions */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">₹{order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-green-600 font-semibold">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.razorpayOrderId && (
                    <div className="pt-4 border-t bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 font-medium">Payment Details</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {order.razorpayPaymentId || 'Processing...'}
                      </p>
                    </div>
                  )}

                  {order.status === 'PENDING' && (
                    <Button 
                      variant="destructive" 
                      className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg"
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Order'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">{order.user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    <Package className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">{order.user.name}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg" asChild>
                <Link href="/orders">View All Orders</Link>
              </Button>
              <Button variant="outline" className="w-full border-2 hover:bg-gray-50" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
