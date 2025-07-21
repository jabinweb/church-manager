import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: payoutId } = await params
    const { status, adminNotes } = await request.json()

    // Validate status
    if (!['APPROVED', 'REJECTED', 'PAID'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the payout
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: { user: true }
      })

      if (!payout) {
        throw new Error('Payout not found')
      }

      // Update payout
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status,
          adminNotes,
          updatedAt: new Date()
        }
      })

      // If rejecting, restore the amount to user's wallet
      if (status === 'REJECTED') {
        await tx.wallet.update({
          where: { userId: payout.userId },
          data: {
            balance: { increment: payout.amount }
          }
        })
      }

      return updatedPayout
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating payout:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payout' },
      { status: 500 }
    )
  }
}