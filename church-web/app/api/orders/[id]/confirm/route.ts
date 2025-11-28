import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'Order already processed' }, { status: 400 })
    }

    // Update order status
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING }
      })
      
      return {
        order: updatedOrder,
      }
    })

    return NextResponse.json({
      success: true,
      order: result.order,
    })

  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json(
      { error: 'Failed to confirm order' },
      { status: 500 }
    )
  }
}