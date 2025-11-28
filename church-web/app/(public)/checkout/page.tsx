'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getChurchSettings } from '@/lib/settings'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, Truck, Plus, MapPin } from 'lucide-react'
import { cartManager } from '@/lib/cart'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string | null
}

interface Address {
  id: string
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  isDefault: boolean
  type: 'HOME' | 'WORK' | 'OTHER'
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [cart, setCart] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  })
  const [saveAddress, setSaveAddress] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [churchSettings, setChurchSettings] = useState<any>({ 
    currency: 'USD',
    churchName: 'Grace Community Church'
  })

  // Load church settings from API endpoint
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/system')
        if (response.ok) {
          const settings = await response.json()
          setChurchSettings(settings)
        }
      } catch (error) {
        console.error('Error loading church settings:', error)
        // Keep default settings on error
      }
    }
    
    loadSettings()
  }, [])

  const loadCart = useCallback(() => {
    const cartItems = cartManager.getCart()
    setCart(cartItems || [])

    if (cartItems.length === 0) {
      router.push('/products')
    }
  }, [router])

  const fetchAddresses = useCallback(async () => {
    if (status !== 'authenticated') return
    
    try {
      const response = await fetch('/api/user/addresses')
      if (response.ok) {
        const data = await response.json()
        const userAddresses = data.addresses || []
        setAddresses(userAddresses)
        
        // Auto-select default address
        const defaultAddress = userAddresses.find((addr: Address) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
        } else if (userAddresses.length > 0) {
          setSelectedAddressId(userAddresses[0].id)
        } else {
          setUseNewAddress(true)
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setUseNewAddress(true)
    }
  }, [status])

  const fetchUserProfile = useCallback(async () => {
    if (status !== 'authenticated') return
    
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const userData = await response.json()
        
        // Prefill form with user data
        setFormData(prev => ({
          ...prev,
          email: userData.email || session?.user?.email || '',
          firstName: userData.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || session?.user?.name?.split(' ').slice(1).join(' ') || '',
          phone: userData.phone || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback to session data
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || ''
        }))
      }
    }
  }, [status, session?.user])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAddresses()
      fetchUserProfile()
    } else if (status === 'unauthenticated') {
      // For guest checkout, keep form empty
      setUseNewAddress(true)
    }
  }, [status, fetchAddresses, fetchUserProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTotal = () => {
    return getSubtotal() // Add tax, shipping, etc. here if needed
  }

  const getSelectedAddress = () => {
    return addresses.find(addr => addr.id === selectedAddressId)
  }

  const handlePlaceOrder = async () => {
    // Get shipping address data
    let shippingAddress
    let savedAddressId = null
    
    if (useNewAddress) {
      // Validate new address form
      const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone']
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields')
        return
      }
      
      shippingAddress = formData

      // Save address if user is authenticated and opted to save
      if (status === 'authenticated' && saveAddress) {
        try {
          const addressData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address1: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            phone: formData.phone,
            isDefault: addresses.length === 0, // Set as default if it's the first address
            type: 'HOME'
          }

          const response = await fetch('/api/user/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addressData)
          })

          if (response.ok) {
            const newAddress = await response.json()
            savedAddressId = newAddress.address.id
            toast.success('Address saved for future use!')
          }
        } catch (error) {
          console.error('Error saving address:', error)
          // Don't fail the order if address saving fails
        }
      }
    } else {
      const selectedAddr = getSelectedAddress()
      if (!selectedAddr) {
        toast.error('Please select a shipping address')
        return
      }
      
      // Check if email is provided
      if (!formData.email) {
        toast.error('Please provide your email address')
        return
      }
      
      shippingAddress = {
        email: formData.email,
        firstName: selectedAddr.firstName,
        lastName: selectedAddr.lastName,
        address: `${selectedAddr.address1}${selectedAddr.address2 ? ', ' + selectedAddr.address2 : ''}`,
        city: selectedAddr.city,
        state: selectedAddr.state,
        zipCode: selectedAddr.zipCode,
        phone: selectedAddr.phone || formData.phone || ''
      }
      savedAddressId = selectedAddressId
    }

    setLoading(true)
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotal(),
        shippingAddress,
        shippingAddressId: savedAddressId
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error('Please sign in to place an order')
          router.push('/auth/signin?callbackUrl=/checkout')
          return
        }
        throw new Error(errorData.error || 'Failed to create order')
      }

      const order = await response.json()
      
      // Initialize Razorpay payment
      await initializePayment(order)

    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const initializePayment = async (order: any) => {
    setProcessingPayment(true)
    
    // Add debugging logs
    console.log('Order data received:', order)
    console.log('Razorpay Key ID:', order.razorpayKeyId)
    console.log('Razorpay Order ID:', order.razorpayOrderId)
    console.log('Total amount:', order.total)
    console.log('Environment:', order.isProduction ? 'Production' : 'Test')

    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.')
      setProcessingPayment(false)
      return
    }

    // Validate required data
    if (!order.razorpayKeyId) {
      toast.error('Payment configuration error. Please try again.')
      setProcessingPayment(false)
      return
    }

    // Show environment warning for test mode
    if (!order.isProduction) {
      toast.info('Running in test mode - No actual payment will be charged')
    }

    const options = {
      key: order.razorpayKeyId,
      amount: Math.round(order.total * 100), // Convert to paise
      currency: churchSettings.currency || 'USD',
      name: churchSettings.churchName || 'Grace Community Church',
      description: `Order Payment ${order.isProduction ? '' : '(Test Mode)'}`,
      order_id: order.razorpayOrderId,
      handler: async function (response: any) {
        try {
          console.log('Payment response:', response)
          
          const verifyResponse = await fetch('/api/orders/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id
            })
          })

          if (verifyResponse.ok) {
            cartManager.clearCart()
            toast.success('Payment successful! Order confirmed.')
            router.push(`/order-confirmation?orderId=${order.id}`)
          } else {
            const errorData = await verifyResponse.json()
            console.error('Verification failed:', errorData)
            toast.error('Payment verification failed')
          }
        } catch (error) {
          console.error('Payment verification error:', error)
          toast.error('Payment verification failed')
        } finally {
          setProcessingPayment(false)
        }
      },
      prefill: {
        name: formData.firstName + ' ' + formData.lastName,
        email: formData.email,
        contact: formData.phone
      },
      modal: {
        ondismiss: function() {
          setProcessingPayment(false)
          toast.error('Payment cancelled')
        }
      },
      theme: {
        color: order.isProduction ? '#10B981' : '#F59E0B' // Green for production, amber for test
      }
    }

    console.log('Razorpay options:', options)

    try {
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Error opening Razorpay:', error)
      toast.error('Failed to open payment gateway')
      setProcessingPayment(false)
    }
  }

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      console.log('Razorpay script loaded successfully')
    }
    script.onerror = () => {
      console.error('Failed to load Razorpay script')
      toast.error('Failed to load payment gateway')
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          {status === 'unauthenticated' && (
            <p className="text-gray-600 mt-2">
              <Link href="/auth/signin?callbackUrl=/checkout" className="text-blue-600 hover:underline">
                Sign in
              </Link> for a faster checkout experience
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                {status === 'authenticated' && (
                  <CardDescription>
                    Welcome back, {session?.user?.name || session?.user?.email}!
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    disabled={status === 'authenticated' && !!session?.user?.email}
                    required
                  />
                  {status === 'authenticated' && session?.user?.email && (
                    <p className="text-xs text-gray-500 mt-1">
                      Using your account email
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {status === 'authenticated' && addresses.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Choose saved address</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setUseNewAddress(!useNewAddress)}
                      >
                        {useNewAddress ? 'Use Saved Address' : 'Use New Address'}
                      </Button>
                    </div>

                    {!useNewAddress && (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedAddressId === address.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedAddressId(address.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">
                                    {address.firstName} {address.lastName}
                                  </span>
                                  {address.isDefault && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {address.type}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {address.company && <div>{address.company}</div>}
                                  <div>{address.address1}</div>
                                  {address.address2 && <div>{address.address2}</div>}
                                  <div>{address.city}, {address.state} {address.zipCode}</div>
                                  {address.phone && <div>{address.phone}</div>}
                                </div>
                              </div>
                              <input
                                type="radio"
                                checked={selectedAddressId === address.id}
                                onChange={() => setSelectedAddressId(address.id)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          asChild
                        >
                          <Link href="/profile/addresses">
                            <MapPin className="h-4 w-4 mr-2" />
                            Manage Addresses
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {(useNewAddress || addresses.length === 0 || status === 'unauthenticated') && (
                  <div className="space-y-4">
                    {status === 'unauthenticated' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          💡 <Link href="/auth/signin?callbackUrl=/checkout" className="font-medium underline">Sign in</Link> to use saved addresses and speed up checkout
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Save Address Option for Authenticated Users */}
                    {status === 'authenticated' && (
                      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                        <input
                          type="checkbox"
                          id="saveAddress"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="saveAddress" className="text-sm">
                          Save this address for future orders
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600">Payment will be processed securely via Razorpay</p>
                  
                  {process.env.NODE_ENV === 'development' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        🧪 <strong>Development Mode:</strong> Using Razorpay test environment - No real payments will be processed
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <Image
                      src={item.image || 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg'}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading || processingPayment}
                >
                  {loading ? 'Creating Order...' : processingPayment ? 'Processing Payment...' : 'Place Order & Pay'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
