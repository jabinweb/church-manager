import { prisma } from '@/lib/prisma'

export interface ChurchSettings {
  churchName: string
  churchAddress: string
  churchPhone: string
  churchEmail: string
  churchWebsite: string
  enableOnlineGiving: boolean
  enableEventRegistration: boolean
  enablePrayerRequests: boolean
  maintenanceMode: boolean
  currency: string // Add currency field
}

let cachedSettings: ChurchSettings | null = null
let cacheExpiry: number = 0

export async function getChurchSettings(): Promise<ChurchSettings> {
  // Return cached settings if still valid (cache for 5 minutes)
  if (cachedSettings && Date.now() < cacheExpiry) {
    return cachedSettings
  }

  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      throw new Error('Cannot use Prisma in browser environment')
    }

    // Check if we're in Edge Runtime (middleware environment)
    if (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) {
      throw new Error('Cannot use Prisma in Edge Runtime')
    }

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

    cachedSettings = {
      churchName: settings.churchName,
      churchAddress: settings.churchAddress || '',
      churchPhone: settings.churchPhone || '',
      churchEmail: settings.churchEmail || '',
      churchWebsite: settings.churchWebsite || '',
      enableOnlineGiving: settings.enableOnlineGiving,
      enableEventRegistration: settings.enableEventRegistration,
      enablePrayerRequests: settings.enablePrayerRequests,
      maintenanceMode: settings.maintenanceMode,
      currency: settings.currency // Include currency field
    }

    // Cache for 5 minutes
    cacheExpiry = Date.now() + 5 * 60 * 1000

    return cachedSettings
  } catch (error) {
    console.error('Error getting church settings:', error)
    
    // Return default settings if database fails
    return {
      churchName: 'Grace Community Church',
      churchAddress: '123 Faith Street, Springfield, IL 62701',
      churchPhone: '(555) 123-4567',
      churchEmail: 'info@gracechurch.org',
      churchWebsite: 'https://gracechurch.org',
      enableOnlineGiving: true,
      enableEventRegistration: true,
      enablePrayerRequests: true,
      maintenanceMode: false,
      currency: 'USD' // Include currency in fallback
    }
  }
}

export function clearSettingsCache() {
  cachedSettings = null
  cacheExpiry = 0
}
