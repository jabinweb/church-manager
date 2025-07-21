import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CommissionService } from '@/lib/commission'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        joinedAt: true,
        role: true,
        referralCode: true,
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get team stats
    const stats = await CommissionService.getTeamStats(id)

    // Get wallet info
    const wallet = await prisma.wallet.findUnique({
      where: { userId: id }
    })

    // Get recent commissions
    const recentCommissions = await prisma.commission.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        level: true,
        type: true,
        status: true,
        createdAt: true
      }
    })

    const profile = {
      ...user,
      stats: {
        ...stats,
        totalEarnings: wallet?.totalEarnings || 0,
        walletBalance: wallet?.balance || 0
      },
      recentCommissions
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
