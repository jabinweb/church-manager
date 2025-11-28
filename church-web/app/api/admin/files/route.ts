import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { list } from '@vercel/blob'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'
    const syncBlob = searchParams.get('sync') === 'true'

    console.log('API: Fetching files for path:', path)

    // Always perform a lightweight sync before fetching files
    if (syncBlob) {
      await performFullSync(session.user.id)
    } else {
      await performLightweightSync(session.user.id)
    }

    // Get files from database - filter by exact path match
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
        { type: 'asc' }, // Folders first
        { name: 'asc' }
      ]
    })

    console.log('API: Found files:', dbFiles.length)

    return NextResponse.json({ files: dbFiles })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

// Lightweight sync - only checks for new files in blob that aren't in DB
async function performLightweightSync(userId: string) {
  try {
    // Add timeout for blob operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Blob API timeout')), 8000)
    )
    
    const blobPromise = list()
    const { blobs } = await Promise.race([blobPromise, timeoutPromise]) as any
    
    const dbFileUrls = await prisma.file.findMany({
      where: { type: 'file', isDeleted: false },
      select: { url: true }
    })
    
    const dbUrlSet = new Set(dbFileUrls.map(file => file.url))
    
    // Only add new files from blob that aren't in database
    let addedCount = 0
    for (const blob of blobs) {
      if (!dbUrlSet.has(blob.url)) {
        try {
          const fileName = blob.pathname
          const pathParts = blob.pathname.split('/')
          const actualFileName = pathParts[pathParts.length - 1]
          const originalName = actualFileName.replace(/^\d+-[a-f0-9-]+-/, '') || actualFileName
          const dbPath = pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/'

          // Check if file with this fileName already exists
          const existingFile = await prisma.file.findUnique({
            where: { fileName }
          })

          if (!existingFile) {
            await prisma.file.create({
              data: {
                name: originalName,
                originalName: originalName,
                fileName: fileName,
                path: dbPath,
                url: blob.url,
                mimeType: getContentType(originalName),
                size: blob.size || 0,
                type: 'file',
                uploadedById: userId,
                isPublic: true,
                tags: [],
                metadata: {
                  syncedFromBlob: true,
                  blobUrl: blob.url,
                  pathname: blob.pathname,
                  syncedAt: new Date().toISOString()
                }
              }
            })
            addedCount++
          }
        } catch (error: any) {
          if (error.code !== 'P2002') {
            console.error('Error in lightweight sync:', error)
          }
        }
      }
    }
    
    if (addedCount > 0) {
      console.log(`Lightweight sync: Added ${addedCount} new files`)
    }
  } catch (error) {
    console.error('Lightweight sync error:', error)
    
    // If blob sync fails, just continue without syncing
    // The app will still work with existing database files
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('Blob API timeout - skipping sync, continuing with database files')
    }
  }
}

// Full sync - comprehensive synchronization
async function performFullSync(userId: string) {
  try {
    // Add timeout for blob operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Blob API timeout')), 10000)
    )
    
    const blobPromise = list()
    const { blobs } = await Promise.race([blobPromise, timeoutPromise]) as any
    
    const dbFiles = await prisma.file.findMany({
      where: { type: 'file', isDeleted: false }
    })

    const dbFileMap = new Map(dbFiles.map(file => [file.url, file]))
    const dbFileNameMap = new Map(dbFiles.map(file => [file.fileName, file]))
    const blobUrlSet = new Set(blobs.map((blob: any) => blob.url))

    let syncStats = { added: 0, updated: 0, removed: 0 }

    // Add missing files from blob to database
    for (const blob of blobs) {
      if (!dbFileMap.has(blob.url)) {
        const fileName = blob.pathname
        const pathParts = blob.pathname.split('/')
        const actualFileName = pathParts[pathParts.length - 1]
        const originalName = actualFileName.replace(/^\d+-[a-f0-9-]+-/, '') || actualFileName
        const dbPath = pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/'

        if (!dbFileNameMap.has(fileName)) {
          try {
            await prisma.file.create({
              data: {
                name: originalName,
                originalName: originalName,
                fileName: fileName,
                path: dbPath,
                url: blob.url,
                mimeType: getContentType(originalName),
                size: blob.size || 0,
                type: 'file',
                uploadedById: userId,
                isPublic: true,
                tags: [],
                metadata: {
                  syncedFromBlob: true,
                  blobUrl: blob.url,
                  pathname: blob.pathname,
                  syncedAt: new Date().toISOString()
                }
              }
            })
            syncStats.added++
          } catch (error: any) {
            if (error.code !== 'P2002') {
              console.error(`Error adding file ${fileName}:`, error)
            }
          }
        }
      } else {
        // Update existing file if size changed
        const dbFile = dbFileMap.get(blob.url)!
        if (dbFile.size !== blob.size) {
          try {
            await prisma.file.update({
              where: { id: dbFile.id },
              data: { 
                size: blob.size || 0,
                updatedAt: new Date()
              }
            })
            syncStats.updated++
          } catch (error: any) {
            console.error(`Error updating file ${dbFile.fileName}:`, error.message)
          }
        }
      }
    }

    // Only mark files as deleted if we successfully connected to blob storage
    // Skip this step if there's a connection issue
    for (const dbFile of dbFiles) {
      if (dbFile.url && !blobUrlSet.has(dbFile.url)) {
        try {
          await prisma.file.update({
            where: { id: dbFile.id },
            data: { 
              isDeleted: true,
              updatedAt: new Date(),
              metadata: {
                ...dbFile.metadata as any,
                possiblyMissingFromBlob: true,
                lastChecked: new Date().toISOString()
              }
            }
          })
          syncStats.removed++
        } catch (error: any) {
          console.error(`Error marking file as deleted ${dbFile.fileName}:`, error.message)
        }
      }
    }

    console.log('Full sync completed:', syncStats)
  } catch (error) {
    console.error('Full sync error:', error)
    
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('Blob API timeout during full sync - continuing with database files only')
    }
  }
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
