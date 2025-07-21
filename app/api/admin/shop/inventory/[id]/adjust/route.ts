import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, quantity, reason, notes } = body

    if (!type || !quantity || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Calculate new stock quantity
    let newQuantity = product.stockQuantity
    
    if (type === 'IN') {
      newQuantity += quantity
    } else if (type === 'OUT') {
      newQuantity -= quantity
      if (newQuantity < 0) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
      }
    } else if (type === 'ADJUSTMENT') {
      newQuantity = quantity // Direct set for adjustments
    }

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
        updatedAt: new Date()
      }
    })

    // Create stock movement record (if you have a StockMovement model)
    // This would require adding a StockMovement model to your schema
    /*
    await prisma.stockMovement.create({
      data: {
        productId: id,
        type,
        quantity,
        reason,
        notes,
        previousStock: product.stockQuantity,
        newStock: newQuantity,
        createdById: session.user.id
      }
    })
    */

    return NextResponse.json({
      success: true,
      product: {
        ...updatedProduct,
        createdAt: updatedProduct.createdAt.toISOString(),
        updatedAt: updatedProduct.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 })
  }
}
