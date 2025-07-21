import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { categoryIds, action } = body

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Category IDs are required' }, { status: 400 })
    }

    switch (action) {
      case 'activate':
        await prisma.productCategory.updateMany({
          where: { id: { in: categoryIds } },
          data: { isActive: true }
        })
        break
      
      case 'deactivate':
        await prisma.productCategory.updateMany({
          where: { id: { in: categoryIds } },
          data: { isActive: false }
        })
        break
      
      case 'delete':
        // Check if categories have products
        const categoriesWithProducts = await prisma.productCategory.findMany({
          where: { 
            id: { in: categoryIds },
            products: { some: {} }
          },
          select: { id: true, name: true }
        })

        if (categoriesWithProducts.length > 0) {
          return NextResponse.json({ 
            error: `Cannot delete categories with products: ${categoriesWithProducts.map(c => c.name).join(', ')}` 
          }, { status: 400 })
        }

        await prisma.productCategory.deleteMany({
          where: { id: { in: categoryIds } }
        })
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
