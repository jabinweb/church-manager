import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET handler for retrieving a specific blog post
export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    // Verify authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user has appropriate role
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    // Access postId from params safely
    if (!params?.postId) {
      return NextResponse.json({ error: "Blog post ID is required" }, { status: 400 })
    }
    
    // Retrieve the blog post
    const post = await prisma.blogPost.findUnique({
      where: { id: params.postId },
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
    
    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }
    
    return NextResponse.json({ post })
  } catch (error) {
    console.error("[API] Error retrieving blog post:", error)
    return NextResponse.json(
      { error: "Failed to retrieve blog post" }, 
      { status: 500 }
    )
  }
}

// PUT handler for updating a blog post
export async function PUT(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    // Verify authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user has appropriate role
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    // Safely access postId
    if (!params?.postId) {
      return NextResponse.json({ error: "Blog post ID is required" }, { status: 400 })
    }
    
    const body = await req.json()
    
    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: params.postId },
      select: { id: true, slug: true, authorId: true }
    })
    
    if (!existingPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }
    
    // Check slug uniqueness if changed
    if (body.slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug: body.slug }
      })
      
      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already in use. Please choose another one." }, 
          { status: 400 }
        )
      }
    }
    
    // Only allow author or admin to update
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user?.role === 'ADMIN'
    
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this post" }, 
        { status: 403 }
      )
    }
    
    // Prepare update data
    const updateData = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || null,
      isPublished: body.isPublished,
      publishDate: body.publishDate ? new Date(body.publishDate) : null,
      imageUrl: body.imageUrl,
      tags: body.tags || [],
      categoryId: body.categoryId && body.categoryId !== "none" ? body.categoryId : null,
      updatedAt: new Date()
    }
    
    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id: params.postId },
      data: updateData,
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
    
    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error("[API] Error updating blog post:", error)
    return NextResponse.json(
      { error: "Failed to update blog post" }, 
      { status: 500 }
    )
  }
}

// DELETE handler for deleting a blog post
export async function DELETE(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    // Verify authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Safely access postId
    if (!params?.postId) {
      return NextResponse.json({ error: "Blog post ID is required" }, { status: 400 })
    }
    
    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: params.postId },
      select: { id: true, authorId: true }
    })
    
    if (!existingPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }
    
    // Only allow author or admin to delete
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user?.role === 'ADMIN'
    
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this post" }, 
        { status: 403 }
      )
    }
    
    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id: params.postId }
    })
    
    return NextResponse.json({ success: true, message: "Blog post deleted successfully" })
  } catch (error) {
    console.error("[API] Error deleting blog post:", error)
    return NextResponse.json(
      { error: "Failed to delete blog post" }, 
      { status: 500 }
    )
  }
}

