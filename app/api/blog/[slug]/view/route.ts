import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug } = context.params

  try {
    const updatedPost = await prisma.blogPost.update({
      where: { slug },
      data: {
        views: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 })
  }
}
