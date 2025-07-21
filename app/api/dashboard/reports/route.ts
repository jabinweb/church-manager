import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = parseInt(searchParams.get('range') || '30')
    const type = searchParams.get('type') || 'all'
    
    const userId = session.user.id
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - range)

    // Get commission data
    const commissions = await prisma.commission.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      include: {
        fromUser: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0)
    
    // Calculate commission growth
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - range)
    
    const previousCommissions = await prisma.commission.findMany({
      where: {
        userId,
        createdAt: { 
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })
    
    const previousTotal = previousCommissions.reduce((sum, c) => sum + c.amount, 0)
    const growth = previousTotal > 0 ? ((totalCommissions - previousTotal) / previousTotal) * 100 : 0

    // Commission by level
    const commissionsByLevel = commissions.reduce((acc, c) => {
      const existing = acc.find(item => item.level === c.level)
      if (existing) {
        existing.amount += c.amount
        existing.count += 1
      } else {
        acc.push({ level: c.level, amount: c.amount, count: 1 })
      }
      return acc
    }, [] as { level: number; amount: number; count: number }[])

    // Get team data
    const directReferrals = await prisma.user.findMany({
      where: { referrerId: userId },
      select: { 
        id: true, 
        joinedAt: true,
        orders: {
          where: {
            createdAt: { gte: startDate },
            status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
          }
        }
      }
    })

    // Get all team members recursively
    const getAllTeamMembers = async (id: string): Promise<string[]> => {
      const refs = await prisma.user.findMany({
        where: { referrerId: id },
        select: { id: true }
      })
      
      let allMembers = refs.map(r => r.id)
      
      for (const ref of refs) {
        const subTeam = await getAllTeamMembers(ref.id)
        allMembers = [...allMembers, ...subTeam]
      }
      
      return allMembers
    }

    const allTeamMemberIds = await getAllTeamMembers(userId)
    
    // Team metrics
    const activeMembers = directReferrals.filter(r => r.orders.length > 0).length
    const newThisMonth = directReferrals.filter(r => 
      new Date(r.joinedAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ).length

    // Sales data
    const userOrders = await prisma.order.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
      }
    })

    const teamOrders = await prisma.order.findMany({
      where: {
        userId: { in: allTeamMemberIds },
        createdAt: { gte: startDate },
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
      }
    })

    const personalVolume = userOrders.reduce((sum, o) => sum + o.total, 0)
    const teamVolume = teamOrders.reduce((sum, o) => sum + o.total, 0)

    const reportData = {
      commissions: {
        total: totalCommissions,
        thisMonth: commissions.filter(c => 
          new Date(c.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        ).reduce((sum, c) => sum + c.amount, 0),
        lastMonth: previousTotal,
        growth,
        byLevel: commissionsByLevel.sort((a, b) => a.level - b.level),
        recent: commissions.slice(0, 10)
      },
      team: {
        totalMembers: allTeamMemberIds.length,
        activeMembers,
        newThisMonth,
        byLevel: [{ level: 1, count: directReferrals.length }] // Simplified for now
      },
      sales: {
        totalVolume: personalVolume + teamVolume,
        personalVolume,
        teamVolume,
        ordersCount: userOrders.length + teamOrders.length
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
