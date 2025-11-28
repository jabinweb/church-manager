export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string | null
  stockQuantity?: number
}

interface Product {
  id: string
  name: string
  price: number | string
  imageUrl?: string | null
  stockQuantity: number
}

class CartManager {
  private storageKey = 'church-cart'

  getCart(): CartItem[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading cart:', error)
      return []
    }
  }

  saveCart(cart: CartItem[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(cart))
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('cartUpdated'))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }

  addToCart(product: Product, quantity: number = 1): boolean {
    const cart = this.getCart()
    const price = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price) || 0
    
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.stockQuantity) {
        return false // Not enough stock
      }
      existingItem.quantity = newQuantity
    } else {
      if (quantity > product.stockQuantity) {
        return false // Not enough stock
      }
      
      cart.push({
        id: product.id,
        name: product.name,
        price: price,
        quantity: quantity,
        image: product.imageUrl || null,
        stockQuantity: product.stockQuantity
      })
    }
    
    this.saveCart(cart)
    return true
  }

  removeFromCart(productId: string): void {
    const cart = this.getCart()
    const filteredCart = cart.filter(item => item.id !== productId)
    this.saveCart(filteredCart)
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId)
      return
    }
    
    const cart = this.getCart()
    const item = cart.find(item => item.id === productId)
    
    if (item) {
      item.quantity = quantity
      this.saveCart(cart)
    }
  }

  getCartCount(): number {
    return this.getCart().reduce((total, item) => total + item.quantity, 0)
  }

  getTotalPrice(): number {
    return this.getCart().reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  clearCart(): void {
    this.saveCart([])
  }
}

export const cartManager = new CartManager()