import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations/product'
import { NextRequest, NextResponse } from "next/server";



export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          gt: 0
        }
      },
      orderBy: {
        createdAt: 'desc'
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

    // Format products for frontend consumption
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
      success: true 
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ 
      products: [],
      success: false,
      error: 'Failed to fetch products' 
    })
  }
}