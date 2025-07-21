import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user has appropriate role
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    // Get prayer requests
    const requests = await prisma.prayerRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    // Get stats
    const stats = {
      totalRequests: await prisma.prayerRequest.count(),
      pendingRequests: await prisma.prayerRequest.count({
        where: { status: 'PENDING' }
      }),
      approvedRequests: await prisma.prayerRequest.count({
        where: { status: 'APPROVED' }
      }),
      urgentRequests: await prisma.prayerRequest.count({
        where: { isUrgent: true }
      })
    }
    
    return NextResponse.json({ 
      requests: requests || [],
      stats
    })
  } catch (error) {
    console.error("[API] Error retrieving prayer requests:", error)
    return NextResponse.json(
      { 
        error: "Failed to retrieve prayer requests",
        requests: [],
        stats: { totalRequests: 0, pendingRequests: 0, approvedRequests: 0, urgentRequests: 0 }
      }, 
      { status: 500 }
    )
  }
}
