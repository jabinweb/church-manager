import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, email, phone, relationship, dateOfBirth, anniversary, address, notes } = await request.json()

    if (!name || !relationship) {
      return NextResponse.json({ error: 'Name and relationship are required' }, { status: 400 })
    }

    // Check if family member belongs to the user
    const existingMember = await prisma.familyMember.findUnique({
      where: { id }
    })

    if (!existingMember || existingMember.userId !== session.user.id) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    const updatedMember = await prisma.familyMember.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        relationship: relationship.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        anniversary: anniversary ? new Date(anniversary) : null,
        address: address?.trim() || null,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json({ 
      familyMember: {
        ...updatedMember,
        dateOfBirth: updatedMember.dateOfBirth?.toISOString() || null,
        anniversary: updatedMember.anniversary?.toISOString() || null,
        isUser: false
      }
    })
  } catch (error) {
    console.error('Error updating family member:', error)
    return NextResponse.json({ error: 'Failed to update family member' }, { status: 500 })
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

    // Check if family member belongs to the user
    const existingMember = await prisma.familyMember.findUnique({
      where: { id }
    })

    if (!existingMember || existingMember.userId !== session.user.id) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    await prisma.familyMember.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Family member deleted successfully' })
  } catch (error) {
    console.error('Error deleting family member:', error)
    return NextResponse.json({ error: 'Failed to delete family member' }, { status: 500 })
  }
}
