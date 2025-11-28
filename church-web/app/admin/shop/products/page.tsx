'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Plus, Edit, Trash2, MoreHorizontal, Download, Package } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'

interface Product {
  id: string
  name: string
  price: number | string
  stockQuantity: number
  isActive: boolean
  imageUrl?: string | null
  tags: string[]
  categoryId?: string | null
  category?: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  
  // Get currency and symbol from system settings (same as ProductCard)
  const { currencySymbol, currency } = useSystemSettings()
  const [showPrice, setShowPrice] = useState(false)

  useEffect(() => {
    // Only show price when currencySymbol is loaded and not the default '$' (unless USD)
    if (currencySymbol && (currencySymbol !== '$' || currency === 'USD')) {
      setShowPrice(true)
    }
  }, [currencySymbol, currency])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/admin/shop/products?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      
      // Ensure products is always an array with proper structure
      const safeProducts = Array.isArray(data.products) ? data.products.map((product: any) => ({
        ...product,
        price: Number(product.price) || 0,
        stockQuantity: Number(product.stockQuantity) || 0,
        tags: Array.isArray(product.tags) ? product.tags : [],
        imageUrl: product.imageUrl || null,
        category: product.category || null
      })) : []
      
      setProducts(safeProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
      setProducts([]) // Ensure products is always an array
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [fetchProducts])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product')
      return
    }

    setBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/shop/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts,
          action
        })
      })

      if (!response.ok) throw new Error('Bulk action failed')

      toast.success(`Successfully ${action}d ${selectedProducts.length} products`)
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      toast.error(`Failed to ${action} products`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/admin/shop/products/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')

      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const getProductImage = (product: Product) => {
    if (product.imageUrl) {
      return product.imageUrl
    }
    return 'https://placehold.co/80x80/7c3aed/white?text=Product'
  }

  const formatPrice = (price: number | string) => {
    const numPrice = Number(price) || 0
    
    if (!showPrice) {
      return <span className="inline-block w-16 h-5 bg-gray-200 animate-pulse rounded" />
    }

    return `${currencySymbol}${numPrice.toFixed(2)}`
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 text-sm lg:text-base">Manage your product catalog</p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
          <Link href="/admin/shop/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Cards - Mobile responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center">
              <Package className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
              <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Total Products</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center">
              <Package className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 flex-shrink-0" />
              <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Active</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center">
              <Package className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600 flex-shrink-0" />
              <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Low Stock</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stockQuantity <= 5).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-6">
            <div className="flex items-center">
              <Package className="h-6 w-6 lg:h-8 lg:w-8 text-red-600 flex-shrink-0" />
              <div className="ml-2 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Out of Stock</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stockQuantity === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 lg:p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <CardTitle className="text-lg lg:text-xl">All Products</CardTitle>
            
            {/* Mobile: Stack controls vertically */}
            <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-2">
              {/* Bulk Actions - Mobile responsive */}
              {selectedProducts.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 p-3 bg-blue-50 rounded-lg lg:bg-transparent lg:p-0">
                  <span className="text-sm text-gray-500 text-center sm:text-left">
                    {selectedProducts.length} selected
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('activate')}
                      disabled={bulkActionLoading}
                      className="flex-1 sm:flex-none"
                    >
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('deactivate')}
                      disabled={bulkActionLoading}
                      className="flex-1 sm:flex-none"
                    >
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                      disabled={bulkActionLoading}
                      className="text-red-600 flex-1 sm:flex-none"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Search and Export */}
              <div className="flex space-x-2">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 lg:p-6 lg:pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading products...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4 text-sm lg:text-base">
                {search ? 'Try adjusting your search criteria.' : 'Get started by adding your first product.'}
              </p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/admin/shop/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={getProductImage(product)}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = 'https://placehold.co/48x48/7c3aed/white?text=P'
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{product.name}</p>
                              {Array.isArray(product.tags) && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {product.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {product.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{product.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">
                            {formatPrice(product.price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              product.stockQuantity > 10 
                                ? 'default' 
                                : product.stockQuantity > 0 
                                ? 'secondary' 
                                : 'destructive'
                            }
                          >
                            {product.stockQuantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/shop/products/${product.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {products.map((product) => (
                  <Card key={product.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                          className="mt-1 flex-shrink-0"
                        />
                        
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://placehold.co/64x64/7c3aed/white?text=P'
                            }}
                          />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                              <p className="text-sm text-gray-500 truncate">
                                {product.category?.name || 'Uncategorized'}
                              </p>
                            </div>
                            
                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/shop/products/${product.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Tags */}
                          {Array.isArray(product.tags) && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {product.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{product.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Price, Stock, Status */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm font-bold text-green-600">
                                  {formatPrice(product.price)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Stock</p>
                                <Badge 
                                  variant={
                                    product.stockQuantity > 10 
                                      ? 'default' 
                                      : product.stockQuantity > 0 
                                      ? 'secondary' 
                                      : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {product.stockQuantity}
                                </Badge>
                              </div>
                            </div>
                            
                            <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-xs">
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
