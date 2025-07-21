import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const path = formData.get('path') as string || '/'
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedFiles = []
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true })

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        continue // Skip files that are too large
      }

      const fileName = `${uuidv4()}-${file.name}`
      const filePath = join(uploadDir, fileName)
      const publicUrl = `/uploads/${fileName}`
      
      // Write file to disk
      const bytes = await file.arrayBuffer()
      const buffer = new Uint8Array(bytes)
      await writeFile(filePath, buffer)

      // Save to database
      const savedFile = await prisma.file.create({
        data: {
          name: file.name,
          originalName: file.name,
          fileName: fileName,
          path: path,
          url: publicUrl,
          mimeType: file.type,
          size: file.size,
          uploadedById: session.user.id,
          type: 'file',
          isPublic: false,
          tags: [],
          metadata: {}
        }
      })

      uploadedFiles.push(savedFile)
    }

    return NextResponse.json({ 
      uploadedCount: uploadedFiles.length,
      files: uploadedFiles 
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 })
  }
}
