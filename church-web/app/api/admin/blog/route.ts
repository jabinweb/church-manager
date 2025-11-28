import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST handler for creating a new blog post
export async function POST(req: Request) {
  try {
    // Verify authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user has appropriate role to create posts
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    // Get request body
    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, and content" }, 
        { status: 400 }
      )
    }

    // Check if slug is already in use
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: body.slug }
    })

    if (existingPost) {
      return NextResponse.json(
        { error: "Slug already in use. Please choose another one." }, 
        { status: 400 }
      )
    }

    // Prepare data for creating blog post
    const data = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || null,
      authorId: session.user.id,
      isPublished: body.isPublished || false,
      publishDate: body.publishDate ? new Date(body.publishDate) : null,
      imageUrl: body.imageUrl || null,
      tags: body.tags || [],
      categoryId: body.categoryId && body.categoryId !== "none" ? body.categoryId : null,
    }

    // Create blog post
    const post = await prisma.blogPost.create({
      data
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating blog post:", error)
    return NextResponse.json(
      { error: "Failed to create blog post" }, 
      { status: 500 }
    )
  }
}

// GET handler for retrieving all blog posts (for admin)
export async function GET(req: NextRequest) {
  try {
    // Verify authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        posts: [], 
        pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 } 
      }, { status: 401 })
    }
    
    // Check if user has appropriate role
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ 
        error: "Insufficient permissions", 
        posts: [], 
        pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 } 
      }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'all', 'published', 'draft'
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const mode = searchParams.get('mode') || 'list' // 'list' or 'stats'
    
    // Prepare filter conditions
    const where: any = {}
    
    // Filter by publication status
    if (status === 'published') {
      where.isPublished = true
    } else if (status === 'draft') {
      where.isPublished = false
    }
    
    // Filter by search term
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Filter by category
    if (category && category !== 'all') {
      where.categoryId = category
    }
    
    // If stats mode is requested, return blog stats
    if (mode === 'stats') {
      // Get stats
      const totalPosts = await prisma.blogPost.count()
      const publishedPosts = await prisma.blogPost.count({ where: { isPublished: true } })
      const totalViews = await prisma.blogPost.aggregate({
        _sum: { views: true }
      })
      const thisMonthPosts = await prisma.blogPost.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })

      const blogPosts = await prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const stats = {
        totalPosts,
        publishedPosts,
        totalViews: totalViews._sum.views || 0,
        thisMonthPosts
      }

      return NextResponse.json({ 
        blogPosts: Array.isArray(blogPosts) ? blogPosts : [], 
        stats 
      })
    }
    
    // Regular list mode
    // Get total count for pagination
    const totalCount = await prisma.blogPost.count({ where })
    
    // Retrieve posts
    const posts = await prisma.blogPost.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      posts: Array.isArray(posts) ? posts : [], 
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount
      } 
    })
  } catch (error) {
    console.error("[API] Error retrieving blog posts:", error)
    return NextResponse.json(
      { 
        error: "Failed to retrieve blog posts", 
        posts: [], 
        pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 } 
      }, 
      { status: 500 }
    )
  }
}
