import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role && role !== 'all') {
      where.role = role
    }
    
    // Get members with profiles
    const members = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        memberProfile: {
          select: {
            ministryInvolvement: true
          }
        }
      }
    })
    
    // Get stats
    const stats = {
      totalMembers: await prisma.user.count(),
      thisMonthMembers: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      activeMembers: await prisma.user.count({
        where: { isActive: true }
      }),
      staffCount: await prisma.user.count({
        where: { role: { in: ['PASTOR', 'STAFF', 'ADMIN'] } }
      })
    }
    
    return NextResponse.json({ 
      members: members || [],
      stats
    })
  } catch (error) {
    console.error("[API] Error retrieving members:", error)
    return NextResponse.json(
      { 
        error: "Failed to retrieve members",
        members: [],
        stats: { totalMembers: 0, thisMonthMembers: 0, activeMembers: 0, staffCount: 0 }
      }, 
      { status: 500 }
    )
  }
}
