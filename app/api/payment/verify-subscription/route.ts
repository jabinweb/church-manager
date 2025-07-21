import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyPayment } from '@/lib/razorpay'
import { churchEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { 
      subscriptionId, 
      paymentId, 
      signature, 
      fundId, 
      donorName, 
      donorEmail 
    } = await request.json()

    // Verify Razorpay signature
    const isValidSignature = verifyPayment(subscriptionId, paymentId, signature)
    
    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Update donation record to completed
    const donation = await prisma.donation.findFirst({
      where: {
        transactionId: subscriptionId,
        isRecurring: true
      },
      include: {
        fund: true
      }
    })

    if (!donation) {
      return NextResponse.json({ error: 'Donation record not found' }, { status: 404 })
    }

    // Update donation status
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'COMPLETED',
        notes: `${donation.notes}, Payment ID: ${paymentId}`
      }
    })

    // Send confirmation email
    const recipientEmail = donorEmail || session?.user?.email
    const recipientName = donorName || session?.user?.name

    if (recipientEmail && recipientName) {
      try {
        const settings = await prisma.systemSettings.findFirst()
        await churchEmailService.sendRecurringDonationConfirmation(
          recipientEmail,
          recipientName,
          {
            amount: Number(donation.amount),
            frequency: donation.recurringFrequency || 'monthly',
            fundName: donation.fund.name,
            subscriptionId,
            currency: settings?.currency || 'USD'
          }
        )
      } catch (emailError) {
        console.error('Failed to send recurring donation confirmation email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        amount: Number(donation.amount),
        frequency: donation.recurringFrequency,
        fundName: donation.fund.name,
        status: 'active'
      }
    })

  } catch (error) {
    console.error('Subscription verification error:', error)
    return NextResponse.json({ 
      error: 'Failed to verify subscription' 
    }, { status: 500 })
  }
}
