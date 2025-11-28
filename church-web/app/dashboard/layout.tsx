'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardSidebar, MobileHeader } from '@/components/dashboard/DashboardSidebar'
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

// Pages that should have no padding
const noPaddingPages = ['/dashboard/messages']

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  const shouldHavePadding = !noPaddingPages.some(page => pathname?.startsWith(page))

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Mobile Header - sticky at top */}
      <div className="lg:hidden sticky top-0 z-40">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
      
      <div className="flex">
        {/* Sidebar - sticky on desktop */}
        <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
          <DashboardSidebar 
            isMobileOpen={isMobileMenuOpen} 
            setIsMobileOpen={setIsMobileMenuOpen} 
          />
        </div>
        
        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <DashboardSidebar 
            isMobileOpen={isMobileMenuOpen} 
            setIsMobileOpen={setIsMobileMenuOpen} 
          />
        </div>
        
        {/* Main Content - scrollable */}
        <main className="flex-1">
          <Suspense fallback={<DashboardLoadingFallback />}>
            <div className={shouldHavePadding ? 'p-4 lg:p-6' : ''}>
              {children}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

