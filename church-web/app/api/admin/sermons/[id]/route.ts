import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const session = await auth()
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      speaker,
      series,
      date,
      duration,
      scriptureReference,
      tags,
      isPublished,
      videoUrl,
      audioUrl,
      // Add other fields as needed
    } = body

    const updated = await prisma.sermon.update({
      where: { id },
      data: {
        title,
        speaker,
        series,
        date: date ? new Date(date) : undefined,
        duration,
        scriptureReference,
        tags: Array.isArray(tags) ? tags : [],
        isPublished,
        videoUrl: videoUrl || null,
        audioUrl: audioUrl || null,
      }
    })

    return NextResponse.json({ sermon: updated })
  } catch (error) {
    console.error('Error updating sermon:', error)
    return NextResponse.json({ error: 'Failed to update sermon' }, { status: 500 })
  }
}

// Add DELETE method for deleting a sermon
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const session = await auth()
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.sermon.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sermon:', error)
    return NextResponse.json({ error: 'Failed to delete sermon' }, { status: 500 })
  }
}
