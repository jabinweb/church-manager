import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { clearSettingsCache } from '@/lib/settings'

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.systemSettings.create({
        data: {
          churchName: 'Grace Community Church',
          churchAddress: '123 Faith Street, Springfield, IL 62701',
          churchPhone: '(555) 123-4567',
          churchEmail: 'info@gracechurch.org',
          churchWebsite: 'https://gracechurch.org',
          enableOnlineGiving: true,
          enableEventRegistration: true,
          enablePrayerRequests: true,
          maintenanceMode: false,
          currency: 'USD'
        }
      })
    }

    return NextResponse.json({
      churchName: settings.churchName,
      churchAddress: settings.churchAddress || '',
      churchPhone: settings.churchPhone || '',
      churchEmail: settings.churchEmail || '',
      churchWebsite: settings.churchWebsite || '',
      enableOnlineGiving: settings.enableOnlineGiving,
      enableEventRegistration: settings.enableEventRegistration,
      enablePrayerRequests: settings.enablePrayerRequests,
      maintenanceMode: settings.maintenanceMode,
      currency: settings.currency,
      logoUrl: settings.logoUrl
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    
    // Return default settings if database fails
    return NextResponse.json({
      churchName: 'Grace Community Church',
      churchAddress: '123 Faith Street, Springfield, IL 62701',
      churchPhone: '(555) 123-4567',
      churchEmail: 'info@gracechurch.org',
      churchWebsite: 'https://gracechurch.org',
      enableOnlineGiving: true,
      enableEventRegistration: true,
      enablePrayerRequests: true,
      maintenanceMode: false,
      currency: 'USD',
      logoUrl: null
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get or create system settings
    let settings = await prisma.systemSettings.findFirst()
    
    if (!settings) {
      // Create new settings
      settings = await prisma.systemSettings.create({
        data: body
      })
    } else {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: body
      })
    }

    // Clear the settings cache so new values are fetched
    clearSettingsCache()

    return NextResponse.json({ 
      success: true,
      settings: {
        churchName: settings.churchName,
        churchAddress: settings.churchAddress,
        churchPhone: settings.churchPhone,
        churchEmail: settings.churchEmail,
        churchWebsite: settings.churchWebsite,
        enableOnlineGiving: settings.enableOnlineGiving,
        enableEventRegistration: settings.enableEventRegistration,
        enablePrayerRequests: settings.enablePrayerRequests,
        maintenanceMode: settings.maintenanceMode,
        currency: settings.currency,
        logoUrl: settings.logoUrl,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
        backgroundColor: settings.backgroundColor,
        textColor: settings.textColor,
        timezone: settings.timezone,
        defaultLanguage: settings.defaultLanguage,
        announcement: settings.announcement,
        facebookUrl: settings.facebookUrl,
        twitterUrl: settings.twitterUrl,
        instagramUrl: settings.instagramUrl,
        supportPhone: settings.supportPhone,
        privacyPolicyUrl: settings.privacyPolicyUrl,
        termsUrl: settings.termsUrl
      }
    })
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}
      