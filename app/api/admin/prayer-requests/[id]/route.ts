import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Await params to get the id
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "Prayer request ID is required" }, { status: 400 })
    }
    
    const body = await req.json()
    const { status } = body
    
    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'ANSWERED', 'ARCHIVED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    
    // Update prayer request
    const updatedRequest = await prisma.prayerRequest.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error("[API] Error updating prayer request:", error)
    return NextResponse.json(
      { error: "Failed to update prayer request" }, 
      { status: 500 }
    )
  }
}
