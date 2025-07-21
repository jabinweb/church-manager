import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createOrder, getRazorpayKeyId } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { amount, fundId } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    if (!fundId) {
      return NextResponse.json({ error: 'Fund selection is required' }, { status: 400 })
    }

    // First check if environment variables are configured
    const testKeyId = process.env.RAZORPAY_TEST_KEY_ID
    const testKeySecret = process.env.RAZORPAY_TEST_KEY_SECRET
    const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID
    const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET
    const razorpayEnv = process.env.RAZORPAY_ENV

    console.log('Razorpay Environment Check:', {
      env: razorpayEnv,
      hasTestKeyId: !!testKeyId,
      hasTestKeySecret: !!testKeySecret,
      hasLiveKeyId: !!liveKeyId,
      hasLiveKeySecret: !!liveKeySecret,
      testKeyIdPrefix: testKeyId?.substring(0, 12),
      liveKeyIdPrefix: liveKeyId?.substring(0, 12)
    })

    if (!testKeyId || !testKeySecret) {
      return NextResponse.json({ 
        error: 'Razorpay credentials not configured. Please contact administrator.' 
      }, { status: 500 })
    }

    // Verify Razorpay configuration
    try {
      const razorpayKeyId = getRazorpayKeyId()
      console.log('Using Razorpay Key ID:', razorpayKeyId?.substring(0, 12))
      
      if (!razorpayKeyId) {
        throw new Error('Razorpay key ID not configured')
      }
    } catch (configError) {
      console.error('Razorpay configuration error:', configError)
      return NextResponse.json({ 
        error: 'Payment gateway not configured properly. Please contact support.' 
      }, { status: 500 })
    }

    // Get settings for currency
    const settings = await prisma.systemSettings.findFirst()
    const currency = settings?.currency || 'USD'

    // For Razorpay, we need INR. Convert if necessary
    let razorpayAmount = amount
    let conversionRate = 1
    
    if (currency !== 'INR') {
      // Simple currency conversion - in production, use a real currency API
      const conversionRates: Record<string, number> = {
        'USD': 83,
        'EUR': 90,
        'GBP': 104,
        'CAD': 61,
        'AUD': 55
      }
      
      conversionRate = conversionRates[currency] || 83
      razorpayAmount = amount * conversionRate
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('Creating Razorpay order:', {
      orderId,
      amount: razorpayAmount,
      originalAmount: amount,
      currency: currency,
      targetCurrency: 'INR'
    })

    // Create Razorpay order (always in INR)
    const razorpayOrder = await createOrder(razorpayAmount, orderId)

    console.log('Razorpay order created successfully:', {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      status: razorpayOrder.status
    })

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: 'INR', // Razorpay only supports INR
      originalAmount: amount,
      originalCurrency: currency,
      conversionRate,
      keyId: getRazorpayKeyId() // Include key ID for frontend
    })

  } catch (error: any) {
    console.error('Detailed Razorpay error:', {
      error: error,
      message: error.message,
      statusCode: error.statusCode,
      details: error.error
    })
    
    // Provide more specific error messages
    if (error.statusCode === 401) {
      return NextResponse.json({ 
        error: 'Razorpay authentication failed. Please check API credentials.' 
      }, { status: 500 })
    }
    
    if (error.statusCode === 400) {
      return NextResponse.json({ 
        error: `Razorpay error: ${error.error?.description || 'Invalid request'}` 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create payment order. Please try again.' 
    }, { status: 500 })
  }
}
