import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total requests
    const totalRequests = await prisma.payout.count()

    // Get amounts by status
    const [pendingResult, approvedResult, paidResult] = await Promise.all([
      prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true }
      }),
      prisma.payout.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true }
      }),
      prisma.payout.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
      })
    ])

    return NextResponse.json({
      totalRequests,
      pendingAmount: pendingResult._sum.amount || 0,
      approvedAmount: approvedResult._sum.amount || 0,
      paidAmount: paidResult._sum.amount || 0
    })
  } catch (error) {
    console.error('Error fetching payout stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payout stats' },
      { status: 500 }
    )
  }
}
