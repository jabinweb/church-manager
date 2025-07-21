import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ministryId, position = 'Volunteer' } = await request.json()

    if (!ministryId) {
      return NextResponse.json({ error: 'Ministry ID is required' }, { status: 400 })
    }

    // Check if ministry exists
    const ministry = await prisma.ministry.findUnique({
      where: { id: ministryId }
    })

    if (!ministry || !ministry.isActive) {
      return NextResponse.json({ error: 'Ministry not found or inactive' }, { status: 404 })
    }

    // Check if already volunteering
    const existingVolunteer = await prisma.volunteer.findFirst({
      where: {
        userId: session.user.id,
        ministryId
      }
    })

    if (existingVolunteer && existingVolunteer.isActive) {
      return NextResponse.json({ error: 'Already volunteering for this ministry' }, { status: 400 })
    }

    // Create or reactivate volunteer record
    const volunteer = existingVolunteer
      ? await prisma.volunteer.update({
          where: { id: existingVolunteer.id },
          data: { 
            isActive: true,
            position
          }
        })
      : await prisma.volunteer.create({
          data: {
            userId: session.user.id,
            ministryId,
            position,
            skills: [],
            availability: []
          }
        })

    return NextResponse.json({ volunteer })
  } catch (error) {
    console.error('Error joining ministry:', error)
    return NextResponse.json({ error: 'Failed to join ministry' }, { status: 500 })
  }
}
