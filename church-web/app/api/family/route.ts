import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's own family members
    const familyMembers = await prisma.familyMember.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Also include the user themselves as the primary family member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        joinDate: true,
        dateOfBirth: true,
        anniversary: true // Include anniversary
      }
    })

    const allFamilyMembers = [
      ...(user ? [{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        relationship: 'Self',
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        anniversary: user.anniversary?.toISOString() || null, // Include anniversary
        address: null,
        notes: null,
        image: user.image,
        isUser: true,
        role: user.role,
        joinDate: user.joinDate.toISOString()
      }] : []),
      ...familyMembers.map(member => ({
        ...member,
        dateOfBirth: member.dateOfBirth?.toISOString() || null,
        anniversary: member.anniversary?.toISOString() || null,
        isUser: false
      }))
    ]

    return NextResponse.json({ familyMembers: allFamilyMembers })
  } catch (error) {
    console.error('Error fetching family members:', error)
    return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, 
      email, 
      phone, 
      relationship, 
      dateOfBirth, 
      anniversary, 
      address, 
      notes,
      existingUserId // New field to link to existing user
    } = await request.json()

    if ((!name && !existingUserId) || !relationship) {
      return NextResponse.json({ error: 'Name/User and relationship are required' }, { status: 400 })
    }

    // If linking to existing user, get their info
    if (existingUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: existingUserId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          dateOfBirth: true
        }
      })

      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if this user is already a family member
      const existingFamilyMember = await prisma.familyMember.findFirst({
        where: {
          userId: session.user.id,
          OR: [
            { linkedUserId: existingUserId },
            // Only include name/email checks if they exist
            ...(existingUser.name ? [{ name: existingUser.name }] : []),
            ...(existingUser.email ? [{ email: existingUser.email }] : [])
          ].filter(condition => Object.keys(condition).length > 0)
        }
      })

      if (existingFamilyMember) {
        return NextResponse.json({ error: 'This person is already in your family' }, { status: 400 })
      }

      const familyMember = await prisma.familyMember.create({
        data: {
          userId: session.user.id,
          linkedUserId: existingUserId,
          name: existingUser.name || name?.trim() || '',
          email: existingUser.email,
          phone: existingUser.phone || phone?.trim() || null,
          relationship: relationship.trim(),
          dateOfBirth: existingUser.dateOfBirth || (dateOfBirth ? new Date(dateOfBirth) : null),
          anniversary: anniversary ? new Date(anniversary) : null,
          address: address?.trim() || null,
          notes: notes?.trim() || null,
          image: existingUser.image
        }
      })

      return NextResponse.json({ 
        familyMember: {
          ...familyMember,
          dateOfBirth: familyMember.dateOfBirth?.toISOString() || null,
          anniversary: familyMember.anniversary?.toISOString() || null,
          isUser: false,
          isLinkedUser: true
        }
      })
    } else {
      // Create new family member (not linked to existing user)
      const familyMember = await prisma.familyMember.create({
        data: {
          userId: session.user.id,
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
          ...familyMember,
          dateOfBirth: familyMember.dateOfBirth?.toISOString() || null,
          anniversary: familyMember.anniversary?.toISOString() || null,
          isUser: false,
          isLinkedUser: false
        }
      })
    }
  } catch (error) {
    console.error('Error adding family member:', error)
    return NextResponse.json({ error: 'Failed to add family member' }, { status: 500 })
  }
}
