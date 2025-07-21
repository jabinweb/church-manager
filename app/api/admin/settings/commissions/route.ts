import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.commissionSettings.findMany({
      orderBy: { level: 'asc' }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching commission settings:', error)
    return NextResponse.json({ settings: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { level, percentage, isActive } = await request.json()

    const setting = await prisma.commissionSettings.create({
      data: { level, percentage, isActive }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error creating commission setting:', error)
    return NextResponse.json(
      { error: 'Failed to create commission setting' },
      { status: 500 }
    )
  }
}
