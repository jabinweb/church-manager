import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch recent sermons with all required fields
    const recentSermons = await prisma.sermon.findMany({
      where: { isPublished: true },
      orderBy: { date: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        speaker: true,
        series: true,
        date: true,
        duration: true,
        views: true,
        isPublished: true,
        audioUrl: true,
        videoUrl: true,
        scriptureReference: true,
        tags: true,
        // Add imageUrl if it exists in your schema, otherwise we'll use default
      }
    })

    // Fetch upcoming events
    const upcomingEvents = await prisma.event.findMany({
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
        category: true,
        imageUrl: true,
      }
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

    // Get stats
    const stats = {
      totalMembers: await prisma.user.count({ where: { role: 'MEMBER', isActive: true } }),
      totalSermons: await prisma.sermon.count({ where: { isPublished: true } }),
      totalEvents: await prisma.event.count({ where: { isPublished: true } }),
      totalPrayerRequests: await prisma.prayerRequest.count()
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
      stats
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
    }, { status: 500 })
  }
}
