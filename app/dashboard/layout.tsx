'use client'

import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

function DashboardLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  )
}

export default function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex">
      <DashboardSidebar />
      <main className={cn("flex-1 overflow-auto", className)}>
        <Suspense fallback={<DashboardLoadingFallback />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
  