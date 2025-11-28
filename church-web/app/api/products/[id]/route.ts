import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations/product'
import { generateSlug } from '@/lib/utils'

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Try to find by slug first (if it exists and is not empty)
    let product = null
    
    if (params.id) {
      // Try slug first
      product = await prisma.product.findUnique({
        where: { slug: params.id },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
      }).catch(() => null)

      // If not found by slug, try to find by id as fallback
      if (!product) {
        product = await prisma.product.findUnique({
          where: { id: params.id },
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          },
        }).catch(() => null)
      }

      // If still not found, try to match by generated slug from name
      if (!product) {
        const allProducts = await prisma.product.findMany({
          where: { isActive: true },
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          },
        })
        
        // Generate slug from name and compare
        product = allProducts.find(p => generateSlug(p.name) === params.id) || null
      }
    }

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = productSchema.parse(body)

    const product = await prisma.product.update({
      where: { id: params.id },
      data,
      include: {
        category: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
