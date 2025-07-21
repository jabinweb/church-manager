import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const funds = await prisma.fund.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        targetAmount: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ 
      funds: funds.map(fund => ({
        ...fund,
        targetAmount: fund.targetAmount ? Number(fund.targetAmount) : null
      }))
    })
  } catch (error) {
    console.error('Error fetching funds:', error)
    return NextResponse.json({ funds: [] })
  }
}
