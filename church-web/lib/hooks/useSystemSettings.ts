'use client'

import { useEffect, useState } from 'react'

// Prefetch settings at module load (singleton pattern)
let cachedSettings: any = null
let cachedPromise: Promise<any> | null = null

async function fetchSettings() {
  if (cachedSettings) return cachedSettings
  if (cachedPromise) return cachedPromise
  cachedPromise = fetch('/api/admin/settings/system')
    .then(res => res.json())
    .then(data => {
      cachedSettings = data
      return data
    })
    .catch(() => {
      cachedSettings = { 
        currency: 'USD',
        churchName: 'Grace Community Church'
      }
      return cachedSettings
    })
  return cachedPromise
}

// Utility to get currency symbol from code
function getCurrencySymbol(code: string | undefined) {
  if (!code) return '$'
  try {
    return (0).toLocaleString(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim() || '$'
  } catch {
    return '$'
  }
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<any>(cachedSettings)
  const [currency, setCurrency] = useState<string>(cachedSettings?.currency || 'USD')
  const [currencySymbol, setCurrencySymbol] = useState<string>(getCurrencySymbol(cachedSettings?.currency || 'USD'))

  useEffect(() => {
    let mounted = true
    if (!settings) {
      fetchSettings().then(data => {
        if (mounted) {
          setSettings(data)
          setCurrency(data.currency || 'USD')
          setCurrencySymbol(getCurrencySymbol(data.currency))
        }
      })
    }
    return () => { mounted = false }
  }, [settings])

  return { ...settings, currency, currencySymbol }
}
