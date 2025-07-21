import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalFiles, totalFolders, totalSize, recentUploads, publicFiles, privateFiles] = await Promise.all([
      prisma.file.count({
        where: { type: 'file', isDeleted: false }
      }),
      prisma.file.count({
        where: { type: 'folder', isDeleted: false }
      }),
      prisma.file.aggregate({
        where: { type: 'file', isDeleted: false },
        _sum: { size: true }
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
      })
    ])

    const stats = {
      totalFiles,
      totalFolders,
      totalSize: totalSize._sum.size || 0,
      recentUploads,
      publicFiles,
      privateFiles
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching file stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
