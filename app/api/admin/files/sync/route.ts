import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { list } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const syncResult = await performFullSync()
    
    return NextResponse.json({
      success: true,
      syncResult
    })
  } catch (error) {
    console.error('Error performing sync:', error)
    return NextResponse.json({ error: 'Failed to sync files' }, { status: 500 })
  }
}

async function performFullSync() {
  const syncStart = Date.now()
  let added = 0
  let removed = 0
  let updated = 0
  let skipped = 0
  let timeoutOccurred = false

  try {
    // Get the first admin user to use as the sync user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      throw new Error('No admin user found for sync operations')
    }

    // Add timeout for blob operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Blob API timeout')), 15000)
    )
    
    const blobPromise = list()
    
    let blobs: any[]
    try {
      const result = await Promise.race([blobPromise, timeoutPromise]) as any
      blobs = result.blobs
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        timeoutOccurred = true
        console.log('Blob API timeout - returning database-only sync status')
        
        const dbFiles = await prisma.file.findMany({
          where: { type: 'file', isDeleted: false }
        })

        return {
          duration: Date.now() - syncStart,
          added: 0,
          removed: 0,
          updated: 0,
          skipped: 0,
          totalBlobs: 'timeout',
          totalDbFiles: dbFiles.length,
          timestamp: new Date().toISOString(),
          timeout: true,
          message: 'Blob storage timeout - showing database files only'
        }
      }
      throw error
    }

    const dbFiles = await prisma.file.findMany({
      where: { type: 'file', isDeleted: false }
    })

    const dbFileMap = new Map(dbFiles.map(file => [file.url, file]))
    const dbFileNameMap = new Map(dbFiles.map(file => [file.fileName, file]))
    const blobUrlSet = new Set(blobs.map((blob: any) => blob.url))

    // Add missing files from blob to database
    for (const blob of blobs) {
      if (!dbFileMap.has(blob.url)) {
        const fileName = blob.pathname
        const pathParts = blob.pathname.split('/')
        
        // Extract original name (remove timestamp and UUID prefix)
        const actualFileName = pathParts[pathParts.length - 1]
        const originalName = actualFileName.replace(/^\d+-[a-f0-9-]+-/, '') || actualFileName
        
        // Build database path from blob pathname
        const dbPath = pathParts.length > 1 ? 
          '/' + pathParts.slice(0, -1).join('/') : '/'

        if (dbFileNameMap.has(fileName)) {
          console.log(`Skipping duplicate fileName: ${fileName}`)
          skipped++
          continue
        }

        try {
          const result = await prisma.file.upsert({
            where: { fileName: fileName },
            update: {
              url: blob.url,
              size: blob.size || 0,
              isDeleted: false,
              updatedAt: new Date()
            },
            create: {
              name: originalName,
              originalName: originalName,
              fileName: fileName,
              path: dbPath,
              url: blob.url,
              mimeType: getContentType(originalName),
              size: blob.size || 0,
              type: 'file',
              uploadedById: adminUser.id,
              isPublic: true,
              tags: [],
              metadata: {
                syncedFromBlob: true,
                blobUrl: blob.url,
                pathname: blob.pathname,
                blobPath: fileName,
                syncedAt: new Date().toISOString()
              }
            }
          })

          const wasCreated = !dbFileNameMap.has(fileName)
          if (wasCreated) {
            added++
          } else {
            updated++
          }
          
          dbFileNameMap.set(fileName, result)
        } catch (error: any) {
          console.error(`Error upserting file ${fileName}:`, error.message)
          skipped++
          continue
        }
      } else {
        // File exists in both places, check if size needs updating
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
            updated++
          } catch (error: any) {
            console.error(`Error updating file size ${dbFile.fileName}:`, error.message)
          }
        }
      }
    }

    // Mark files as deleted if they no longer exist in blob storage
    // Only do this if we successfully got blob data
    if (!timeoutOccurred) {
      for (const dbFile of dbFiles) {
        if (dbFile.url && !blobUrlSet.has(dbFile.url)) {
          try {
            await prisma.file.update({
              where: { id: dbFile.id },
              data: { 
                isDeleted: true,
                updatedAt: new Date()
              }
            })
            removed++
          } catch (error: any) {
            console.error(`Error marking file as deleted ${dbFile.fileName}:`, error.message)
          }
        }
      }
    }

    return {
      duration: Date.now() - syncStart,
      added,
      removed,
      updated,
      skipped,
      totalBlobs: blobs.length,
      totalDbFiles: dbFiles.length,
      timestamp: new Date().toISOString(),
      timeout: timeoutOccurred
    }
  } catch (error) {
    console.error('Sync error:', error)
    throw error
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
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
