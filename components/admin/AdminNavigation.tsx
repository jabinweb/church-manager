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
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

const adminMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/sermons', label: 'Sermons', icon: Mic },
  { href: '/admin/files', label: 'Files', icon: Files },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/news', label: 'News', icon: Newspaper },
  { href: '/admin/blog', label: 'Blog', icon: MessageSquare },
  { href: '/admin/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/admin/giving', label: 'Giving', icon: DollarSign },
  { href: '/admin/prayer-requests', label: 'Prayer Requests', icon: Heart },
  { href: '/admin/ministries', label: 'Ministries', icon: BookOpen },
  { href: '/admin/communications', label: 'Communications', icon: Mail },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminNavigation() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider>
      <nav className={cn(
        "bg-white shadow-sm border-r h-full min-h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 space-y-2">
          {/* Header */}
          <div className={cn(
            "pb-4 border-b flex items-center transition-all duration-300",
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

          {/* Menu Items */}
          <div className="space-y-1">
            {adminMenuItems.map((item) => {
              const isActive = pathname === item.href
              
              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center justify-center w-full h-10 rounded-lg transition-colors',
                          isActive 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                    isActive 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
