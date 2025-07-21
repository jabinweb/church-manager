import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    })

    // Get commission stats
    const [totalEarnings, pendingCommissions, thisMonthEarnings] = await Promise.all([
      prisma.commission.aggregate({
        where: {
          userId,
          status: { in: ['APPROVED', 'PAID'] }
        },
        _sum: { amount: true }
      }),
      prisma.commission.aggregate({
        where: {
          userId,
          status: 'PENDING'
        },
        _sum: { amount: true }
      }),
      prisma.commission.aggregate({
        where: {
          userId,
          status: { in: ['APPROVED', 'PAID'] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      })
    ])

    // Get referral stats
    const [totalReferrals, activeReferrals] = await Promise.all([
      prisma.user.count({
        where: { referrerId: userId }
      }),
      prisma.user.count({
        where: {
          referrerId: userId,
          isActive: true
        }
      })
    ])

    // Get order stats
    const totalOrders = await prisma.order.count({
      where: { userId }
    })

    // Get recent commissions
    const recentCommissions = await prisma.commission.findMany({
      where: { userId },
      include: {
        fromUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const stats = {
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingCommissions: pendingCommissions._sum.amount || 0,
      thisMonthEarnings: thisMonthEarnings._sum.amount || 0,
      currentBalance: wallet?.balance || 0,
      totalReferrals,
      activeReferrals,
      totalOrders,
      recentCommissions,
      recentOrders
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}