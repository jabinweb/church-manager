'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import ImageUpload from './ImageUpload'

interface Product {
  id?: string
  name: string
  description: string | null
  price: number
  sku: string | null
  slug?: string | null
  imageUrl: string | null
  stockQuantity: number
  isActive: boolean
  categoryId: string | null
  tags: string[]
  authorId?: string | null
}

interface ProductCategory {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

interface ProductFormProps {
  product?: Product
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: null,
    price: 0,
    sku: null,
    imageUrl: null,
    stockQuantity: 0,
    isActive: true,
    categoryId: null,
    tags: [],
    ...product
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/admin/shop/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories')
        toast.error('Failed to load categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData(prev => ({ ...prev, tags }))
  }

  const generateSKU = () => {
    if (!formData.name) {
      toast.error('Please enter a product name first')
      return
    }
    
    const prefix = formData.name.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    const generatedSKU = `${prefix}-${timestamp}`
    
    setFormData(prev => ({ ...prev, sku: generatedSKU }))
    toast.success('SKU generated successfully')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return
    }
    
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0')
      return
    }

    setLoading(true)

    try {
      const url = product 
        ? `/api/admin/shop/products/${product.id}` 
        : '/api/admin/shop/products'
      
      const method = product ? 'PUT' : 'POST'

      // Prepare data for API - match schema exactly
      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: Number(formData.price),
        sku: formData.sku?.trim() || null,
        imageUrl: formData.imageUrl,
        stockQuantity: Number(formData.stockQuantity),
        isActive: formData.isActive,
        categoryId: formData.categoryId || null,
        tags: formData.tags
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save product')
      }

      toast.success(`Product ${product ? 'updated' : 'created'} successfully`)
      router.push('/admin/shop/products')
    } catch (error) {
      console.error('Product save error:', error)
      toast.error(error instanceof Error ? error.message : `Failed to ${product ? 'update' : 'create'} product`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Product'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="sku"
                      value={formData.sku || ''}
                      onChange={(e) => handleInputChange('sku', e.target.value || null)}
                      placeholder="Enter SKU (optional)"
                    />
                    <Button type="button" variant="outline" onClick={generateSKU}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.categoryId || 'none'} 
                    onValueChange={(value) => handleInputChange('categoryId', value === 'none' ? null : value)}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories
                        .filter(cat => cat.isActive)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.imageUrl || ''}
                onChange={(url) => handleInputChange('imageUrl', url)}
                onRemove={() => handleInputChange('imageUrl', null)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Active Status</Label>
                  <p className="text-sm text-gray-500">
                    {formData.isActive ? 'Product is visible to customers' : 'Product is hidden from customers'}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {formData.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Product Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = formData.tags.filter((_, i) => i !== index)
                          handleInputChange('tags', newTags)
                        }}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}
                  
