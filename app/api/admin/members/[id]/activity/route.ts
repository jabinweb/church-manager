import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    const { id } = await params
    
    // Fetch member activity data
    const [donations, eventRegistrations, prayerRequests] = await Promise.all([
      prisma.donation.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          fund: {
            select: { name: true }
          }
        }
      }),
      
      prisma.eventRegistration.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          event: {
            select: { title: true, startDate: true }
          }
        }
      }),
      
      prisma.prayerRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          request: true,
          status: true,
          createdAt: true
        }
      })
    ])
    
    return NextResponse.json({
      donations: donations.map(d => ({
        ...d,
        amount: Number(d.amount),
        date: d.createdAt.toISOString()
      })),
      eventRegistrations,
      prayerRequests
    })
  } catch (error) {
    console.error("[API] Error retrieving member activity:", error)
    return NextResponse.json(
      { 
        donations: [],
        eventRegistrations: [],
        prayerRequests: []
      }, 
      { status: 500 }
    )
  }
}
