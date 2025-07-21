import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, stockQuantity, sku, isActive, categoryId, tags, imageUrl } = body

    // Validate required fields
    if (!name || !price || !sku) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, and sku' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + '-' + Date.now()

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: Number(price),
        sku,
        slug,
        stockQuantity: Number(stockQuantity) || 0,
        isActive: Boolean(isActive),
        categoryId: categoryId && categoryId !== 'none' ? categoryId : null,
        tags: Array.isArray(tags) ? tags : [],
        imageUrl: imageUrl || null,
        authorId: session.user.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized", products: [] }, { status: 401 })
    }
    
    // Check if user has appropriate role
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions", products: [] }, { status: 403 })
    }
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    
    // Prepare filter conditions
    const where: any = {}
    
    // Filter by search term
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Filter by category
    if (category && category !== 'all') {
      where.categoryId = category
    }
    
    // Get total count for pagination
    const totalCount = await prisma.product.count({ where })
    
    // Retrieve products
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    // Ensure all products have proper structure
    const formattedProducts = products.map(product => ({
      ...product,
      price: Number(product.price) || 0,
      stockQuantity: Number(product.stockQuantity) || 0,
      tags: Array.isArray(product.tags) ? product.tags : [],
      imageUrl: product.imageUrl || null,
      category: product.category || null
    }))
    
    return NextResponse.json({ 
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount
      }
    })
  } catch (error) {
    console.error("[API] Error retrieving products:", error)
    return NextResponse.json(
      { 
        error: "Failed to retrieve products",
        products: [],
        pagination: { page: 1, limit: 20, totalPages: 0, totalItems: 0 }
      }, 
      { status: 500 }
    )
  }
}
