import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { categorySchema } from '@/lib/validations/product'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const categories = await prisma.productCategory.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : undefined,
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, imageUrl, isActive } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl || null,
        isActive: isActive ?? true
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}