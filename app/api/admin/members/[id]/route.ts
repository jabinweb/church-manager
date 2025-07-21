import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    const { id } = await params
    
    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        memberProfile: true
      }
    })
    
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }
    
    return NextResponse.json({ member })
  } catch (error) {
    console.error("[API] Error retrieving member:", error)
    return NextResponse.json({ error: "Failed to retrieve member" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    const { id } = await params
    const body = await req.json()
    const { memberProfile, ...userData } = body
    
    // Extract only valid User model fields
    const validUserFields = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      role: userData.role,
      isActive: userData.isActive,
      dateOfBirth: userData.dateOfBirth,
      updatedAt: new Date()
    }
    
    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validUserFields
    })
    
    // Update or create member profile if provided
    if (memberProfile) {
      await prisma.memberProfile.upsert({
        where: { userId: id },
        update: {
          emergencyContact: memberProfile.emergencyContact,
          emergencyPhone: memberProfile.emergencyPhone,
          baptismDate: memberProfile.baptismDate,
          membershipDate: memberProfile.membershipDate,
          skills: memberProfile.skills || [],
          interests: memberProfile.interests || [],
          ministryInvolvement: memberProfile.ministryInvolvement || [],
          updatedAt: new Date()
        },
        create: {
          userId: id,
          emergencyContact: memberProfile.emergencyContact,
          emergencyPhone: memberProfile.emergencyPhone,
          baptismDate: memberProfile.baptismDate,
          membershipDate: memberProfile.membershipDate,
          skills: memberProfile.skills || [],
          interests: memberProfile.interests || [],
          ministryInvolvement: memberProfile.ministryInvolvement || []
        }
      })
    }
    
    // Fetch the updated member with profile for response
    const memberWithProfile = await prisma.user.findUnique({
      where: { id },
      include: {
        memberProfile: true
      }
    })
    
    return NextResponse.json({ 
      member: memberWithProfile,
      message: "Member updated successfully" 
    })
  } catch (error) {
    console.error("[API] Error updating member:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (!['ADMIN', 'PASTOR', 'STAFF'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    const { id } = await params
    const body = await req.json()
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ member: updatedUser })
  } catch (error) {
    console.error("[API] Error updating member:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (!['ADMIN', 'PASTOR'].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    const { id } = await params
    
    // Don't allow deletion of admin users
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })
    
    if (user?.role === 'ADMIN') {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 400 })
    }
    
    await prisma.user.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: "Member deleted successfully" })
  } catch (error) {
    console.error("[API] Error deleting member:", error)
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 })
  }
}
