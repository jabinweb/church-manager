import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderIds, status } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      )
    }

    if (!['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    await prisma.order.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: {
        status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in bulk order update:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk update' },
      { status: 500 }
    )
  }
}
