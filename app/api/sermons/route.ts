import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sermons = await prisma.sermon.findMany({
      where: {
        isPublished: true
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        speaker: true,
        series: true,
        date: true,
        duration: true,
        audioUrl: true,
        videoUrl: true,
        scriptureReference: true,
        tags: true,
        isPublished: true,
        views: true,
        createdAt: true,
        updatedAt: true
        // category and author are relations, only include if you need them
      }
    })

    return NextResponse.json({ sermons })
  } catch (error) {
    console.error('Error fetching sermons:', error)
    return NextResponse.json({ sermons: [] })
  }
}
