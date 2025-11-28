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
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ]
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        registrations: true,
        _count: {
          select: {
            registrations: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    // Get stats
    const upcomingEvents = await prisma.event.count({
      where: {
        startDate: {
          gte: new Date()
        },
        status: 'PUBLISHED'
      }
    })
    
    const thisMonthEvents = await prisma.event.count({
      where: {
        startDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        }
      }
    })

    const totalRegistrations = await prisma.eventRegistration.count()
    const thisYearEvents = await prisma.event.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1)
        }
      }
    })

    const stats = {
      upcomingEvents,
      thisMonthEvents,
      totalRegistrations,
      thisYearEvents
    }

    return NextResponse.json({ events, stats })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
