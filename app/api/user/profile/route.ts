import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        role: true,
        isActive: true,
        joinDate: true,
        anniversary: true,
        dateOfBirth: true,
        memberProfile: {
          select: {
            emergencyContact: true,
            emergencyPhone: true,
            skills: true,
            interests: true,
            ministryInvolvement: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { memberProfile, ...userData } = body

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        updatedAt: new Date()
      }
    })

    // Update member profile if provided
    if (memberProfile) {
      await prisma.memberProfile.upsert({
        where: { userId: session.user.id },
        update: {
          emergencyContact: memberProfile.emergencyContact,
          emergencyPhone: memberProfile.emergencyPhone,
          skills: memberProfile.skills || [],
          interests: memberProfile.interests || [],
          ministryInvolvement: memberProfile.ministryInvolvement || [],
          updatedAt: new Date()
        },
        create: {
          userId: session.user.id,
          emergencyContact: memberProfile.emergencyContact,
          emergencyPhone: memberProfile.emergencyPhone,
          skills: memberProfile.skills || [],
          interests: memberProfile.interests || [],
          ministryInvolvement: memberProfile.ministryInvolvement || []
        }
      })
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }
}
