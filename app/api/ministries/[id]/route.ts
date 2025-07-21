import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await params as per Next.js dynamic API requirements
  const { id } = await context.params

  try {
    // Try to find by id first
    let ministry = await prisma.ministry.findUnique({
      where: { id }
    })

    // If not found, try to find by slug or name (for /adults, /youth, etc.)
    if (!ministry) {
      // Try to match by slugified name (lowercase, dashes, etc.)
      const normalizedId = id.replace(/-/g, ' ').toLowerCase()
      ministry = await prisma.ministry.findFirst({
        where: {
          OR: [
            { name: { equals: id, mode: 'insensitive' } },
            { name: { equals: normalizedId, mode: 'insensitive' } },
            { name: { contains: normalizedId, mode: 'insensitive' } }
          ]
        }
      })
    }

    if (!ministry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ministry })
  } catch (error) {
    console.error('Error fetching ministry:', error)
    return NextResponse.json({ error: 'Failed to fetch ministry' }, { status: 500 })
  }
}
