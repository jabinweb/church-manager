import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { churchEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { name, request: prayerText, isAnonymous, isUrgent } = await request.json()

    if (!prayerText?.trim()) {
      return NextResponse.json({ error: 'Prayer request text is required' }, { status: 400 })
    }

    const prayerRequest = await prisma.prayerRequest.create({
      data: {
        name: name || 'Anonymous',
        request: prayerText.trim(),
        isAnonymous: !!isAnonymous,
        isUrgent: !!isUrgent,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        status: 'PENDING'
      }
    })

    // Send acknowledgment email if user is logged in
    if (session?.user?.email && session?.user?.name) {
      try {
        await churchEmailService.sendPrayerRequestAcknowledgment(
          session.user.email,
          session.user.name,
          prayerRequest
        )
      } catch (emailError) {
        console.error('Failed to send prayer request acknowledgment:', emailError)
        // Continue even if email fails
      }
    }

    return NextResponse.json({ prayerRequest })
  } catch (error) {
    console.error('Error creating prayer request:', error)
    return NextResponse.json({ error: 'Failed to create prayer request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const requests = await prisma.prayerRequest.findMany({
      where: {
        status: {
          in: ['APPROVED', 'ANSWERED']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching prayer requests:', error)
    return NextResponse.json({ error: 'Failed to fetch prayer requests' }, { status: 500 })
  }
}
