import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { unlink, rmdir } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: fileId } = await params

    // Get file info from database
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete physical file/folder
    try {
      if (file.type === 'folder') {
        const folderPath = join(process.cwd(), 'public', 'uploads', file.path === '/' ? '' : file.path, file.name)
        await rmdir(folderPath, { recursive: true })
      } else if (file.fileName) {
        const filePath = join(process.cwd(), 'public', 'uploads', file.fileName)
        await unlink(filePath)
      }
    } catch (fsError) {
      console.warn('Failed to delete physical file:', fsError)
      // Continue with database deletion even if physical file deletion fails
    }

    // Soft delete in database
    await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: fileId } = await params
    const body = await request.json()

    // Get file info from database
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Update file properties
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        name: body.name || file.name,
        isPublic: body.isPublic !== undefined ? body.isPublic : file.isPublic,
        tags: body.tags || file.tags,
        description: body.description !== undefined ? body.description : file.description
      }
    })

    return NextResponse.json({ file: updatedFile })
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
  }
}
