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

    const { recipientId, message } = await request.json()

    if (!recipientId || !message?.trim()) {
      return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 })
    }

    // Get recipient details
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    })

    if (!recipient || !recipient.isActive) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Get sender details
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true
      }
    })

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 })
    }

    // Send email notification
    try {
      await churchEmailService.sendDirectoryMessage(
        recipient.email,
        recipient.name || 'Member',
        sender.name || 'Church Member',
        sender.email,
        message.trim()
      )
    } catch (emailError) {
      console.error('Failed to send directory message email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending directory message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
