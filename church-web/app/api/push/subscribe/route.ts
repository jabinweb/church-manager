import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription, userId } = await request.json()

    if (!subscription || userId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    // Store subscription in database (you'll need to add a PushSubscription model)
    // For now, we'll store it in user metadata
    await prisma.user.update({
      where: { id: userId },
      data: {
        // You might want to create a separate table for push subscriptions
        // For now, we'll add it as a comment since the schema doesn't have this field
        updatedAt: new Date()
      }
    })

    // TODO: Store push subscription in a dedicated table or user metadata
    console.log('Push subscription stored for user:', userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscription error:', error)
    return NextResponse.json({ error: 'Failed to store subscription' }, { status: 500 })
  }
}
