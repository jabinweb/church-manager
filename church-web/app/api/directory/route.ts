import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const members = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['ADMIN', 'PASTOR', 'STAFF', 'MEMBER']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        joinDate: true,
        isActive: true,
        memberProfile: {
          select: {
            skills: true,
            interests: true,
            ministryInvolvement: true
          }
        },
        smallGroupMembers: {
          where: {
            isActive: true
          },
          select: {
            smallGroup: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching directory:', error)
    return NextResponse.json({ error: 'Failed to fetch directory' }, { status: 500 })
  }
}
