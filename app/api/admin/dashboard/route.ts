import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total members (from User table where role is MEMBER)
    const totalMembers = await prisma.user.count({
      where: { role: 'MEMBER' }
    })
    // Get total events
    const totalEvents = await prisma.event.count()
    // Get total sermons
    const totalSermons = await prisma.sermon.count()
    // Get total giving (sum of all donations)
    const totalGiving = await prisma.donation.aggregate({
      _sum: { amount: true }
    })

    return NextResponse.json({
      stats: {
        totalMembers,
        totalEvents,
        totalSermons,
        totalGiving: totalGiving._sum.amount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
