import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { CommissionService } from '@/lib/commission'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get team stats
    const teamStats = await CommissionService.getTeamStats(userId)

    // Get wallet info
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    })

    // Get pending commissions
    const pendingCommissions = await prisma.commission.aggregate({
      where: { 
        userId,
        status: 'PENDING'
      },
      _sum: { amount: true }
    })

    const stats = {
      ...teamStats,
      totalEarnings: wallet?.totalEarnings || 0,
      walletBalance: wallet?.balance || 0,
      pendingCommissions: pendingCommissions._sum.amount || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
