import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId, message } = await request.json()

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Check if group exists and is active
    const group = await prisma.smallGroup.findFirst({
      where: {
        id: groupId,
        isActive: true
      },
      include: {
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

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if group is full
    if (group.capacity && group._count.members >= group.capacity) {
      return NextResponse.json({ error: 'Group is full' }, { status: 400 })
    }

    // Check if user is already a member
    const existingMember = await prisma.smallGroupMember.findFirst({
      where: {
        userId: session.user.id,
        smallGroupId: groupId,
        isActive: true
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.groupJoinRequest.findFirst({
      where: {
        userId: session.user.id,
        groupId: groupId,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: 'Join request already pending' }, { status: 400 })
    }

    // Create join request
    const joinRequest = await prisma.groupJoinRequest.create({
      data: {
        userId: session.user.id,
        groupId: groupId,
        message: message || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ request: joinRequest })
  } catch (error) {
    console.error('Error creating join request:', error)
    return NextResponse.json({ error: 'Failed to send join request' }, { status: 500 })
  }
}
