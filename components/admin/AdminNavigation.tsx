'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  Mic, 
  Calendar, 
  MessageSquare, 
  ShoppingBag, 
  DollarSign,
  Settings,
  Home,
  Newspaper,
  BookOpen,
  Heart,
  BarChart3,
  Mail, 
  Files, 
  ChevronLeft, 
  ChevronRight, 
  Package,
  ChevronDown,
  ChevronUp,
  Store,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface MenuItem {
  href: string
  label: string
  icon: any
  badge?: number
}

interface MenuGroup {
  label: string
  icon: any
  items: MenuItem[]
  defaultExpanded?: boolean
}

const adminMenuGroups: MenuGroup[] = [
  {
    label: 'Dashboard',
    icon: Home,
    items: [
      { href: '/admin', label: 'Overview', icon: Home }
    ],
    defaultExpanded: true
  },
  {
    label: 'Church Management',
    icon: BookOpen,
    items: [
      { href: '/admin/members', label: 'Members', icon: Users },
      { href: '/admin/ministries', label: 'Ministries', icon: BookOpen },
      { href: '/admin/prayer-requests', label: 'Prayer Requests', icon: Heart }
    ],
    defaultExpanded: true
  },
  {
    label: 'Content',
    icon: MessageSquare,
    items: [
      { href: '/admin/sermons', label: 'Sermons', icon: Mic },
      { href: '/admin/events', label: 'Events', icon: Calendar },
      { href: '/admin/news', label: 'News', icon: Newspaper },
      { href: '/admin/blog', label: 'Blog', icon: MessageSquare },
      { href: '/admin/files', label: 'Files', icon: Files }
    ],
    defaultExpanded: true
  },
  {
    label: 'Shop',
    icon: Store,
    items: [
      { href: '/admin/shop/products', label: 'Products', icon: Package },
      { href: '/admin/shop/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/shop/categories', label: 'Categories', icon: Package },
      { href: '/admin/shop/inventory', label: 'Inventory', icon: Package }
    ],
    defaultExpanded: false
  },
  {
    label: 'Financial',
    icon: DollarSign,
    items: [
      { href: '/admin/giving', label: 'Giving', icon: DollarSign },
      { href: '/admin/financial/funds', label: 'Funds', icon: CreditCard },
      { href: '/admin/financial/reports', label: 'Financial Reports', icon: BarChart3 }
    ],
    defaultExpanded: false
  },
  {
    label: 'Communications',
    icon: Mail,
    items: [
      { href: '/admin/communications', label: 'Messages', icon: Mail },
      { href: '/admin/communications/email', label: 'Email Campaigns', icon: Mail },
      { href: '/admin/communications/notifications', label: 'Notifications', icon: Mail }
    ],
    defaultExpanded: false
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    items: [
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { href: '/admin/analytics/attendance', label: 'Attendance', icon: Users },
      { href: '/admin/analytics/engagement', label: 'Engagement', icon: BarChart3 }
    ],
    defaultExpanded: false
  },
  {
    label: 'Settings',
    icon: Settings,
    items: [
      { href: '/admin/settings', label: 'General', icon: Settings },
      { href: '/admin/settings/permissions', label: 'Permissions', icon: Users },
      { href: '/admin/settings/system', label: 'System', icon: Settings }
    ],
    defaultExpanded: false
  }
]

export function AdminNavigation() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Initialize expanded groups after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    setExpandedGroups(
      new Set(adminMenuGroups.filter(group => group.defaultExpanded).map(group => group.label))
    )
  }, [])

  const toggleGroup = (groupLabel: string) => {
    if (collapsed) return // Don't toggle when collapsed
    
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupLabel)) {
      newExpanded.delete(groupLabel)
    } else {
      newExpanded.add(groupLabel)
    }
    setExpandedGroups(newExpanded)
  }

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  }

  const isItemActive = (item: MenuItem) => {
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  // Render simple version during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-r h-full min-h-screen w-64">
        <div className="p-4 space-y-2">
          <div className="pb-4 border-b flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">Church Admin</h2>
              <p className="text-sm text-gray-600 truncate">Management Portal</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {adminMenuGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-3">
                    <group.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{group.label}</span>
                  </div>
                  {group.items.length > 1 && (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </div>
                {group.defaultExpanded && (
                  <div className="ml-4 space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <item.icon className="h-3 w-3 flex-shrink-0 opacity-60" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <TooltipProvider>
      <nav className={cn(
        "bg-white shadow-sm border-r h-screen max-h-screen transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex-shrink-0 p-4 border-b">
          {/* Header */}
          <div className={cn(
            "flex items-center transition-all duration-300",
            collapsed ? "justify-center" : "justify-between"
          )}>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 truncate">Church Admin</h2>
                <p className="text-sm text-gray-600 truncate">Management Portal</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable Menu Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {/* Menu Groups */}
          <div className="space-y-1">
            {adminMenuGroups.map((group) => {
              const isActive = isGroupActive(group)
              const isExpanded = expandedGroups.has(group.label)
              
              if (collapsed) {
                // Collapsed view - show only main icons with tooltips
                return (
                  <div key={group.label} className="space-y-1">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'flex items-center justify-center w-full h-10 rounded-lg transition-colors cursor-pointer',
                            isActive 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <group.icon className="h-5 w-5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2">
                        <div className="space-y-1">
                          <div className="font-medium">{group.label}</div>
                          {group.items.map(item => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "block px-2 py-1 text-sm rounded hover:bg-gray-100",
                                isItemActive(item) ? "bg-purple-100 text-purple-700" : ""
                              )}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )
              }

              return (
                <div key={group.label} className="space-y-1">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <group.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{group.label}</span>
                    </div>
                    {group.items.length > 1 && (
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Group Items */}
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors w-full',
                            isItemActive(item)
                              ? 'bg-purple-100 text-purple-700 border-l-2 border-purple-500' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <item.icon className="h-3 w-3 flex-shrink-0 opacity-60" />
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
