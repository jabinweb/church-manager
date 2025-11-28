'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { AdminNavigation, MobileAdminHeader } from '@/components/admin/AdminNavigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Handle authentication
  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session?.user || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
      redirect('/auth/signin?callbackUrl=/admin')
    }
  }, [session, status])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!session?.user || !['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - sticky at top */}
      <div className="lg:hidden sticky top-0 z-40">
        <MobileAdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>

      <div className="flex">
        {/* Desktop Navigation - sticky sidebar */}
        <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
          <AdminNavigation />
        </div>
        
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <AdminNavigation 
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        </div>

        {/* Main Content Area - scrollable */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
