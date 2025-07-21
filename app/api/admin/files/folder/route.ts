import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, path, parentId } = await request.json()
    
    console.log('API: Creating folder:', { name, path, parentId, userId: session.user.id })
    
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Check if folder already exists in database
    const existingFolder = await prisma.file.findFirst({
      where: {
        name: name.trim(),
        path: path || '/',
        type: 'folder',
        isDeleted: false
      }
    })

    if (existingFolder) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 400 })
    }

    // Generate unique fileName to avoid conflicts
    const uniqueFileName = `folder-${Date.now()}-${name.trim()}`

    // Save virtual folder to database with the same path structure as files
    const folder = await prisma.file.create({
      data: {
        name: name.trim(),
        originalName: name.trim(),
        fileName: uniqueFileName,
        path: path || '/', // Use the current path, not a combined path
        url: '', // Empty URL for folders
        type: 'folder',
        uploadedById: session.user.id, // Use the actual user ID from session
        parentId: parentId || null,
        isPublic: false,
        tags: [],
        metadata: {
          isVirtual: true,
          createdOnVercel: true
        }
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('API: Folder created successfully:', folder)

    return NextResponse.json({ 
      folder,
      message: 'Virtual folder created successfully'
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
