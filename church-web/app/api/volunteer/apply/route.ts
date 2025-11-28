import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ministryId, position, skills, availability } = await request.json()

    if (!ministryId || !position) {
      return NextResponse.json({ error: 'Ministry and position are required' }, { status: 400 })
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
            position,
            skills: skills || [],
            availability: availability || []
          }
        })
      : await prisma.volunteer.create({
          data: {
            userId: session.user.id,
            ministryId,
            position,
            skills: skills || [],
            availability: availability || []
          }
        })

    return NextResponse.json({ volunteer })
  } catch (error) {
    console.error('Error applying to volunteer:', error)
    return NextResponse.json({ error: 'Failed to apply' }, { status: 500 })
  }
}
