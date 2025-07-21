import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ministry = await prisma.ministry.findUnique({
      where: { id },
      include: {
        volunteers: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { volunteers: true }
        }
      }
    })

    if (!ministry) {
      return NextResponse.json({ error: 'Ministry not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      ministry: {
        ...ministry,
        createdAt: ministry.createdAt.toISOString(),
        updatedAt: ministry.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching ministry:', error)
    return NextResponse.json({ error: 'Failed to fetch ministry' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, leader, meetingTime, location, imageUrl, isActive } = body

    const ministry = await prisma.ministry.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(leader !== undefined && { leader: leader?.trim() || null }),
        ...(meetingTime !== undefined && { meetingTime: meetingTime?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
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
    console.error('Error updating ministry:', error)
    return NextResponse.json({ error: 'Failed to update ministry' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if ministry has volunteers
    const ministry = await prisma.ministry.findUnique({
      where: { id },
      include: {
        _count: {
          select: { volunteers: true }
        }
      }
    })

    if (!ministry) {
      return NextResponse.json({ error: 'Ministry not found' }, { status: 404 })
    }

    if (ministry._count.volunteers > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete ministry with active volunteers. Please reassign volunteers first.' 
      }, { status: 400 })
    }

    await prisma.ministry.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ministry:', error)
    return NextResponse.json({ error: 'Failed to delete ministry' }, { status: 500 })
  }
}
