import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await params

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                description: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        address: {
          select: {
            firstName: true,
            lastName: true,
            address1: true,
            address2: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order confirmation:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
       

