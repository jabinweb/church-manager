import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { copyFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: fileId } = await params
    const { path } = await request.json()

    // Get original file from database
    const originalFile = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!originalFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (originalFile.type === 'folder') {
      return NextResponse.json({ error: 'Cannot copy folders yet' }, { status: 400 })
    }

    // Generate new filename
    const newFileName = `${uuidv4()}-copy-${originalFile.originalName}`
    const newFilePath = join(process.cwd(), 'public', 'uploads', newFileName)
    const originalFilePath = join(process.cwd(), 'public', 'uploads', originalFile.fileName)
    
    // Copy physical file
    await copyFile(originalFilePath, newFilePath)

    // Create database entry
    const copiedFile = await prisma.file.create({
      data: {
        name: `Copy of ${originalFile.name}`,
        originalName: `Copy of ${originalFile.originalName}`,
        fileName: newFileName,
        path: path,
        url: `/uploads/${newFileName}`,
        mimeType: originalFile.mimeType,
        size: originalFile.size,
        type: originalFile.type,
        uploadedById: session.user.id,
        isPublic: false,
        tags: originalFile.tags,
        description: originalFile.description,
        metadata: originalFile.metadata || {}
      }
    })

    return NextResponse.json({ file: copiedFile })
  } catch (error) {
    console.error('Error copying file:', error)
    return NextResponse.json({ error: 'Failed to copy file' }, { status: 500 })
  }
}
