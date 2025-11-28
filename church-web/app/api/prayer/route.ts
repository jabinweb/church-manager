import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Define the schema for prayer request validation
const prayerRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().nullable(),
  request: z.string().min(5).max(1000),
  isUrgent: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  agreeToTerms: z.boolean().refine(val => val === true)
})

export async function POST(req: Request) {
  try {
    // Get current session
    const session = await auth()
    
    // Get the system settings to check if prayer requests are enabled
    const settings = await prisma.systemSettings.findFirst()
    
    if (!settings?.enablePrayerRequests) {
      return NextResponse.json(
        { error: 'Prayer request submissions are currently disabled' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    
    // Validate input
    const result = prayerRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid prayer request data', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, request, isUrgent, isAnonymous } = result.data

    // Save prayer request to database
    const prayerRequest = await prisma.prayerRequest.create({
      data: {
        name,
        email: email || null,
        request,
        isUrgent,
        isAnonymous,
        userId: session?.user?.id || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json(
      { success: true, message: 'Prayer request submitted successfully', id: prayerRequest.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting prayer request:', error)
    return NextResponse.json(
      { error: 'Failed to submit prayer request' },
      { status: 500 }
    )
  }
}

// GET handler to fetch recent approved prayer requests (for display on the prayer page)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '3')
    
    const prayerRequests = await prisma.prayerRequest.findMany({
      where: {
        status: 'APPROVED',
        isAnonymous: false // Only show non-anonymous prayers publicly
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        request: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ prayerRequests })
  } catch (error) {
    console.error('Error fetching prayer requests:', error)
    return NextResponse.json({ prayerRequests: [] })
  }
}
