import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { churchEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, attendees = 1 } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Check if event exists and is available for registration
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.requiresRegistration) {
      return NextResponse.json({ error: 'This event does not require registration' }, { status: 400 })
    }

    if (new Date(event.startDate) < new Date()) {
      return NextResponse.json({ error: 'Cannot register for past events' }, { status: 400 })
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 400 })
    }

    // Check capacity
    if (event.capacity) {
      const totalRegistered = event.registrations.reduce((sum, reg) => sum + reg.attendees, 0)
      if (totalRegistered + attendees > event.capacity) {
        return NextResponse.json({ error: 'Event is at capacity' }, { status: 400 })
      }
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId: session.user.id,
        attendees
      }
    })

    // Send confirmation email
    if (session.user.email && session.user.name) {
      try {
        await churchEmailService.sendEventRegistrationConfirmation(
          session.user.email,
          session.user.name,
          event
        )
      } catch (emailError) {
        console.error('Failed to send registration confirmation:', emailError)
        // Continue even if email fails
      }
    }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 })
  }
}
