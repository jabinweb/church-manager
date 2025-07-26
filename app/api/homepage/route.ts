import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch recent sermons with all required fields
    const recentSermons = await prisma.sermon.findMany({
      where: { isPublished: true },
      orderBy: { date: 'desc' },
      take: 3,
      include: {
        author: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        }
      }
    })

    // Fetch upcoming events
    const upcomingEvents = await prisma.event.findMany({
      where: { 
        isPublished: true,
        startDate: { gte: new Date() }
      },
      orderBy: { startDate: 'asc' },
      take: 3
    })

    // Fetch recent blog posts
    const recentPosts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishDate: 'desc' },
      take: 3,
      include: {
        author: {
          select: { name: true }
        }
      }
    })

    // Fetch active ministries
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      take: 6
    })

    // Calculate stats
    const [totalMembers, totalSermons, totalEvents, totalPrayerRequests] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.sermon.count({ where: { isPublished: true } }),
      prisma.event.count({ where: { isPublished: true } }),
      prisma.prayerRequest.count()
    ])

    const stats = {
      totalMembers,
      totalSermons,
      totalEvents,
      totalPrayerRequests
    }

    return NextResponse.json({
      recentSermons: recentSermons.map(sermon => ({
        ...sermon,
        date: sermon.date.toISOString(),
        // Add placeholder image if not available
        imageUrl: null // Will use default in component
      })),
      upcomingEvents: upcomingEvents.map(event => ({
        ...event,
        startDate: event.startDate.toISOString()
      })),
      recentPosts: recentPosts.map(post => ({
        ...post,
        publishDate: post.publishDate?.toISOString() || post.createdAt.toISOString()
      })),
      ministries,
      stats
    })
  } catch (error) {
    console.error('Homepage API error:', error)
    return NextResponse.json({ 
      recentSermons: [],
      upcomingEvents: [],
      recentPosts: [],
      ministries: [],
      stats: {
        totalMembers: 0,
        totalSermons: 0,
        totalEvents: 0,
        totalPrayerRequests: 0
      }
    }, { status: 500 })
  }
}
