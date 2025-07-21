import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
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

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        continue // Skip files that are too large
      }

      // Generate unique filename with proper folder structure for Vercel Blob
      const timestamp = Date.now()
      const uuid = uuidv4()
      
      // Convert database path to Vercel Blob path (remove leading slash, use forward slashes)
      const blobPath = path === '/' ? '' : path.replace(/^\//, '') + '/'
      const fileName = `${blobPath}${timestamp}-${uuid}-${file.name}`
      
      try {
        // Upload to Vercel Blob with proper folder structure
        const blob = await put(fileName, file, {
          access: 'public'
        })

        // Check if a file with this fileName already exists
        const existingFile = await prisma.file.findUnique({
          where: { fileName }
        })

        if (existingFile) {
          console.log(`File with fileName ${fileName} already exists, skipping database save`)
          continue
        }

        // Save to database with original path structure
        const savedFile = await prisma.file.create({
          data: {
            name: file.name,
            originalName: file.name,
            fileName: fileName,
            path: path, // Keep the original path format for database
            url: blob.url,
            mimeType: file.type,
            size: file.size,
            uploadedById: session.user.id,
            type: 'file',
            isPublic: true,
            tags: [],
            metadata: {
              blobUrl: blob.url,
              pathname: blob.pathname,
              blobPath: fileName // Store the actual blob path
            }
          }
        })

        uploadedFiles.push(savedFile)
      } catch (uploadError: any) {
        if (uploadError.code === 'P2002') {
          console.log(`Duplicate fileName during upload: ${fileName}`)
          continue
        }
        console.error('Error uploading file:', uploadError)
        // Continue with other files
      }
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

