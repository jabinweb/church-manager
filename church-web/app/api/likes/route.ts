import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { type = 'LIKE', sermonId, blogPostId, commentId } = await request.json()

    if (!sermonId && !blogPostId && !commentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 })
    }

    // Check if user already liked this content
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        ...(sermonId && { sermonId }),
        ...(blogPostId && { blogPostId }),
        ...(commentId && { commentId })
      }
    })

    if (existingLike) {
      // If same type, remove like (toggle)
      if (existingLike.type === type) {
        await prisma.like.delete({ where: { id: existingLike.id } })
        
        // Update like count
        if (sermonId) {
          await prisma.sermon.update({
            where: { id: sermonId },
            data: { likeCount: { decrement: 1 } }
          })
        }
        if (blogPostId) {
          await prisma.blogPost.update({
            where: { id: blogPostId },
            data: { likeCount: { decrement: 1 } }
          })
        }

        return NextResponse.json({ liked: false, type: null })
      } else {
        // Different type, update existing like
        const updatedLike = await prisma.like.update({
          where: { id: existingLike.id },
          data: { type }
        })
        return NextResponse.json({ liked: true, type: updatedLike.type })
      }
    } else {
      // Create new like
      const like = await prisma.like.create({
        data: {
          type,
          userId: session.user.id,
          sermonId,
          blogPostId,
          commentId
        }
      })

      // Update like count
      if (sermonId) {
        await prisma.sermon.update({
          where: { id: sermonId },
          data: { likeCount: { increment: 1 } }
        })
      }
      if (blogPostId) {
        await prisma.blogPost.update({
          where: { id: blogPostId },
          data: { likeCount: { increment: 1 } }
        })
      }

      return NextResponse.json({ liked: true, type: like.type })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
