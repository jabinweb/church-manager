'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Star, Eye, BookOpen, Music, Shirt, Gift, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cartManager } from '@/lib/cart'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number | string
  category: string
  imageUrl?: string | null
  stockQuantity: number
  isActive: boolean
  tags: string[]
}

interface ProductCardProps {
  product: Product
  index: number
}

export default function ProductCard({ product, index }: { product: any, index: number }) {
  const router = useRouter()
  const { currencySymbol, currency } = useSystemSettings()
  const [showPrice, setShowPrice] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    // Only show price when currencySymbol is loaded and not the default '$' (unless USD)
    if (currencySymbol && (currencySymbol !== '$' || currency === 'USD')) {
      setShowPrice(true)
    }
  }, [currencySymbol, currency])

  // Convert price to number safely
  const price = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price) || 0
  const stock = product.stockQuantity || 0
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.debug('Add to cart clicked', { id: product.id, name: product.name, price, stock })

    if (stock === 0) {
      toast.error('Product is out of stock')
      return
    }

    try {
      const success = cartManager.addToCart({
        id: product.id,
        name: product.name,
        price: price,
        stockQuantity: stock,
        imageUrl: product.imageUrl || null
      }, 1)
      // Force a cart update event for all listeners (including CartSidebar)
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      console.debug('cartManager.addToCart result:', success)
      if (success) {
        toast.success(`${product.name} added to cart!`)
      } else {
        toast.error('Not enough stock available')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    }
  }

  const handleCardClick = () => {
    router.push(`/bookstore/${product.id}`)
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/bookstore/${product.id}`)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BOOK': return BookOpen
      case 'MUSIC': return Music
      case 'APPAREL': return Shirt
      case 'GIFTS': return Gift
      case 'STUDY_MATERIALS': return GraduationCap
      default: return BookOpen
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'BOOK': return 'Books'
      case 'MUSIC': return 'Music'
      case 'APPAREL': return 'Apparel'
      case 'GIFTS': return 'Gifts'
      case 'STUDY_MATERIALS': return 'Study Materials'
      default: return category
    }
  }

  const CategoryIcon = getCategoryIcon(product.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card 
        className="h-full hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer hover:scale-[1.02]"
        onClick={handleCardClick}
      >
        <div className="relative overflow-hidden">
          {/* 16:9 aspect ratio container */}
          <div className="w-full aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center relative">
            {product.imageUrl && !imageError ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index < 3}
              />
            ) : (
              <CategoryIcon className="h-16 w-16 text-purple-400/60" />
            )}
            
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          
          <div className="absolute top-2 right-2 flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs ml-1 font-medium">4.5</span>
          </div>
          
          {stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
            </div>
          )}
          
          <Badge variant="outline" className="absolute bottom-2 right-2 text-xs bg-white/90 backdrop-blur-sm">
            <CategoryIcon className="h-3 w-3 mr-1" />
            {getCategoryName(product.category)}
          </Badge>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {product.description || 'No description available'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-green-700">
              {showPrice
                ? `${currencySymbol}${Number(product.price).toFixed(2)}`
                : <span className="inline-block w-8 h-5 bg-gray-200 animate-pulse rounded" />}
            </span>
            <span className="text-sm text-gray-500">
              Stock: <span className={stock > 0 ? 'text-green-600' : 'text-red-600'}>{stock}</span>
            </span>
          </div>
          
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleViewDetails}
              className="px-3"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

