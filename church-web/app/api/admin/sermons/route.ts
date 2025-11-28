import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { speaker: { contains: search, mode: 'insensitive' } },
        { series: { contains: search, mode: 'insensitive' } }
      ]
    }

    const sermons = await prisma.sermon.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    })

    // Get stats
    const totalSermons = await prisma.sermon.count()
    const thisMonthSermons = await prisma.sermon.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
    const totalViews = await prisma.sermon.aggregate({
      _sum: { views: true }
    })
    
    // Calculate average duration (simplified)
    const avgDuration = '38m' // This would need proper calculation based on duration format

    const stats = {
      totalSermons,
      thisMonthSermons,
      totalViews: totalViews._sum.views || 0,
      avgDuration
    }

    return NextResponse.json({ sermons, stats })
  } catch (error) {
    console.error('Error fetching sermons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
