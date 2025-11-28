import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getRazorpayConfig } from '@/lib/razorpay'
import crypto from 'crypto'
import { churchEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await request.json()

    const config = getRazorpayConfig()
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', config.keySecret)
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
    const generated_signature = hmac.digest('hex')

    if (generated_signature !== razorpay_signature) {
      console.error('Payment signature verification failed')
      console.error('Generated:', generated_signature)
      console.error('Received:', razorpay_signature)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Process successful payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const order = await tx.order.update({
        where: { 
          id: orderId,
          userId: session.user.id
        },
        data: {
          status: 'PROCESSING',
          notes: `Payment ID: ${razorpay_payment_id}`
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          user: true,
          address: true
        }
      })

      return order
    })

    // Send order confirmation email (don't block on failure)
    setImmediate(async () => {
      try {
        const emailResult = await churchEmailService.sendOrderConfirmation(
          result.customerEmail,
          result.customerName,
          result
        )
        if (!emailResult.skipped) {
          console.log('Order confirmation email sent successfully')
        }
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
      }
    })

    console.log('Payment verified and order processed successfully')
    return NextResponse.json({ 
      success: true,
      order: result
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
   