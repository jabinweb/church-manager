import { put, del, list, head } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function uploadFile(file: File, path: string = '', userId?: string) {
  // Generate a more unique filename with proper Vercel Blob folder structure
  const timestamp = Date.now()
  const uuid = uuidv4()
  
  // Convert database path to Vercel Blob path (remove leading slash)
  const blobPath = path === '/' ? '' : path.replace(/^\//, '') + '/'
  const filename = `${blobPath}${timestamp}-${uuid}-${file.name}`
  
  try {
    const blob = await put(filename, file, {
      access: 'public'
    })
    
    // Also save to database if userId provided
    if (userId) {
      // Check for existing file with same fileName
      const existingFile = await prisma.file.findUnique({
        where: { fileName: filename }
      })

      if (!existingFile) {
        await prisma.file.create({
          data: {
            name: file.name,
            originalName: file.name,
            fileName: filename,
            path: path || '/',
            url: blob.url,
            mimeType: file.type,
            size: file.size,
            type: 'file',
            uploadedById: userId,
            isPublic: true,
            tags: [],
            metadata: {
              blobUrl: blob.url,
              pathname: blob.pathname,
              blobPath: filename,
              uploadedToBlob: true
            }
          }
        })
      }
    }
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      filename: filename
    }
  } catch (error) {
    console.error('Failed to upload file:', error)
    throw new Error('Upload failed')
  }
}

export async function deleteFile(url: string) {
  try {
    await del(url)
    
    // Also mark as deleted in database
    await prisma.file.updateMany({
      where: { url },
      data: { 
        isDeleted: true,
        updatedAt: new Date()
      }
    })
    
    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

export async function listFiles(prefix?: string) {
  try {
    // Convert database path to Vercel Blob prefix format
    const blobPrefix = prefix ? prefix.replace(/^\//, '') + '/' : ''
    
    const { blobs } = await list({
      prefix: blobPrefix
    })
    
    return blobs
  } catch (error) {
    console.error('Failed to list files:', error)
    return []
  }
}

export async function fileExists(url: string): Promise<boolean> {
  try {
    await head(url)
    return true
  } catch (error) {
    return false
  }
}

export async function syncFileWithBlob(fileId: string): Promise<boolean> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })
    
    if (!file || !file.url) return false
    
    const exists = await fileExists(file.url)
    
    if (!exists && !file.isDeleted) {
      // File doesn't exist in blob but is not marked as deleted
      await prisma.file.update({
        where: { id: fileId },
        data: { 
          isDeleted: true,
          updatedAt: new Date()
        }
      })
      return false
    }
    
    return exists
  } catch (error) {
    console.error('Error syncing file with blob:', error)
    return false
  }
}

export async function getBlobUsage() {
  try {
    const { blobs } = await list()
    const totalSize = blobs.reduce((sum, blob) => sum + (blob.size || 0), 0)
    
    return {
      count: blobs.length,
      totalSize,
      blobs: blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }))
    }
  } catch (error) {
    console.error('Error getting blob usage:', error)
    return {
      count: 0,
      totalSize: 0,
      blobs: []
    }
  }
}

export async function syncAllFiles(): Promise<{
  added: number
  updated: number
  removed: number
  errors: string[]
}> {
  const errors: string[] = []
  let added = 0
  let updated = 0
  let removed = 0

  try {
    // Get the first admin user to use as the sync user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      errors.push('No admin user found for sync operations')
      return { added, updated, removed, errors }
    }

    // Get all blobs and database files
    const [{ blobs }, dbFiles] = await Promise.all([
      list(),
      prisma.file.findMany({
        where: { type: 'file', isDeleted: false }
      })
    ])

    const dbFileMap = new Map(dbFiles.map(file => [file.url, file]))
    const blobUrlSet = new Set(blobs.map(blob => blob.url))

    // Add missing files from blob to database
    for (const blob of blobs) {
      if (!dbFileMap.has(blob.url)) {
        try {
          const fileName = blob.pathname
          const pathParts = blob.pathname.split('/')
          const actualFileName = pathParts[pathParts.length - 1]
          const originalName = actualFileName.replace(/^\d+-[a-f0-9-]+-/, '') || actualFileName
          const dbPath = pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/'

          // Check if file already exists by fileName
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
                uploadedById: adminUser.id, // Use admin user instead of 'system'
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
            added++
          }
        } catch (error: any) {
          if (error.code !== 'P2002') {
            errors.push(`Failed to add ${blob.pathname}: ${error.message}`)
          }
        }
      }
    }

    // Update files that exist in both places
    for (const blob of blobs) {
      const dbFile = dbFileMap.get(blob.url)
      if (dbFile && dbFile.size !== blob.size) {
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
          errors.push(`Failed to update ${dbFile.fileName}: ${error.message}`)
        }
      }
    }

    // Mark files as deleted if they no longer exist in blob storage
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
                missingFromBlob: true,
                checkedAt: new Date().toISOString()
              }
            }
          })
          removed++
        } catch (error: any) {
          errors.push(`Failed to mark as deleted ${dbFile.fileName}: ${error.message}`)
        }
      }
    }

    return { added, updated, removed, errors }
  } catch (error) {
    console.error('Sync error:', error)
    errors.push(`Sync failed: ${error}`)
    return { added, updated, removed, errors }
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
