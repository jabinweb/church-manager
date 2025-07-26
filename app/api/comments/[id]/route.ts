import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user owns the comment or is admin
    if (comment.authorId !== session.user.id && !['ADMIN', 'PASTOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { likes: true, replies: true }
        }
      }
    })

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user owns the comment or is admin
    if (comment.authorId !== session.user.id && !['ADMIN', 'PASTOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    await prisma.comment.delete({ where: { id } })

    // Update comment count on parent content
    if (comment.sermonId) {
      await prisma.sermon.update({
        where: { id: comment.sermonId },
        data: { commentCount: { decrement: 1 } }
      })
    }

    if (comment.blogPostId) {
      await prisma.blogPost.update({
        where: { id: comment.blogPostId },
        data: { commentCount: { decrement: 1 } }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
