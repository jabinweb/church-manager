import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId: string = session.user.id

    // Orders
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: { product: { select: { name: true } } }
        }
      }
    })
    const totalOrders: number = orders.length

    // Donations
    const donations = await prisma.donation.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: { fund: { select: { name: true } } }
    })
    const totalDonations: number = donations.reduce((sum: number, d: any) => sum + Number(d.amount), 0)

    // Events (registered)
    const eventRegs = await prisma.eventRegistration.findMany({
      where: { userId },
      include: { event: true }
    })
    const upcomingEvents: number = eventRegs.filter(
      (reg: any) => reg.event && reg.event.startDate > new Date()
    ).length

    // Prayer Requests
    const prayers = await prisma.prayerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    const prayerRequests: number = prayers.length

    // Recent activity
    const recentOrders = orders.slice(0, 5).map((order: any) => ({
      id: order.id,
      total: Number(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
      orderItems: order.orderItems.map((item: any) => ({
        quantity: item.quantity,
        product: { name: item.product.name }
      }))
    }))

    const recentDonations = donations.slice(0, 5).map((donation: any) => ({
      id: donation.id,
      amount: Number(donation.amount),
      fund: { name: donation.fund?.name || 'General Fund' },
      status: donation.status,
      createdAt: donation.createdAt
    }))

    const recentEvents = eventRegs
      .filter((reg: any) => reg.event)
      .sort((a: any, b: any) => (a.event.startDate > b.event.startDate ? -1 : 1))
      .slice(0, 5)
      .map((reg: any) => ({
        id: reg.event.id,
        title: reg.event.title,
        startDate: reg.event.startDate,
        location: reg.event.location,
        status: reg.event.status
      }))

    const recentPrayers = prayers.slice(0, 5).map((prayer: any) => ({
      id: prayer.id,
      request: prayer.request,
      status: prayer.status,
      createdAt: prayer.createdAt
    }))

    return NextResponse.json({
      stats: {
        totalOrders,
        totalDonations,
        upcomingEvents,
        prayerRequests,
        recentOrders,
        recentDonations,
        recentEvents,
        recentPrayers
      }
    })
  } catch (error) {
    console.error('Error fetching member dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
