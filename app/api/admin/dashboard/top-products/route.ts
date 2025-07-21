import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get top products by order count this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const topProducts = await prisma.product.findMany({
      take: 5,
      include: {
        orderItems: {
          where: {
            order: {
              createdAt: { gte: startOfMonth },
              status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
            }
          },
          select: {
            quantity: true,
            price: true
          }
        }
      }
    })

    const productsWithStats = topProducts.map(product => {
      const orderCount = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalRevenue = product.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        orderCount,
        totalRevenue
      }
    }).filter(product => product.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)

    return NextResponse.json({ products: productsWithStats })
  } catch (error) {
    console.error('Error fetching top products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top products' },
      { status: 500 }
    )
  }
}
