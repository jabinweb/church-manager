import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ file })
  } catch (error) {
    console.error('Error fetching file:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, isPublic, tags, description } = body

    const file = await prisma.file.update({
      where: { id },
      data: {
        ...(name && { name, originalName: name }),
        ...(isPublic !== undefined && { isPublic }),
        ...(tags && { tags }),
        ...(description !== undefined && { description }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ file })
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const file = await prisma.file.findUnique({ where: { id } })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from Vercel Blob if it's a file (not folder) and has a URL
    if (file.type === 'file' && file.url) {
      try {
        await del(file.url)
        console.log(`Deleted file from blob: ${file.url}`)
      } catch (blobError) {
        console.error('Error deleting from blob:', blobError)
        // Continue with database deletion even if blob deletion fails
      }
    }

    // Mark as deleted in database (soft delete)
    await prisma.file.update({
      where: { id },
      data: { 
        isDeleted: true, 
        updatedAt: new Date(),
        metadata: {
          ...file.metadata as any,
          deletedAt: new Date().toISOString(),
          deletedFromUI: true
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}


