import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get groups where user is the leader
    const managedGroups = await prisma.smallGroup.findMany({
      where: {
        leaderId: session.user.id,
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
        members: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            }
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
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Separately fetch join requests for these groups
    const groupIds = managedGroups.map(group => group.id)
    const joinRequests = await prisma.groupJoinRequest.findMany({
      where: {
        groupId: { in: groupIds },
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      }
    })

    // Add join requests to each group
    const groupsWithRequests = managedGroups.map(group => ({
      ...group,
      joinRequests: joinRequests.filter(request => request.groupId === group.id)
    }))

    return NextResponse.json({ groups: groupsWithRequests })
  } catch (error) {
    console.error('Error fetching managed groups:', error)
    return NextResponse.json({ error: 'Failed to fetch managed groups' }, { status: 500 })
  }
}
