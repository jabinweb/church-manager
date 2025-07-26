import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Add a debug log to check if prisma is properly imported
console.log('Prisma client loaded:', !!prisma)

export async function GET(request: NextRequest) {
  try {
    // Add debug logging
    console.log('GET /api/comments - Prisma available:', !!prisma)
    
    if (!prisma) {
      console.error('Prisma client is not available')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const sermonId = searchParams.get('sermonId')
    const blogPostId = searchParams.get('blogPostId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'newest' // newest, oldest, popular

    if (!sermonId && !blogPostId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 })
    }

    const where = {
      parentId: null, // Only top-level comments
      isApproved: true,
      ...(sermonId && { sermonId }),
      ...(blogPostId && { blogPostId })
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' }
    if (sortBy === 'popular') orderBy = [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]

    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, image: true }
          },
          replies: {
            where: { isApproved: true },
            orderBy: { createdAt: 'asc' },
            take: 3, // Show first 3 replies
            include: {
              author: {
                select: { id: true, name: true, image: true }
              },
              likes: {
                select: { id: true, type: true, userId: true }
              },
              _count: {
                select: { likes: true }
              }
            }
          },
          likes: {
            select: { id: true, type: true, userId: true }
          },
          _count: {
            select: { 
              likes: true,
              replies: { where: { isApproved: true } }
            }
          }
        }
      }),
      prisma.comment.count({ where })
    ])

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Add debug logging
    console.log('POST /api/comments - Prisma available:', !!prisma)
    
    if (!prisma) {
      console.error('Prisma client is not available')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { content, sermonId, blogPostId, parentId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    if (!sermonId && !blogPostId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 })
    }

    // Check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      })
      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        sermonId,
        blogPostId,
        parentId,
        isApproved: true // Auto-approve for now, can add moderation later
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

    // Update comment count on parent content
    if (sermonId) {
      await prisma.sermon.update({
        where: { id: sermonId },
        data: { commentCount: { increment: 1 } }
      })
    }

    if (blogPostId) {
      await prisma.blogPost.update({
        where: { id: blogPostId },
        data: { commentCount: { increment: 1 } }
      })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
