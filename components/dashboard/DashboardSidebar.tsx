'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  User,
  Users,
  Heart,
  Calendar,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  children?: SidebarItem[]
}

interface DashboardSidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export function DashboardSidebar({ isMobileOpen, setIsMobileOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Fix hydration by ensuring client-side only rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  const sidebarItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Messages',
      href: '/dashboard/messages',
      icon: MessageCircle,
    },
    {
      title: 'My Profile',
      href: '/dashboard/profile',
      icon: User,
      children: [
        { title: 'Personal Info', href: '/dashboard/profile', icon: User },
        { title: 'Family', href: '/dashboard/family', icon: Users },
        { title: 'Preferences', href: '/dashboard/preferences', icon: Settings },
      ]
    },
    {
      title: 'Spiritual Life',
      href: '/dashboard/spiritual',
      icon: Heart,
      children: [
        { title: 'My Groups', href: '/dashboard/groups', icon: Users },
        { title: 'Directory', href: '/dashboard/directory', icon: Users },
        { title: 'Prayer Requests', href: '/dashboard/prayers', icon: Heart },
      ]
    },
    {
      title: 'Church Life',
      href: '/dashboard/church',
      icon: Calendar,
      children: [
        { title: 'Events', href: '/dashboard/events', icon: Calendar },
        { title: 'Ministries', href: '/dashboard/ministries', icon: Users },
        { title: 'Volunteer', href: '/dashboard/volunteer', icon: Heart },
        { title: 'Attendance', href: '/dashboard/attendance', icon: BarChart3 },
      ]
    },
    {
      title: 'Giving & Orders',
      href: '/dashboard/giving',
      icon: DollarSign,
      children: [
        { title: 'Giving History', href: '/dashboard/giving', icon: DollarSign },
        { title: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag },
      ]
    },
  ]

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const hasActiveChild = (children?: SidebarItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.href))
  }

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    setIsMobileOpen(false)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="hidden lg:flex bg-white/80 backdrop-blur-sm border-r border-gray-200 h-full w-64 flex-shrink-0">
        <div className="p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-600">Member Portal</p>
          </div>
        </div>
      </div>
    )
  }

  const SidebarContent = () => (
    <>
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-600">Member Portal</p>
          </div>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const isItemActive = isActive(item.href)
            const hasActiveChildren = hasActiveChild(item.children)
            const isExpanded = expandedItems.includes(item.title)
            const shouldExpand = isExpanded || hasActiveChildren

            return (
              <div key={item.title}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1',
                      isItemActive || hasActiveChildren
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                  
                  {item.children && (
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className="p-1 rounded hover:bg-gray-100 ml-1"
                    >
                      {shouldExpand ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {item.children && shouldExpand && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-6 mt-2 space-y-1 overflow-hidden"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={handleLinkClick}
                          className={cn(
                            'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive(child.href)
                              ? 'bg-purple-50 text-purple-600 border-l-2 border-purple-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <child.icon className="h-4 w-4" />
                          <span>{child.title}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex bg-white/80 backdrop-blur-sm border-r border-gray-200 h-screen flex-shrink-0 w-64 flex-col"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Mobile Header Component
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      <div className="w-8" /> {/* Spacer for centering */}
    </div>
  )
}
