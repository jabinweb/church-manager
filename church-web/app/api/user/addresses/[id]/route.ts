import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id,
        userId: session.user.id 
      }
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // If setting as default, remove default from other addresses
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: session.user.id,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      address: updatedAddress,
      message: 'Address updated successfully' 
    })
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id,
        userId: session.user.id 
      }
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    await prisma.address.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Address deleted successfully' })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
    