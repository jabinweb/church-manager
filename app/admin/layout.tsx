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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Navigation */}
      <AdminNavigation />
      
      {/* Mobile Navigation */}
      <AdminNavigation 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <MobileAdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
