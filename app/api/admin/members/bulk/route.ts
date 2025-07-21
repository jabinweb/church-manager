import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user has appropriate role
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    const body = await req.json()
    const { memberIds, action, newRole } = body
    
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Member IDs are required" }, { status: 400 })
    }
    
    switch (action) {
      case 'activate':
        await prisma.user.updateMany({
          where: { id: { in: memberIds } },
          data: { isActive: true }
        })
        break
        
      case 'deactivate':
        await prisma.user.updateMany({
          where: { id: { in: memberIds } },
          data: { isActive: false }
        })
        break
        
      case 'role-change':
        if (!newRole || !['ADMIN', 'PASTOR', 'STAFF', 'MEMBER', 'CUSTOMER'].includes(newRole)) {
          return NextResponse.json({ error: "Valid role is required" }, { status: 400 })
        }
        await prisma.user.updateMany({
          where: { id: { in: memberIds } },
          data: { role: newRole }
        })
        break
        
      case 'delete':
        // Only allow deletion of non-admin users for safety
        await prisma.user.deleteMany({
          where: { 
            id: { in: memberIds },
            role: { not: 'ADMIN' }
          }
        })
        break
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully ${action}d ${memberIds.length} members`
    })
  } catch (error) {
    console.error("[API] Error in bulk member operation:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk operation" }, 
      { status: 500 }
    )
  }
}
