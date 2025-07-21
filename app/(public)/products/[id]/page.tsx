'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Star, Truck, Shield, RefreshCw, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cartManager } from '@/lib/cart'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  discount: number
  images: string[]
  stock: number
  sku: string
  category: {
    id: string
    name: string
  }
  stockQuantity?: number // Add for cart compatibility
  imageUrl?: string | null // Add for cart compatibility
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${id}`)
      if (!response.ok) throw new Error('Product not found')
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const getDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount / 100)
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    setAddingToCart(true)
    try {
      // Map product fields to match cart manager expectations
      const cartProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images[0] || null,
        stockQuantity: product.stock
      }
      const success = cartManager.addToCart(cartProduct, quantity)
      if (success) {
        toast.success(`${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart!`)
      } else {
        toast.error('Not enough stock available')
      }
    } catch (error) {
      toast.error('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    
    setAddingToCart(true)
    try {
      // Map product fields to match cart manager expectations
      const cartProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images[0] || null,
        stockQuantity: product.stock
      }
      const success = cartManager.addToCart(cartProduct, quantity)
      if (success) {
        toast.success('Item added to cart!')
        router.push('/checkout')
      } else {
        toast.error('Not enough stock available')
      }
    } catch (error) {
      toast.error('Failed to proceed to checkout')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile-friendly Breadcrumb */}
        <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-8 overflow-x-auto">
          <Link href="/products" className="hover:text-gray-700 whitespace-nowrap">Products</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category.id}`} className="hover:text-gray-700 whitespace-nowrap truncate max-w-20 sm:max-w-none">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-24 sm:max-w-none">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Product Images - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-2 sm:space-y-4">
              <div className="relative overflow-hidden rounded-lg bg-white">
                <Image
                  src={product.images[selectedImage] || 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg'}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                />
                {product.discount > 0 && (
                  <Badge className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-red-500 text-xs sm:text-sm">
                    {product.discount}% OFF
                  </Badge>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Details - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 sm:space-y-6"
          >
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <Badge variant="outline" className="self-start">
                  {product.category.name}
                </Badge>
                <span className="text-xs sm:text-sm text-gray-500">SKU: {product.sku}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-gray-500">(4.5 out of 5)</span>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            <Separator />

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {product.discount > 0 ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold text-green-600">
                      ₹{getDiscountedPrice(product.price, product.discount).toFixed(2)}
                    </span>
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      ₹{product.price.toFixed(2)}
                    </span>
                    <Badge className="bg-red-500 text-xs sm:text-sm">Save {product.discount}%</Badge>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ₹{product.price.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Stock:</span>
                <Badge variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'} className="text-xs sm:text-sm">
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </Badge>
              </div>

              {product.stock > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium text-sm sm:text-base">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full text-sm sm:text-base"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingToCart}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-sm sm:text-base" 
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0 || addingToCart}
                >
                  {addingToCart ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>

              {product.stock <= 5 && product.stock > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    ⚠️ Only {product.stock} items left in stock!
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Features - Mobile Stacked */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="text-xs sm:text-sm">Easy Returns</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}