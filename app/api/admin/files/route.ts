import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get files from database
    const dbFiles = await prisma.file.findMany({
      where: {
        path: path,
        isDeleted: false
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { type: 'desc' }, // Folders first
        { name: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    // Also check physical file system for any files not in database
    const physicalPath = join(process.cwd(), 'public', 'uploads', path === '/' ? '' : path.replace(/^\//, ''))
    let physicalFiles: any[] = []
    
    try {
      const entries = await readdir(physicalPath, { withFileTypes: true })
      
      for (const entry of entries) {
        // Skip .gitkeep and other hidden files
        if (entry.name.startsWith('.')) continue
        
        // Skip if already in database
        const existsInDb = dbFiles.some(dbFile => dbFile.name === entry.name)
        if (existsInDb) continue

        const fullPath = join(physicalPath, entry.name)
        const stats = await stat(fullPath)
        
        // Generate unique fileName to avoid conflicts
        const uniqueFileName = `${Date.now()}-${entry.name}`
        
        if (entry.isDirectory()) {
          // Create database entry for physical folder
          try {
            const folder = await prisma.file.create({
              data: {
                name: entry.name,
                originalName: entry.name,
                fileName: uniqueFileName,
                path: path,
                url: '',
                type: 'folder',
                uploadedById: session.user.id,
                isPublic: false,
                tags: [],
                metadata: {},
                createdAt: stats.birthtime,
                updatedAt: stats.mtime
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
            physicalFiles.push(folder)
          } catch (createError) {
            console.warn('Failed to create folder entry:', createError)
            // Continue without adding this folder
          }
        } else if (entry.isFile()) {
          // Create database entry for physical file
          const relativePath = `/uploads/${path === '/' ? '' : path.replace(/^\//, '') + '/'}${entry.name}`.replace(/\/+/g, '/')
          
          try {
            const file = await prisma.file.create({
              data: {
                name: entry.name,
                originalName: entry.name,
                fileName: uniqueFileName,
                path: path,
                url: relativePath,
                mimeType: getMimeType(entry.name),
                size: stats.size,
                type: 'file',
                uploadedById: session.user.id,
                isPublic: false,
                tags: [],
                metadata: {},
                createdAt: stats.birthtime,
                updatedAt: stats.mtime
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
            physicalFiles.push(file)
          } catch (createError) {
            console.warn('Failed to create file entry:', createError)
            // Continue without adding this file
          }
        }
      }
    } catch (fsError) {
      console.warn('Could not read physical directory:', fsError)
      // Continue with just database files
    }

    // Combine and sort all files
    const allFiles = [...dbFiles, ...physicalFiles].sort((a, b) => {
      // Folders first, then by name
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ files: allFiles })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

// Helper function to determine MIME type from file extension
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  
  const mimeTypes: { [key: string]: string } = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/mov',
    'wmv': 'video/wmv',
    'webm': 'video/webm',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    
    // Text
    'txt': 'text/plain',
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript'
  }
  
  return ext ? mimeTypes[ext] || 'application/octet-stream' : 'application/octet-stream'
}
