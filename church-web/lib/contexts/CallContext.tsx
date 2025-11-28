'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCall } from '@/lib/hooks/useCall'
import type { CallContextType } from '@/lib/types/call'

const CallContext = createContext<CallContextType | null>(null)

export function CallProvider({ children }: { children: ReactNode }) {
  const call = useCall()
  
  return (
    <CallContext.Provider value={call}>
      {children}
    </CallContext.Provider>
  )
}

export function useCallContext() {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider')
  }
  return context
}
