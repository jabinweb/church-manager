'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Home, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  ArrowLeft,
  Download,
  Loader2,
  Clock,
  ArrowRight,
  Star,
  Gift
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import ConfettiBoom from 'react-confetti-boom'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: string | null
  totalAmount: number
  status: string
  createdAt: string
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      imageUrl: string | null
      price: number
      description: string | null
    }
  }>
  address?: {
    firstName: string
    lastName: string
    address1: string
    address2: string | null
    city: string
    state: string
    zipCode: string
    phone: string | null
  }
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const orderId = searchParams.get('orderId')

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/order-confirmation/${orderId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const data = await response.json()
      setOrder(data.order)
      
      // Show confetti when order is loaded successfully
      setShowConfetti(true)
      
      // Hide confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false)
      }, 3000)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/order-confirmation')
      return
    }

    if (status === 'authenticated' && orderId) {
      fetchOrder()
    }
  }, [orderId, status, router, fetchOrder])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gradient-to-r from-yellow-500 to-orange-500'
      case 'PROCESSING': return 'bg-gradient-to-r from-blue-500 to-indigo-500'
      case 'SHIPPED': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'DELIVERED': return 'bg-gradient-to-r from-green-500 to-emerald-500'
      case 'CANCELLED': return 'bg-gradient-to-r from-red-500 to-rose-500'
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Package className="h-5 w-5" />
      case 'PROCESSING': return <Package className="h-5 w-5" />
      case 'SHIPPED': return <Truck className="h-5 w-5" />
      case 'DELIVERED': return <CheckCircle className="h-5 w-5" />
      default: return <Package className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-purple-600" />
            <div className="absolute inset-0 bg-purple-600/20 rounded-full animate-ping"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading your order details...</p>
          <div className="mt-4 w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-lg">
            <CardContent className="pt-12 pb-8 px-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Not Found</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We couldn&apos;t find the order you&apos;re looking for. It may have been removed or the link is incorrect.
              </p>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                <Link href="/bookstore">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <ConfettiBoom
          particleCount={100}
          effectCount={3}
          colors={['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
          shapeSize={12}
          effectInterval={300}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-green-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Animated Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-2xl">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Order Confirmed!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Thank you for your purchase! Your order has been successfully placed and we&apos;re excited to get it to you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="xl:col-span-2 space-y-8"
            >
              {/* Order Summary Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-lg overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <p className="text-gray-500 mt-1">Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy')}</p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white px-4 py-2 rounded-full font-semibold shadow-lg`}>
                      <span className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-2 capitalize">{order.status.toLowerCase()}</span>
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <div className="text-3xl font-bold text-green-600">₹{Number(order.totalAmount).toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-600">{order.orderItems.length}</div>
                      <div className="text-sm text-gray-600">Items Ordered</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                      <div className="text-3xl font-bold text-purple-600">2-3</div>
                      <div className="text-sm text-gray-600">Business Days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <Gift className="h-6 w-6 mr-2 text-purple-600" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.orderItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                              <Package className="h-8 w-8 text-purple-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{item.product.name}</h4>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-gray-600">
                              ₹{Number(item.price).toFixed(2)} each
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <Separator className="my-6" />
                    
                    <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <span className="text-xl font-bold text-gray-900">Total Amount</span>
                      <span className="text-3xl font-bold text-green-600">₹{Number(order.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Status & Next Steps */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-6"
            >
              {/* Customer Info */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Mail className="h-5 w-5 mr-2 text-blue-500" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                    <p className="text-gray-600">{order.customerEmail}</p>
                    {order.customerPhone && <p className="text-gray-600">{order.customerPhone}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="h-5 w-5 mr-2 text-purple-500" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    {order.address ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {order.address.firstName} {order.address.lastName}
                        </p>
                        <p className="text-gray-700">{order.address.address1}</p>
                        {order.address.address2 && <p className="text-gray-700">{order.address.address2}</p>}
                        <p className="text-gray-700">
                          {order.address.city}, {order.address.state} {order.address.zipCode}
                        </p>
                        {order.address.phone && <p className="text-gray-700">{order.address.phone}</p>}
                      </div>
                    ) : order.shippingAddress ? (
                      <div className="text-gray-700 whitespace-pre-line">
                        {order.shippingAddress}
                      </div>
                    ) : (
                      <p className="text-gray-500">No shipping address provided</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2" />
                    What&apos;s Next?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) 
                          ? 'bg-green-500' 
                          : 'bg-blue-500'
                      }`}>
                        <span className="text-xs font-bold text-white">1</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order Processing</p>
                        <p className="text-sm text-gray-600">
                          {order.status === 'PENDING' 
                            ? "We're preparing your items" 
                            : "✓ Complete"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        ['SHIPPED', 'DELIVERED'].includes(order.status)
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}>
                        <span className={`text-xs font-bold ${
                          ['SHIPPED', 'DELIVERED'].includes(order.status)
                            ? 'text-white'
                            : 'text-gray-600'
                        }`}>
                          2
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Shipped</p>
                        <p className="text-sm text-gray-600">
                          {order.status === 'SHIPPED' 
                            ? "Your order is on the way" 
                            : order.status === 'DELIVERED' 
                            ? "✓ Complete"
                            : "You'll receive tracking information"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        order.status === 'DELIVERED'
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}>
                        <span className={`text-xs font-bold ${
                          order.status === 'DELIVERED'
                            ? 'text-white'
                            : 'text-gray-600'
                        }`}>
                          3
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Delivered</p>
                        <p className="text-sm text-gray-600">
                          {order.status === 'DELIVERED' 
                            ? "✓ Your order has arrived!" 
                            : "Your order arrives!"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg" asChild>
                    <Link href="/dashboard/orders">
                      View All Orders
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 font-semibold py-3 rounded-xl" asChild>
                    <Link href="/bookstore">Continue Shopping</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}

