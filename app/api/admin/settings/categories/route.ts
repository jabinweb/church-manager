import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.productCategory.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    const mapped = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.imageUrl || null,
      isActive: cat.isActive,
      productCount: cat._count.products
    }))

    return NextResponse.json({ categories: mapped })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, imageUrl, isActive } = await request.json()

    const category = await prisma.category.create({
      data: { name, description, imageUrl, isActive }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
      