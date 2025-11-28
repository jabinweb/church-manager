'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cartManager } from '@/lib/cart'
import Link from 'next/link'

export default function CartIcon() {
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      setItemCount(cartManager.getCartCount())
    }

    // Initial load
    updateCount()

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCount)

    return () => {
      window.removeEventListener('cartUpdated', updateCount)
    }
  }, [])

  return (
    <Button variant="ghost" size="sm" asChild className="relative">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
