import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const stock = searchParams.get('stock')

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category && category !== 'all') {
      where.category = {
        name: category
      }
    }

    // Get products with stock information
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Transform products to inventory items and apply stock filter
    let inventory = products.map(product => ({
      ...product,
      lowStockThreshold: 10, // Default low stock threshold
      price: Number(product.price)
    }))

    // Apply stock filter
    if (stock && stock !== 'all') {
      inventory = inventory.filter(item => {
        if (stock === 'low-stock') {
          return item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0
        } else if (stock === 'out-of-stock') {
          return item.stockQuantity === 0
        } else if (stock === 'in-stock') {
          return item.stockQuantity > item.lowStockThreshold
        }
        return true
      })
    }

    // Calculate stats
    const stats = {
      totalProducts: products.length,
      lowStockItems: products.filter(p => p.stockQuantity <= 10 && p.stockQuantity > 0).length,
      outOfStockItems: products.filter(p => p.stockQuantity === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.stockQuantity * Number(p.price)), 0),
      recentChanges: 0 // This would require a stock movement table
    }

    return NextResponse.json({
      inventory: inventory.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      })),
      stats
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
