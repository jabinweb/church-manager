'use client'

import { useState } from 'react'
import { DashboardSidebar, MobileHeader } from '@/components/dashboard/DashboardSidebar'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          isMobileOpen={isMobileMenuOpen} 
          setIsMobileOpen={setIsMobileMenuOpen} 
        />
        
        {/* Main Content */}
        <main className={cn("flex-1 overflow-auto min-h-screen lg:min-h-0")}>
          <Suspense fallback={<DashboardLoadingFallback />}>
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

