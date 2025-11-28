import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    // For now, return mock data since we don't have a StockMovement model yet
    // You would implement this with a proper StockMovement model
    const movements = [
      {
        id: '1',
        productId: productId || '',
        type: 'IN' as const,
        quantity: 50,
        reason: 'Stock Received',
        notes: 'Initial stock',
        createdAt: new Date().toISOString(),
        createdBy: {
          name: session.user.name || 'System'
        }
      },
      {
        id: '2',
        productId: productId || '',
        type: 'OUT' as const,
        quantity: 5,
        reason: 'Stock Sold',
        notes: 'Customer purchase',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: {
          name: 'System'
        }
      }
    ]

    return NextResponse.json({ movements })
  } catch (error) {
    console.error('Error fetching movements:', error)
    return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 })
  }
}
