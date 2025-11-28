import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's donations
    const donations = await prisma.donation.findMany({
      where: { userId: session.user.id },
      include: {
        fund: {
          select: {
            name: true,
            description: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate statistics
    const totalGiven = donations.reduce((sum, donation) => sum + Number(donation.amount), 0)
    const donationsCount = donations.length
    const averageDonation = donationsCount > 0 ? totalGiven / donationsCount : 0
    const largestDonation = donations.length > 0 ? Math.max(...donations.map(d => Number(d.amount))) : 0

    // Current year total
    const currentYear = new Date().getFullYear()
    const currentYearDonations = donations.filter(d => new Date(d.createdAt).getFullYear() === currentYear)
    const currentYearTotal = currentYearDonations.reduce((sum, donation) => sum + Number(donation.amount), 0)

    // Last year total
    const lastYear = currentYear - 1
    const lastYearDonations = donations.filter(d => new Date(d.createdAt).getFullYear() === lastYear)
    const lastYearTotal = lastYearDonations.reduce((sum, donation) => sum + Number(donation.amount), 0)

    // Monthly average (based on months with donations)
    const monthsWithDonations = new Set(donations.map(d => `${new Date(d.createdAt).getFullYear()}-${new Date(d.createdAt).getMonth()}`))
    const monthlyAverage = monthsWithDonations.size > 0 ? totalGiven / monthsWithDonations.size : 0

    // Favorite fund (most donated to)
    const fundTotals = donations.reduce((acc, donation) => {
      acc[donation.fund.name] = (acc[donation.fund.name] || 0) + Number(donation.amount)
      return acc
    }, {} as Record<string, number>)
    const favoritesFund = Object.keys(fundTotals).reduce((a, b) => fundTotals[a] > fundTotals[b] ? a : b, '')

    const stats = {
      totalGiven,
      donationsCount,
      averageDonation,
      largestDonation,
      currentYearTotal,
      lastYearTotal,
      monthlyAverage,
      favoritesFund
    }

    // Format donations for response
    const formattedDonations = donations.map(donation => ({
      id: donation.id,
      amount: Number(donation.amount),
      fundId: donation.fundId,
      fund: donation.fund,
      paymentMethod: donation.paymentMethod,
      status: donation.status,
      isRecurring: donation.isRecurring,
      recurringFrequency: donation.recurringFrequency,
      transactionId: donation.transactionId,
      notes: donation.notes,
      createdAt: donation.createdAt.toISOString()
    }))

    return NextResponse.json({
      donations: formattedDonations,
      stats
    })
  } catch (error) {
    console.error('Error fetching giving data:', error)
    return NextResponse.json({ error: 'Failed to fetch giving data' }, { status: 500 })
  }
}
