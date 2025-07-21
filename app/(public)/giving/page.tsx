'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, Gift, Users, TrendingUp, Heart, Shield, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useSystemSettings } from '@/lib/useSystemSettings'
import Script from 'next/script'
import { motion } from 'framer-motion'

interface Fund {
  id: string
  name: string
  description: string | null
  totalAmount?: number
  targetAmount?: number | null
  currency?: string
}

interface GivingStats {
  thisMonthTotal: number
  thisYearTotal: number
  recurringDonorsCount: number
  activeFundsCount: number
  currency: string
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Predefined amount options
const AMOUNT_OPTIONS = [50, 100, 250, 500, 1000, 2000]

// Recurring frequency options
const RECURRING_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
]

export default function GivingPage() {
  const { data: session } = useSession()
  const { currency, currencySymbol, churchName } = useSystemSettings()
  const [funds, setFunds] = useState<Fund[]>([])
  const [stats, setStats] = useState<GivingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom' | null>(null)
  const [selectedFund, setSelectedFund] = useState<string | null>(null)
  const [donating, setDonating] = useState(false)
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: ''
  })
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState('monthly')

  useEffect(() => {
    fetchGivingData()
  }, [])

  useEffect(() => {
    // Pre-fill donor info if user is logged in
    if (session?.user) {
      setDonorInfo({
        name: session.user.name || '',
        email: session.user.email || ''
      })
    }
  }, [session])

  const fetchGivingData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/giving')
      const data = await res.json()
      setFunds(data.funds || [])
      setStats(data.stats || null)
    } catch (e) {
      console.error('Error fetching giving data:', e)
      toast.error('Failed to load giving information')
    } finally {
      setLoading(false)
    }
  }

  const handleAmountSelect = (value: number | 'custom') => {
    setSelectedAmount(value)
    if (value === 'custom') {
      setAmount('')
    } else {
      setAmount(value.toString())
      setCustomAmount('')
    }
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setAmount(value)
    setSelectedAmount('custom')
  }

  const getEffectiveAmount = () => {
    return selectedAmount === 'custom' ? customAmount : amount
  }

  const handleRazorpayPayment = async (amountNum: number) => {
    try {
      if (isRecurring) {
        // Handle recurring payment subscription
        const subscriptionResponse = await fetch('/api/payment/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountNum,
            fundId: selectedFund,
            frequency: recurringFrequency,
            donorName: donorInfo.name,
            donorEmail: donorInfo.email
          })
        })

        const subscriptionData = await subscriptionResponse.json()
        
        if (!subscriptionResponse.ok) {
          throw new Error(subscriptionData.error || 'Failed to create subscription')
        }

        if (!window.Razorpay) {
          throw new Error('Payment gateway not available. Please refresh the page and try again.')
        }

        const options = {
          key: subscriptionData.keyId,
          subscription_id: subscriptionData.subscriptionId,
          name: churchName || 'Grace Community Church',
          description: `Recurring donation to ${funds.find(f => f.id === selectedFund)?.name || 'Church Fund'}`,
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch('/api/payment/verify-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscriptionId: subscriptionData.subscriptionId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  fundId: selectedFund,
                  donorName: donorInfo.name,
                  donorEmail: donorInfo.email
                })
              })

              const result = await verifyResponse.json()

              if (verifyResponse.ok && result.success) {
                toast.success(
                  `Thank you! Your recurring donation of ${formatCurrency(amountNum, currency)} ${recurringFrequency} has been set up successfully!`
                )
                // Reset form
                resetForm()
                fetchGivingData()
              } else {
                toast.error(result.error || 'Subscription verification failed')
              }
            } catch (verifyError) {
              console.error('Subscription verification error:', verifyError)
              toast.error('Subscription verification failed. Please contact support.')
            } finally {
              setDonating(false)
            }
          },
          prefill: {
            name: donorInfo.name,
            email: donorInfo.email
          },
          theme: {
            color: '#7C3AED'
          },
          modal: {
            ondismiss: function() {
              setDonating(false)
            }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        // Handle one-time payment (existing code)
        const orderResponse = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountNum,
            fundId: selectedFund
          })
        })

        const orderData = await orderResponse.json()
        
        if (!orderResponse.ok) {
          throw new Error(orderData.error || 'Failed to create order')
        }

        if (!window.Razorpay) {
          throw new Error('Payment gateway not available. Please refresh the page and try again.')
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: 'INR',
          name: churchName || 'Grace Community Church',
          description: `Donation to ${funds.find(f => f.id === selectedFund)?.name || 'Church Fund'}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch('/api/payment/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: amountNum,
                  fundId: selectedFund,
                  paymentMethod: 'CREDIT_CARD',
                  donorName: donorInfo.name,
                  donorEmail: donorInfo.email,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature
                })
              })

              const result = await verifyResponse.json()

              if (verifyResponse.ok && result.success) {
                toast.success(
                  `Thank you for your generous donation of ${formatCurrency(amountNum, currency)}!`
                )
                // Reset form
                resetForm()
                fetchGivingData()
              } else {
                toast.error(result.error || 'Payment verification failed')
              }
            } catch (verifyError) {
              console.error('Payment verification error:', verifyError)
              toast.error('Payment verification failed. Please contact support.')
            } finally {
              setDonating(false)
            }
          },
          prefill: {
            name: donorInfo.name,
            email: donorInfo.email
          },
          theme: {
            color: '#7C3AED'
          },
          modal: {
            ondismiss: function() {
              setDonating(false)
            }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process payment')
      setDonating(false)
    }
  }

  const resetForm = () => {
    setAmount('')
    setCustomAmount('')
    setSelectedAmount(null)
    setSelectedFund(null)
    setIsRecurring(false)
    setRecurringFrequency('monthly')
  }

  const handleDonate = async () => {
    const effectiveAmount = getEffectiveAmount()
    
    if (!effectiveAmount || !selectedFund) {
      toast.error('Please select a fund and enter an amount')
      return
    }

    const amountNum = parseFloat(effectiveAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amountNum < 1) {
      toast.error('Minimum donation amount is ' + formatCurrency(1, currency))
      return
    }

    if (!session && (!donorInfo.name || !donorInfo.email)) {
      toast.error('Please provide your name and email to continue')
      return
    }

    setDonating(true)
    await handleRazorpayPayment(amountNum)
  }

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount)
    } catch {
      return `${currencySymbol}${amount.toFixed(2)}`
    }
  }

  return (
    <>
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Professional Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Support Our Mission
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your generous giving helps us share God&apos;s love, serve our community, and advance His kingdom. 
              Every gift makes a meaningful difference.
            </p>
          </motion.div>

          {/* Impact Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {loading ? (
              <>
                <Card className="border-0 shadow-sm"><CardContent className="py-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6" /></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="py-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6" /></CardContent></Card>
              </>
            ) : stats && (
              <>
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-4">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">This Month&apos;s Impact</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisMonthTotal, stats.currency)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-4">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">This Year&apos;s Giving</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisYearTotal, stats.currency)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>

          {/* Main Giving Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            data-section="donation-form"
          >
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-semibold text-gray-900">Make a Donation</CardTitle>
                <CardDescription className="text-gray-600">
                  Choose your giving amount and support area
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Fund Selection */}
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-4 block">
                    Choose a Fund
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {funds.length === 0 ? (
                      <div className="col-span-2 text-center py-8">
                        <Badge variant="secondary" className="text-sm">No funds available</Badge>
                      </div>
                    ) : (
                      funds.map((fund) => (
                        <Button
                          key={fund.id}
                          variant={selectedFund === fund.id ? 'default' : 'outline'}
                          className={`p-4 h-auto text-left justify-start ${
                            selectedFund === fund.id 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
                              : 'hover:bg-purple-50 hover:border-purple-200'
                          }`}
                          onClick={() => setSelectedFund(fund.id)}
                        >
                          <div className="flex items-start space-x-3 w-full">
                            <Gift className={`h-5 w-5 mt-0.5 ${selectedFund === fund.id ? 'text-white' : 'text-purple-600'}`} />
                            <div className="flex-1 text-left">
                              <div className={`font-medium ${selectedFund === fund.id ? 'text-white' : 'text-gray-900'}`}>
                                {fund.name}
                              </div>
                              {fund.description && (
                                <div className={`text-sm mt-1 ${selectedFund === fund.id ? 'text-purple-100' : 'text-gray-600'}`}>
                                  {fund.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </div>

                {/* Payment Type Selection */}
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-4 block">
                    Giving Type
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant={!isRecurring ? 'default' : 'outline'}
                      className={`p-4 h-auto text-left justify-start ${
                        !isRecurring 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
                          : 'hover:bg-purple-50 hover:border-purple-200'
                      }`}
                      onClick={() => setIsRecurring(false)}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <DollarSign className={`h-5 w-5 mt-0.5 ${!isRecurring ? 'text-white' : 'text-purple-600'}`} />
                        <div className="flex-1 text-left">
                          <div className={`font-medium ${!isRecurring ? 'text-white' : 'text-gray-900'}`}>
                            One-Time Gift
                          </div>
                          <div className={`text-sm mt-1 ${!isRecurring ? 'text-purple-100' : 'text-gray-600'}`}>
                            Make a single donation today
                          </div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant={isRecurring ? 'default' : 'outline'}
                      className={`p-4 h-auto text-left justify-start ${
                        isRecurring 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                          : 'hover:bg-green-50 hover:border-green-200'
                      }`}
                      onClick={() => setIsRecurring(true)}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <Heart className={`h-5 w-5 mt-0.5 ${isRecurring ? 'text-white' : 'text-green-600'}`} />
                        <div className="flex-1 text-left">
                          <div className={`font-medium ${isRecurring ? 'text-white' : 'text-gray-900'}`}>
                            Recurring Gift
                          </div>
                          <div className={`text-sm mt-1 ${isRecurring ? 'text-green-100' : 'text-gray-600'}`}>
                            Set up automatic donations
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>

                  {/* Recurring Frequency Selection */}
                  {isRecurring && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Frequency
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {RECURRING_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            variant={recurringFrequency === option.value ? 'default' : 'outline'}
                            size="sm"
                            className={recurringFrequency === option.value ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}
                            onClick={() => setRecurringFrequency(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Selection */}
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-4 block">
                    Select Amount ({currency})
                  </Label>
                  
                  {/* Predefined amounts */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                    {AMOUNT_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        variant={selectedAmount === option ? 'default' : 'outline'}
                        className={`h-12 ${
                          selectedAmount === option 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                            : 'hover:bg-purple-50 hover:border-purple-200'
                        }`}
                        onClick={() => handleAmountSelect(option)}
                      >
                        {currencySymbol}{option}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom amount */}
                  <div className="relative">
                    <Button
                      variant={selectedAmount === 'custom' ? 'default' : 'outline'}
                      className={`w-full h-12 mb-3 ${
                        selectedAmount === 'custom' 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'hover:bg-purple-50 hover:border-purple-200'
                      }`}
                      onClick={() => handleAmountSelect('custom')}
                    >
                      Custom Amount
                    </Button>
                    
                    {selectedAmount === 'custom' && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Enter custom amount"
                          value={customAmount}
                          onChange={(e) => handleCustomAmountChange(e.target.value)}
                          className="pl-8 h-12 text-lg border-purple-200 focus:border-purple-500"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Guest donor info */}
                {!session && (
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Your Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="donorName" className="text-sm font-medium text-gray-700">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="donorName"
                          placeholder="Enter your full name"
                          value={donorInfo.name}
                          onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="donorEmail" className="text-sm font-medium text-gray-700">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="donorEmail"
                          type="email"
                          placeholder="Enter your email"
                          value={donorInfo.email}
                          onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Recurring Payment Notice */}
                {isRecurring && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Heart className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Recurring Donation</p>
                        <p className="text-sm text-green-700 mt-1">
                          Your {recurringFrequency} donation of {getEffectiveAmount() && formatCurrency(parseFloat(getEffectiveAmount()), currency)} will be automatically processed. 
                          You can cancel or modify this at any time from your dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secure payment notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                      <p className="text-sm text-blue-700">
                        Your donation is processed securely through our encrypted payment gateway.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Donate button */}
                <Button
                  onClick={handleDonate}
                  disabled={!getEffectiveAmount() || !selectedFund || donating || (!session && (!donorInfo.name || !donorInfo.email))}
                  className={`w-full h-14 text-lg disabled:opacity-50 ${
                    isRecurring 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  size="lg"
                >
                  {donating ? (
                    <>
                      <Loader2 className="animate-spin mr-3 h-5 w-5" />
                      {isRecurring ? 'Setting up Recurring...' : 'Processing Donation...'}
                    </>
                  ) : (
                    <>
                      {isRecurring ? <Heart className="mr-3 h-5 w-5" /> : <CreditCard className="mr-3 h-5 w-5" />}
                      {isRecurring 
                        ? `Set up ${recurringFrequency} giving ${getEffectiveAmount() && formatCurrency(parseFloat(getEffectiveAmount()), currency)}`
                        : `Donate ${getEffectiveAmount() && formatCurrency(parseFloat(getEffectiveAmount()), currency)}`
                      }
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fund Details */}
          {funds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Where Your Gift Goes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {funds.map((fund) => (
                  <Card key={fund.id} className="border-0 shadow-sm bg-white/80 backdrop-blur">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Gift className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{fund.name}</h3>
                          <p className="text-gray-600 text-sm mb-3">{fund.description}</p>
                          <div className="space-y-1">
                            {typeof fund.totalAmount === 'number' && (
                              <p className="text-sm text-gray-500">
                                <span className="font-medium">Total Given:</span> {formatCurrency(fund.totalAmount, fund.currency || currency)}
                              </p>
                            )}
                            {fund.targetAmount && (
                              <p className="text-sm text-gray-500">
                                <span className="font-medium">Goal:</span> {formatCurrency(fund.targetAmount, fund.currency || currency)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recurring Giving CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Consider Regular Giving</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Set up recurring donations to provide steady support for our ministries and help us plan for the future.
                </p>
                {session ? (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setIsRecurring(true)
                      setRecurringFrequency('monthly')
                      document.querySelector('[data-section="donation-form"]')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Set Up Recurring Giving
                  </Button>
                ) : (
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/auth/signin">
                      <Heart className="h-4 w-4 mr-2" />
                      Sign In for Recurring Giving
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}

// Helper component for form labels
function Label({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
      {children}
    </label>
  )
}
