import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createOrder, verifyPayment } from '@/lib/razorpay'
import { churchEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    const { 
      amount, 
      fundId, 
      paymentMethod = 'CREDIT_CARD',
      donorName,
      donorEmail,
      isRecurring = false,
      recurringFrequency,
      notes,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = await request.json()

    // Get settings for currency
    const settings = await prisma.systemSettings.findFirst()
    const currency = settings?.currency || 'USD'

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    if (!fundId) {
      return NextResponse.json({ error: 'Fund selection is required' }, { status: 400 })
    }

    // Verify fund exists and is active
    const fund = await prisma.fund.findUnique({
      where: { id: fundId }
    })

    if (!fund || !fund.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive fund' }, { status: 400 })
    }

    let transactionId: string | null = null

    // Handle Razorpay payment verification
    if (paymentMethod === 'CREDIT_CARD' && razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const isValidPayment = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)
      
      if (!isValidPayment) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
      }
      
      transactionId = razorpayPaymentId
    } else if (paymentMethod === 'CREDIT_CARD') {
      return NextResponse.json({ error: 'Payment details required for card payments' }, { status: 400 })
    } else {
      // For non-card payments, generate a transaction ID
      transactionId = `${paymentMethod.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        userId: session?.user?.id || null,
        fundId,
        amount: amount,
        paymentMethod: paymentMethod as any,
        transactionId,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : null,
        status: 'COMPLETED',
        donorName: donorName || session?.user?.name || null,
        donorEmail: donorEmail || session?.user?.email || null,
        notes: notes || null
      },
      include: {
        fund: true,
        user: true
      }
    })

    // Send thank you email
    const recipientEmail = donorEmail || session?.user?.email
    const recipientName = donorName || session?.user?.name

    if (recipientEmail && recipientName) {
      try {
        await churchEmailService.sendDonationThankYou(
          recipientEmail,
          recipientName,
          {
            amount: Number(amount),
            donationType: fund.name,
            transactionId,
            createdAt: donation.createdAt,
            currency
          }
        )
      } catch (emailError) {
        console.error('Failed to send donation thank you email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        amount: Number(donation.amount),
        currency,
        transactionId: donation.transactionId,
        fundName: fund.name,
        createdAt: donation.createdAt
      }
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during payment processing' 
    }, { status: 500 })
  }
}
