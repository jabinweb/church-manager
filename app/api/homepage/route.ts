import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all data concurrently for better performance
    const [recentSermons, upcomingEvents, recentPosts, stats] = await Promise.all([
      // Recent Sermons
      prisma.sermon.findMany({
        where: { isPublished: true },
        orderBy: { date: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          speaker: true,
          date: true,
          slug: true,
          views: true
        }
      }),

      // Upcoming Events
      prisma.event.findMany({
        where: {
          isPublished: true,
          startDate: { gte: new Date() }
        },
        orderBy: { startDate: 'asc' },
        take: 3,
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          imageUrl: true,
          category: true
        }
      }),

      // Recent Blog Posts
      prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishDate: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          excerpt: true,
          slug: true,
          publishDate: true,
          imageUrl: true,
          author: {
            select: { name: true }
          }
        }
      }),

      // Stats
      Promise.all([
        prisma.user.count({ where: { role: { in: ['MEMBER', 'STAFF', 'PASTOR'] } } }),
        prisma.sermon.count({ where: { isPublished: true } }),
        prisma.event.count({ where: { isPublished: true } }),
        prisma.prayerRequest.count()
      ])
    ])

    const [totalMembers, totalSermons, totalEvents, totalPrayerRequests] = stats

    return NextResponse.json({
      recentSermons,
      upcomingEvents,
      recentPosts,
      stats: {
        totalMembers,
        totalSermons,
        totalEvents,
        totalPrayerRequests
      }
    })
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return NextResponse.json({
      recentSermons: [],
      upcomingEvents: [],
      recentPosts: [],
      stats: {
        totalMembers: 0,
        totalSermons: 0,
        totalEvents: 0,
        totalPrayerRequests: 0
      }
    })
  }
}
