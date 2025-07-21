import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings for currency
    const settings = await prisma.systemSettings.findFirst()
    const currency = settings?.currency || 'USD'
    
    // Get all active funds
    const funds = await prisma.fund.findMany({
      where: { isActive: true },
      include: {
        donations: {
          where: { status: 'COMPLETED' },
          select: { amount: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate total for each fund
    const fundsWithTotals = funds.map(fund => ({
      id: fund.id,
      name: fund.name,
      description: fund.description,
      targetAmount: fund.targetAmount ? Number(fund.targetAmount) : null,
      totalAmount: fund.donations.reduce((sum, donation) => sum + Number(donation.amount), 0),
      currency
    }))

    // Calculate stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const thisMonthDonations = await prisma.donation.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    })

    const thisYearDonations = await prisma.donation.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startOfYear }
      },
      _sum: { amount: true }
    })

    const recurringDonorsCount = await prisma.donation.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        isRecurring: true,
        userId: { not: null }
      }
    })

    const stats = {
      thisMonthTotal: Number(thisMonthDonations._sum.amount || 0),
      thisYearTotal: Number(thisYearDonations._sum.amount || 0),
      recurringDonorsCount: recurringDonorsCount.length,
      activeFundsCount: funds.length,
      currency
    }

    return NextResponse.json({ 
      funds: fundsWithTotals, 
      stats,
      currency 
    })
  } catch (error) {
    console.error('Error fetching giving data:', error)
    return NextResponse.json({ 
      funds: [], 
      stats: { 
        thisMonthTotal: 0, 
        thisYearTotal: 0, 
        recurringDonorsCount: 0, 
        activeFundsCount: 0,
        currency: 'USD'
      },
      currency: 'USD'
    }, { status: 500 })
  }
}
    