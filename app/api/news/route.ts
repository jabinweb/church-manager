import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const news = await prisma.newsPost.findMany({
      where: {
        isPublished: true
      },
      orderBy: {
        publishDate: 'desc'
      }
    })

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ news: [] })
  }
}
