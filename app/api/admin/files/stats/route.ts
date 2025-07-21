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

    // Get stats from database and blob storage
    const [fileStats, blobStats] = await Promise.all([
      getDBStats(),
      getBlobStats()
    ])

    // Check sync status
    const syncStatus = {
      lastSync: new Date().toISOString(),
      dbFiles: fileStats.totalFiles,
      blobFiles: blobStats.blobCount,
      inSync: Math.abs(fileStats.totalFiles - blobStats.blobCount) <= 5, // Allow small variance
      sizeDifference: Math.abs(fileStats.totalSize - blobStats.totalSize)
    }

    const stats = {
      totalFiles: fileStats.totalFiles,
      totalSize: Math.max(fileStats.totalSize, blobStats.totalSize), // Use larger value
      totalFolders: fileStats.totalFolders,
      recentUploads: fileStats.recentUploads,
      publicFiles: fileStats.publicFiles,
      privateFiles: fileStats.privateFiles,
      blobCount: blobStats.blobCount,
      blobSize: blobStats.totalSize,
      syncStatus
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

async function getDBStats() {
  const [totalFiles, totalFolders, recentUploads, publicFiles, privateFiles, sizeSum] = await Promise.all([
    prisma.file.count({
      where: { type: 'file', isDeleted: false }
    }),
    prisma.file.count({
      where: { type: 'folder', isDeleted: false }
    }),
    prisma.file.count({
      where: {
        type: 'file',
        isDeleted: false,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }),
    prisma.file.count({
      where: { type: 'file', isDeleted: false, isPublic: true }
    }),
    prisma.file.count({
      where: { type: 'file', isDeleted: false, isPublic: false }
    }),
    prisma.file.aggregate({
      where: { type: 'file', isDeleted: false },
      _sum: { size: true }
    })
  ])

  return {
    totalFiles,
    totalFolders,
    recentUploads,
    publicFiles,
    privateFiles,
    totalSize: sizeSum._sum.size || 0
  }
}

async function getBlobStats() {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Blob API timeout')), 5000)
    )
    
    const blobPromise = list()
    
    const { blobs } = await Promise.race([blobPromise, timeoutPromise]) as any
    const totalSize = blobs.reduce((sum: number, blob: any) => sum + (blob.size || 0), 0)
    
    return {
      blobCount: blobs.length,
      totalSize
    }
  } catch (error) {
    console.error('Error getting blob stats:', error)
    
    // Return fallback stats from database instead of failing
    try {
      const dbFiles = await prisma.file.findMany({
        where: { type: 'file', isDeleted: false },
        select: { size: true }
      })
      
      const totalSize = dbFiles.reduce((sum, file) => sum + (file.size || 0), 0)
      
      return {
        blobCount: dbFiles.length,
        totalSize,
        fallback: true // Indicate this is fallback data
      }
    } catch (dbError) {
      console.error('Error getting fallback stats from DB:', dbError)
      return {
        blobCount: 0,
        totalSize: 0,
        error: true
      }
    }
  }
}
