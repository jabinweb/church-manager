import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  // Await params as per Next.js dynamic API requirements
  const { slug } = await context.params

  try {
    // Try to find by slug first (if it exists and is not empty)
    let ministry = null
    
    if (slug) {
      ministry = await prisma.ministry.findUnique({
        where: { slug }
      })

      // If not found by slug, try to find by id as fallback
      if (!ministry) {
        ministry = await prisma.ministry.findUnique({
          where: { id: slug }
        }).catch(() => null)
      }

      // If still not found, try to match by generated slug from name
      if (!ministry) {
        const allMinistries = await prisma.ministry.findMany({
          where: { isActive: true }
        })
        
        // Generate slug from name and compare
        ministry = allMinistries.find(m => {
          const generatedSlug = m.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
          return generatedSlug === slug
        }) || null
      }
    }

    if (!ministry) {
      return NextResponse.json({ error: 'Ministry not found' }, { status: 404 })
    }
    
    return NextResponse.json({ ministry })
  } catch (error) {
    console.error('Error fetching ministry:', error)
    return NextResponse.json({ error: 'Failed to fetch ministry' }, { status: 500 })
  }
}
