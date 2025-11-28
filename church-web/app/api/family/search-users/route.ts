import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Get current user's family members to exclude them
    const existingFamilyMembers = await prisma.familyMember.findMany({
      where: { userId: session.user.id },
      select: { linkedUserId: true, email: true, name: true }
    })

    const excludeUserIds = [
      session.user.id, // Exclude current user
      ...existingFamilyMembers
        .map(fm => fm.linkedUserId)
        .filter(Boolean) as string[]
    ]

    const excludeEmails = existingFamilyMembers
      .map(fm => fm.email)
      .filter(Boolean) as string[]

    const excludeNames = existingFamilyMembers
      .map(fm => fm.name)
      .filter(Boolean) as string[]

    // Search for users by name or email
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: excludeUserIds
            }
          },
          {
            email: {
              notIn: excludeEmails
            }
          },
          {
            name: {
              notIn: excludeNames
            }
          },
          {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          },
          {
            isActive: true
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        dateOfBirth: true
      },
      take: 10,
      orderBy: [
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ 
      users: users.map(user => ({
        ...user,
        dateOfBirth: user.dateOfBirth?.toISOString() || null
      }))
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
