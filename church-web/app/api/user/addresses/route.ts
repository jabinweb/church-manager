import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      company,
      address1,
      address2,
      city,
      state,
      zipCode,
      country = 'India',
      phone,
      isDefault,
      type = 'HOME'
    } = body

    // Validate required fields
    if (!firstName || !lastName || !address1 || !city || !state || !zipCode) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName, address1, city, state, zipCode' 
      }, { status: 400 })
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: session.user.id,
          isDefault: true 
        },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        firstName,
        lastName,
        company,
        address1,
        address2,
        city,
        state,
        zipCode,
        country,
        phone,
        isDefault,
        type
      }
    })

    return NextResponse.json({ 
      address,
      message: 'Address created successfully' 
    })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
  }
}


