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
    const { status } = await request.json()

    // Check if the prayer request belongs to the user
    const existingRequest = await prisma.prayerRequest.findUnique({
      where: { id }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Prayer request not found' }, { status: 404 })
    }

    if (existingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updatedRequest = await prisma.prayerRequest.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ prayerRequest: updatedRequest })
  } catch (error) {
    console.error('Error updating prayer request:', error)
    return NextResponse.json({ error: 'Failed to update prayer request' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if the prayer request belongs to the user
    const existingRequest = await prisma.prayerRequest.findUnique({
      where: { id }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Prayer request not found' }, { status: 404 })
    }

    if (existingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.prayerRequest.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting prayer request:', error)
    return NextResponse.json({ error: 'Failed to delete prayer request' }, { status: 500 })
  }
}
