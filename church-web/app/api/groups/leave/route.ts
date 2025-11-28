import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId } = await request.json()

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Find the membership
    const membership = await prisma.smallGroupMember.findFirst({
      where: {
        userId: session.user.id,
        smallGroupId: groupId,
        isActive: true
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 400 })
    }

    // Deactivate membership instead of deleting
    await prisma.smallGroupMember.update({
      where: {
        id: membership.id
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 })
  }
}
