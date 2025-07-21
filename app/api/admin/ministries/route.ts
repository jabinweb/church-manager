import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch ministries with volunteer count
    const ministries = await prisma.ministry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { volunteers: true }
        }
      }
    })

    // Calculate stats
    const stats = {
      totalMinistries: ministries.length,
      activeMinistries: ministries.filter(m => m.isActive).length,
      totalVolunteers: ministries.reduce((sum, m) => sum + m._count.volunteers, 0),
      recentlyCreated: ministries.filter(m => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(m.createdAt) > weekAgo
      }).length
    }

    return NextResponse.json({ 
      ministries: ministries.map(ministry => ({
        ...ministry,
        createdAt: ministry.createdAt.toISOString(),
        updatedAt: ministry.updatedAt.toISOString()
      })),
      stats 
    })
  } catch (error) {
    console.error('Error fetching ministries:', error)
    return NextResponse.json({ error: 'Failed to fetch ministries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, leader, meetingTime, location, imageUrl, isActive } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Ministry name is required' }, { status: 400 })
    }

    const ministry = await prisma.ministry.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        leader: leader?.trim() || null,
        meetingTime: meetingTime?.trim() || null,
        location: location?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        isActive: isActive ?? true
      },
      include: {
        _count: {
          select: { volunteers: true }
        }
      }
    })

    return NextResponse.json({ 
      ministry: {
        ...ministry,
        createdAt: ministry.createdAt.toISOString(),
        updatedAt: ministry.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating ministry:', error)
    return NextResponse.json({ error: 'Failed to create ministry' }, { status: 500 })
  }
}
