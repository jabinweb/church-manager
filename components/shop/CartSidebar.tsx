'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, X, Plus, Minus } from 'lucide-react'
import { cartManager, type CartItem } from '@/lib/cart'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'

export default function CartSidebar() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { currencySymbol } = useSystemSettings() // custom hook for global symbol

  const loadCart = () => {
    const cartItems = cartManager.getCart()
    setCart(cartItems)
  }

  useEffect(() => {
    loadCart()
    
    const handleCartUpdate = () => loadCart()
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  const updateQuantity = (productId: string, newQuantity: number) => {
    cartManager.updateQuantity(productId, newQuantity)
    loadCart()
  }

  const removeItem = (productId: string) => {
    cartManager.removeFromCart(productId)
    toast.success('Item removed from cart')
    loadCart()
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartManager.getTotalPrice()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Shopping Cart ({itemCount})
          </SheetTitle>
          <SheetDescription>
            Support our ministry through purchases
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <Button 
                className="mt-4 bg-purple-600 hover:bg-purple-700" 
                onClick={() => setIsOpen(false)}
                asChild
              >
                <Link href="/bookstore">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="w-15 h-15 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 text-white/70" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                    
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-sm font-bold text-green-600">
                        ${(item.price || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity || 0}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2 p-3 bg-purple-50 rounded-lg">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600">All proceeds support our church ministries</p>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700" 
                  onClick={() => setIsOpen(false)}
                  asChild
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                  asChild
                >
                  <Link href="/cart">View Full Cart</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
