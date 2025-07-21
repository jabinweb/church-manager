import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, path } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Check if folder already exists in database
    const existingFolder = await prisma.file.findFirst({
      where: {
        name: name.trim(),
        path: path,
        type: 'folder',
        isDeleted: false
      }
    })

    if (existingFolder) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 400 })
    }

    // Create physical folder
    const folderPath = join(process.cwd(), 'public', 'uploads', path === '/' ? '' : path, name)
    await mkdir(folderPath, { recursive: true })

    // Generate unique fileName to avoid conflicts
    const uniqueFileName = `${Date.now()}-${name.trim()}`

    // Save folder to database
    const folder = await prisma.file.create({
      data: {
        name: name.trim(),
        originalName: name.trim(),
        fileName: uniqueFileName,
        path: path,
        url: '',
        type: 'folder',
        uploadedById: session.user.id,
        isPublic: false,
        tags: [],
        metadata: {}
      }
    })

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
