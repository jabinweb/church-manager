'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  sku: string | null
  slug: string | null
  imageUrl: string | null
  stockQuantity: number
  isActive: boolean
  categoryId: string | null
  tags: string[]
  category?: {
    id: string
    name: string
  } | null
}

export default function EditProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/shop/products/${id}`)
      if (!response.ok) throw new Error('Product not found')
      
      const data = await response.json()
      // Transform the data to match the form's expected structure
      const transformedProduct = {
        id: data.id,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        sku: data.sku,
        slug: data.slug,
        imageUrl: data.imageUrl,
        stockQuantity: data.stockQuantity,
        isActive: data.isActive,
        categoryId: data.categoryId,
        tags: data.tags || [],
        category: data.category
      }
      setProduct(transformedProduct)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <p className="text-gray-600">The product you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600">Update product information</p>
      </div>
      
      <ProductForm product={product} />
    </div>
  )
}
