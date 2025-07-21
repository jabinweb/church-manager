import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createRazorpayInstance, getRazorpayKeyId } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to place orders' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { items, total, shippingAddress, shippingAddressId } = data

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      )
    }

    // Validate stock availability for all items
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stockQuantity: true, name: true, isActive: true }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        )
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Product is no longer available: ${product.name}` },
          { status: 400 }
        )
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}` },
          { status: 400 }
        )
      }
    }

    const razorpay = createRazorpayInstance()
    const razorpayKeyId = getRazorpayKeyId()

    console.log('Creating Razorpay order for amount:', total)

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: session.user.id,
        itemCount: items.length,
        environment: process.env.RAZORPAY_ENV || 'test'
      }
    })

    console.log('Razorpay order created:', razorpayOrder.id)

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Format shipping address as string
      const formattedShippingAddress = typeof shippingAddress === 'object' 
        ? `${shippingAddress.firstName} ${shippingAddress.lastName}\n${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}\nPhone: ${shippingAddress.phone}`
        : shippingAddress

      // Create order
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          customerName: session.user.name || 'Unknown',
          customerEmail: session.user.email || '',
          addressId: shippingAddressId || null,
          shippingAddress: formattedShippingAddress,
          totalAmount: total,
          status: 'PENDING',
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          address: true
        }
      })

      // Reserve stock (reduce stock for pending orders)
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        })
      }

      return order
    })

    return NextResponse.json({ 
      id: result.id,
      total: Number(result.totalAmount),
      status: result.status,
      createdAt: result.createdAt,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: razorpayKeyId,
      isProduction: process.env.RAZORPAY_ENV === 'production'
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}