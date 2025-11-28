import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        isPublished: true
      },
      orderBy: {
        publishDate: 'desc'
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        isPublished: true,
        publishDate: true,
        imageUrl: true,
        tags: true,
        views: true,
        createdAt: true,
        updatedAt: true,
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

    // Ensure all posts have proper structure
    const formattedPosts = posts.map(post => ({
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : [],
      author: post.author || { name: null, email: '', image: null },
      category: post.category || null
    }))

    return NextResponse.json({ 
      posts: formattedPosts,
      success: true 
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ 
      posts: [],
      success: false,
      error: 'Failed to fetch blog posts' 
    })
  }
}

