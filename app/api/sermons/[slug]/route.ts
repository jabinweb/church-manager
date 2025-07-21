import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug } = context.params

  try {
    // Only select fields that exist in the current schema
    const sermon = await prisma.sermon.findFirst({
      where: { slug },
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
        // Do not select category or author if not needed
      }
    })

    if (!sermon) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ sermon })
  } catch (error) {
    console.error('Error fetching sermon:', error)
    return NextResponse.json({ error: 'Failed to fetch sermon' }, { status: 500 })
  }
}
