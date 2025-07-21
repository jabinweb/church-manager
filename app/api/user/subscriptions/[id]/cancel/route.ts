import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createRazorpayInstance } from '@/lib/razorpay'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptionId = (await params).id

    // Find the donation record
    const donation = await prisma.donation.findFirst({
      where: {
        userId: session.user.id,
        transactionId: subscriptionId,
        isRecurring: true,
        status: 'COMPLETED'
      }
    })

    if (!donation) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Cancel subscription with Razorpay
    try {
      const razorpayInstance = createRazorpayInstance()
      // Use the correct method signature for Razorpay subscription cancellation
      await razorpayInstance.subscriptions.cancel(subscriptionId, true) // true means cancel immediately
    } catch (razorpayError) {
      console.error('Error cancelling Razorpay subscription:', razorpayError)
      // Continue with local cancellation even if Razorpay fails
    }

    // Update donation status
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'REFUNDED', // Use existing enum value
        notes: `${donation.notes || ''} - Cancelled by user on ${new Date().toISOString()}`
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel subscription' 
    }, { status: 500 })
  }
}

