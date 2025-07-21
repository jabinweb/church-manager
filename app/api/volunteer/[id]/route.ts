import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { isActive } = await request.json()

    // Check if volunteer record belongs to user
    const existingVolunteer = await prisma.volunteer.findUnique({
      where: { id }
    })

    if (!existingVolunteer || existingVolunteer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Volunteer record not found' }, { status: 404 })
    }

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: { isActive }
    })

    return NextResponse.json({ volunteer })
  } catch (error) {
    console.error('Error updating volunteer:', error)
    return NextResponse.json({ error: 'Failed to update volunteer' }, { status: 500 })
  }
}
