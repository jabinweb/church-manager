import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const volunteering = await prisma.volunteer.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        ministry: {
          select: {
            id: true,
            name: true,
            description: true,
            leader: true,
            meetingTime: true,
            location: true
          }
        }
      },
      orderBy: {
        isActive: 'desc'
      }
    })

    return NextResponse.json({ volunteering })
  } catch (error) {
    console.error('Error fetching volunteering:', error)
    return NextResponse.json({ error: 'Failed to fetch volunteering' }, { status: 500 })
  }
}
