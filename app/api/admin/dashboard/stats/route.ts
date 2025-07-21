import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get current totals
    const [totalUsers, totalProducts, totalOrders, totalRevenueResult] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
        _sum: { total: true }
      })
    ])

    // Get last month data for comparison
    const [lastMonthUsers, lastMonthProducts, lastMonthOrders, lastMonthRevenueResult] = await Promise.all([
      prisma.user.count({
        where: {
          joinedAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      prisma.product.count({
        where: {
          isActive: true,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        },
        _sum: { total: true }
      })
    ])

    // Get this month data
    const [thisMonthUsers, thisMonthProducts, thisMonthOrders, thisMonthRevenueResult] = await Promise.all([
      prisma.user.count({
        where: {
          joinedAt: { gte: startOfMonth }
        }
      }),
      prisma.product.count({
        where: {
          isActive: true,
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
          createdAt: { gte: startOfMonth }
        },
        _sum: { total: true }
      })
    ])

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const totalRevenue = totalRevenueResult._sum.total || 0
    const lastMonthRevenue = lastMonthRevenueResult._sum.total || 0
    const thisMonthRevenue = thisMonthRevenueResult._sum.total || 0

    const userGrowth = calculateGrowth(thisMonthUsers, lastMonthUsers)
    const productGrowth = calculateGrowth(thisMonthProducts, lastMonthProducts)
    const orderGrowth = calculateGrowth(thisMonthOrders, lastMonthOrders)
    const revenueGrowth = calculateGrowth(thisMonthRevenue, lastMonthRevenue)

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      userGrowth,
      productGrowth,
      orderGrowth,
      revenueGrowth
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
