import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Only ADMIN, PASTOR, and STAFF can create groups
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized - Only church staff can create groups' }, { status: 401 })
    }

    const { name, description, meetingDay, meetingTime, location, capacity } = await request.json()

    if (!name?.trim() || !meetingDay || !meetingTime) {
      return NextResponse.json({ error: 'Name, meeting day, and meeting time are required' }, { status: 400 })
    }

    // Check if group name already exists
    const existingGroup = await prisma.smallGroup.findFirst({
      where: {
        name: name.trim(),
        isActive: true
      }
    })

    if (existingGroup) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 })
    }

    const group = await prisma.smallGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        leaderId: session.user.id, // Creator becomes the leader by default
        meetingDay,
        meetingTime,
        location: location?.trim() || null,
        capacity: capacity ? parseInt(capacity) : null,
        isActive: true
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            members: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
