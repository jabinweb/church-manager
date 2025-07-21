import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, reason } = await request.json()

    const result = await prisma.$transaction(async (tx) => {
      // Get order with items
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
          status: { in: ['PENDING', 'PAID'] } // Only allow cancellation for these statuses
        },
        include: {
          orderItems: true
        }
      })

      if (!order) {
        throw new Error('Order not found or cannot be cancelled')
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED'
        }
      })

      // Restore stock for all items
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })
      }

      // If order was paid, reverse commissions
      if (order.status === 'PAID') {
        await tx.commission.updateMany({
          where: { orderId: order.id },
          data: { status: 'CANCELLED' }
        })

        // Reverse wallet earnings (you may want to handle this differently)
        const commissions = await tx.commission.findMany({
          where: { orderId: order.id }
        })

        for (const commission of commissions) {
          await tx.wallet.update({
            where: { userId: commission.userId },
            data: {
              balance: { decrement: commission.amount },
              totalEarnings: { decrement: commission.amount }
            }
          })
        }
      }

      return updatedOrder
    })

    return NextResponse.json({ 
      success: true,
      order: result
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
