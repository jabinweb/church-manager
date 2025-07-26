'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from 'next-auth/react'
import { 
  Menu, 
  X, 
  ChevronDown, 
  Heart,
  Calendar,
  BookOpen,
  Users,
  Settings,
  User,
  LogOut,
  Search,
  ShoppingBag,
  DollarSign,
  MessageSquare,
  Newspaper,
  Home,
  Church
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CartSidebar from '@/components/shop/CartSidebar'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import Image from 'next/image'

type UserRole = 'ADMIN' | 'PASTOR' | 'STAFF' | 'MEMBER' | 'CUSTOMER'

// Define menu structure with categories and items
interface NavGroup {
  name: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon?: React.ElementType;
  hasDropdown?: boolean;
  dropdownItems?: { name: string; href: string, icon?: React.ElementType }[];
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const { churchName, logoUrl } = useSystemSettings()

  // Split churchName for display
  let mainName = 'Grace'
  let subName = 'Community Church'
  if (churchName) {
    const words = churchName.trim().split(' ')
    if (words.length > 1) {
      mainName = words[0]
      subName = words.slice(1).join(' ')
    } else {
      mainName = churchName
      subName = ''
    }
  }

  // Main navigation groups
  const mainNavGroups: NavGroup[] = [
    {
      name: "Church",
      items: [
        { 
          name: 'About', 
          href: '/about',
          icon: Church,
          hasDropdown: true,
          dropdownItems: [
            { name: 'Our Story', href: '/about/story' },
            { name: 'Leadership', href: '/about/leadership' },
            { name: 'Beliefs', href: '/about/beliefs' },
            { name: 'Vision & Mission', href: '/about/vision' },
          ]
        },
        { 
          name: 'Ministries', 
          href: '/ministries',
          icon: Users,
          hasDropdown: true,
          dropdownItems: [
            { name: 'Adult Ministry', href: '/ministries/adults' },
            { name: 'Youth Ministry', href: '/ministries/youth' },
            { name: 'Children\'s Ministry', href: '/ministries/children' },
            { name: 'Worship Ministry', href: '/ministries/worship' },
            { name: 'Outreach', href: '/ministries/outreach' },
          ]
        },
        { name: 'Events', href: '/events', icon: Calendar },
      ]
    },
    {
      name: "Media",
      items: [
        { name: 'Sermons', href: '/sermons', icon: BookOpen },
        { name: 'News', href: '/news', icon: Newspaper },
        { name: 'Blog', href: '/blog', icon: MessageSquare },
      ]
    },
    {
      name: "Store",
      items: [
        { name: 'Bookstore', href: '/store', icon: ShoppingBag },
      ]
    },
    {
      name: "Support",
      items: [
        { name: 'Give', href: '/giving', icon: DollarSign },
        { name: 'Prayer', href: '/prayer', icon: Heart },
      ]
    }
  ]

  // Flatten navigation for mobile view
  const navigation: NavItem[] = mainNavGroups.flatMap(group => group.items);

  // User navigation grouped
  const userNavGroups: NavGroup[] = [
    {
      name: "My Account",
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'My Groups', href: '/dashboard/groups', icon: Users },
        { name: 'Prayer Requests', href: '/dashboard/prayers', icon: Heart },
      ]
    },
    {
      name: "My Activity",
      items: [
        { name: 'Giving History', href: '/dashboard/giving', icon: DollarSign },
        { name: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag },
      ]
    }
  ]
  
  // Admin navigation grouped
  const adminNavGroups: NavGroup[] = [
    {
      name: "Administration",
      items: [
        { name: 'Admin Panel', href: '/admin', icon: Settings },
        { name: 'Members', href: '/admin/members', icon: Users },
      ]
    },
    {
      name: "Content",
      items: [
        { name: 'Sermons', href: '/admin/sermons', icon: BookOpen },
        { name: 'Events', href: '/admin/events', icon: Calendar },
        { name: 'News', href: '/admin/news', icon: Newspaper },
        { name: 'Blog', href: '/admin/blog', icon: MessageSquare },
      ]
    },
    {
      name: "Business",
      items: [
        { name: 'Shop', href: '/admin/shop', icon: ShoppingBag },
        { name: 'Giving', href: '/admin/giving', icon: DollarSign },
      ]
    }
  ]

  // Flatten user and admin navigation for simple access
  const memberNavigation = userNavGroups.flatMap(group => group.items);
  const adminNavigation = adminNavGroups.flatMap(group => group.items);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check if click is outside user menu
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false)
      }
      
      // Check if click is outside any dropdown
      const isOutsideDropdown = Object.values(dropdownRefs.current).every(
        ref => !ref?.contains(target)
      )
      if (isOutsideDropdown) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setActiveDropdown(null)
    setShowUserMenu(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }
  
  const hasAdminAccess = session?.user?.role && ['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as UserRole)

  const handleDropdownToggle = (itemName: string) => {
    setActiveDropdown(prev => prev === itemName ? null : itemName)
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group mr-4 sm:mr-8" prefetch={false}>
              {logoUrl ? (
                <span className="relative h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 flex items-center justify-center">
                  <Image
                    src={logoUrl}
                    alt={churchName || 'Church Logo'}
                    fill
                    className="object-contain rounded"
                    sizes="(max-width: 640px) 32px, 40px"
                    priority
                  />
                </span>
              ) : (
                <Church className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-2 sm:mr-3 group-hover:text-purple-700 transition-colors" />
              )}
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{mainName}</span>
                {subName && (
                  <span className="text-xs text-purple-600 font-medium leading-tight">{subName}</span>
                )}
              </div>
            </Link>
            
            {/* Desktop Navigation with Groups */}
            <div className="hidden lg:flex lg:items-center lg:space-x-6">
              {mainNavGroups.map((group) => (
                <div key={group.name} className="relative group">
                  <button 
                    type="button"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50"
                  >
                    {group.name}
                  </button>
                  
                  {/* Group Dropdown */}
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-20 hidden group-hover:block">
                    {group.items.map((item) => (
                      <div key={item.name} className="relative group/nested">
                        {item.hasDropdown ? (
                          <div>
                            <Link
                              href={item.href}
                              className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                            >
                              <div className="flex items-center">
                                {item.icon && <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />}
                                {item.name}
                              </div>
                              <ChevronDown className="h-3 w-3 ml-2" />
                            </Link>
                            
                            {/* Nested Dropdown - positioned to the right */}
                            {item.dropdownItems && (
                              <div className="absolute left-full top-0 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-100 hidden group-hover/nested:block">
                                {item.dropdownItems.map((subItem) => (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                                    prefetch={false}
                                  >
                                    {subItem.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm",
                              isActive(item.href) 
                                ? 'text-purple-600 bg-purple-50' 
                                : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                            )}
                            prefetch={false}
                          >
                            {item.icon && <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />}
                            {item.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Search Button - hidden on very small screens */}
            <Button variant="ghost" size="sm" className="hidden md:flex h-9 w-9 p-0">
              <Search className="h-4 w-4" />
            </Button>

            {/* Shopping Cart - using CartSidebar component */}
            <div className="hidden xs:block">
              <CartSidebar />
            </div>

            {session ? (
              <>
                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center space-x-1 sm:space-x-2 h-9 px-2 sm:px-3"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    </div>
                    <div className="hidden sm:block text-left min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-20 lg:max-w-24">
                        {session.user?.name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {session.user?.role?.toLowerCase()}
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform duration-200 flex-shrink-0 hidden sm:block",
                      showUserMenu && 'rotate-180'
                    )} />
                  </Button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-1 w-64 sm:w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                      
                      {/* Grouped menu items */}
                      {(hasAdminAccess ? adminNavGroups : userNavGroups).map((group) => (
                        <div key={group.name} className="pt-2 first:pt-0">
                          <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {group.name}
                          </div>
                          {group.items.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                              onClick={() => setShowUserMenu(false)}
                            >
                              {item.icon && <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />}
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => signOut()}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Mobile: Show only icons, Desktop: Show text */}
                <Button variant="ghost" size="sm" className="h-9 w-9 sm:w-auto sm:px-3 p-0 sm:p-2" asChild>
                  <Link href="/auth/signin">
                    <User className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-sm h-9 w-9 sm:w-auto px-0 sm:px-4" asChild>
                  <Link href="/giving">
                    <DollarSign className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Give</span>
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden ml-1 sm:ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 p-0"
              >
                {isOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-100">
          <div className="px-4 py-3 space-y-1 bg-white max-h-[80vh] overflow-y-auto">
            {/* Search for mobile */}
            <div className="md:hidden mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Cart for mobile (if hidden on very small screens) */}
            <div className="xs:hidden mb-4">
              <Link
                href="/cart"
                className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 touch-manipulation"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingBag className="h-5 w-5 mr-3" />
                Cart
              </Link>
            </div>

            {/* Quick Actions Row for Mobile */}
            {!session && (
              <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-white transition-colors touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
                <Link
                  href="/giving"
                  className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Give
                </Link>
              </div>
            )}

            {/* Navigation sections with better mobile spacing */}
            {mainNavGroups.map((group) => (
              <div key={group.name} className="pt-3 first:pt-0">
                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-md mb-1">
                  {group.name}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <div key={item.name}>
                      {item.hasDropdown ? (
                        <div>
                          <button
                            onClick={() => handleDropdownToggle(`mobile-${item.name}`)}
                            className="flex items-center justify-between w-full px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 touch-manipulation"
                          >
                            <div className="flex items-center">
                              {item.icon && <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />}
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                              activeDropdown === `mobile-${item.name}` && 'rotate-180'
                            )} />
                          </button>
                          {activeDropdown === `mobile-${item.name}` && item.dropdownItems && (
                            <div className="ml-6 mt-1 space-y-1 border-l-2 border-purple-100 pl-4">
                              {item.dropdownItems.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  className="block px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors touch-manipulation"
                                  onClick={() => setIsOpen(false)}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors touch-manipulation",
                            isActive(item.href)
                              ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                              : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.icon && <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />}
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* User account section for mobile */}
            {session && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-md mb-2">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-2" />
                    {session.user?.name || 'Account'}
                  </div>
                </div>
                <div className="space-y-1">
                  {(hasAdminAccess ? adminNavigation : memberNavigation).slice(0, 4).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 transition-colors touch-manipulation"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon && <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      signOut()
                      setIsOpen(false)
                    }}
                    className="flex items-center w-full px-3 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                  >
                    <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}