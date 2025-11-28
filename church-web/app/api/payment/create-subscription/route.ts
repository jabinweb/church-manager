import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createRazorpayInstance, getRazorpayKeyId } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { amount, fundId, frequency, donorName, donorEmail } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    if (!fundId) {
      return NextResponse.json({ error: 'Fund selection is required' }, { status: 400 })
    }

    if (!frequency || !['monthly', 'quarterly', 'yearly'].includes(frequency)) {
      return NextResponse.json({ error: 'Valid frequency is required' }, { status: 400 })
    }

    // Verify fund exists and is active
    const fund = await prisma.fund.findUnique({
      where: { id: fundId }
    })

    if (!fund || !fund.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive fund' }, { status: 400 })
    }

    // Get settings for currency
    const settings = await prisma.systemSettings.findFirst()
    const currency = settings?.currency || 'USD'

    // Convert amount to INR for Razorpay (if needed)
    let razorpayAmount = amount
    if (currency !== 'INR') {
      const conversionRates: Record<string, number> = {
        'USD': 83,
        'EUR': 90,
        'GBP': 104,
        'CAD': 61,
        'AUD': 55
      }
      razorpayAmount = amount * (conversionRates[currency] || 83)
    }

    // Create plan first
    const razorpayInstance = createRazorpayInstance()
    
    // Determine interval and period based on frequency
    let interval = 1
    let period: "daily" | "weekly" | "monthly" | "yearly" = 'monthly'
    
    switch (frequency) {
      case 'quarterly':
        interval = 3
        period = 'monthly'
        break
      case 'yearly':
        interval = 1
        period = 'yearly'
        break
      default:
        interval = 1
        period = 'monthly'
    }

    // Create plan
    const plan = await razorpayInstance.plans.create({
      period,
      interval,
      item: {
        name: `${frequency} donation to ${fund.name}`,
        amount: Math.round(razorpayAmount * 100), // Convert to paise
        currency: 'INR',
        description: `Recurring donation to ${fund.name}`
      }
    })

    // Create subscription
    const subscription = await razorpayInstance.subscriptions.create({
      plan_id: plan.id,
      customer_notify: 1,
      quantity: 1,
      total_count: frequency === 'yearly' ? 10 : 120, // 10 years for yearly, 10 years for monthly/quarterly
      notes: {
        fund_id: fundId,
        fund_name: fund.name,
        donor_name: donorName || session?.user?.name || '',
        donor_email: donorEmail || session?.user?.email || '',
        original_amount: amount.toString(),
        original_currency: currency,
        frequency
      }
    })

    // Store subscription details in database
    await prisma.donation.create({
      data: {
        userId: session?.user?.id || null,
        fundId,
        amount: amount,
        paymentMethod: 'CREDIT_CARD',
        transactionId: subscription.id,
        isRecurring: true,
        recurringFrequency: frequency,
        status: 'PENDING',
        donorName: donorName || session?.user?.name || null,
        donorEmail: donorEmail || session?.user?.email || null,
        notes: `Subscription ID: ${subscription.id}, Plan ID: ${plan.id}`
      }
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      planId: plan.id,
      keyId: getRazorpayKeyId(),
      amount: (subscription.quantity || 1) * Number(plan.item.amount),
      currency: 'INR',
      frequency,
      originalAmount: amount,
      originalCurrency: currency
    })

  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ 
      error: 'Failed to create subscription' 
    }, { status: 500 })
  }
}
