'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ProductForm } from '@/components/admin/ProductForm'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description: string
  price: number
  discount: number
  images: string[]
  stock: number
  sku: string
  isActive: boolean
  categoryId: string
  category: {
    id: string
    name: string
  }
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
      const response = await fetch(`/api/admin/products/${id}`)
      if (!response.ok) throw new Error('Product not found')
      
      const data = await response.json()
      // Transform the data to match the form's expected structure
      const transformedProduct = {
        ...data,
        categoryId: data.category.id
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
