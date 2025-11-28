'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  ShoppingCart,
  BookOpen,
} from 'lucide-react'
import Image from 'next/image'
import ProductCard from '@/components/shop/ProductCard'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { DollarSign } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: any // Prisma Decimal type
  categoryId?: string | null
  category?: {
    id: string
    name: string
  } | null
  imageUrl: string | null
  stockQuantity: number
  isActive: boolean
  tags: string[]
}

interface Category {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
}

export default function BookstorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [stockOnly, setStockOnly] = useState(true)
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('relevance')

  // Calculate min/max price for slider
  const minPrice = Math.min(...products.map(p => Number(p.price) || 0), 0)
  const maxPrice = Math.max(...products.map(p => Number(p.price) || 0), 1000)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/settings/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories?.filter((c: Category) => c.isActive) || [])
      }
    } catch (error) {
      // fallback: no categories
      setCategories([])
    }
  }

  let filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory =
      selectedCategory === 'all' ||
      (product.category && product.category.id === selectedCategory) ||
      (product.categoryId && product.categoryId === selectedCategory)
    const price = Number(product.price) || 0
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1]
    const matchesStock = !stockOnly || product.stockQuantity > 0
    return matchesSearch && matchesCategory && matchesPrice && matchesStock && product.isActive
  })

  // Sorting logic
  if (sortBy === 'price-asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => Number(a.price) - Number(b.price))
  } else if (sortBy === 'price-desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => Number(b.price) - Number(a.price))
  } else if (sortBy === 'name-asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy === 'name-desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.name.localeCompare(a.name))
  }
  // 'relevance' is default (no sort)

  return (
    <div className="min-h-screen py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {/* <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Church Bookstore
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover books, music, and resources to deepen your faith journey
          </p>
        </motion.div> */}

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                    <Search className="h-5 w-5 text-purple-500" />
                    Search & Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search Section */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-3">
                    <div className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      Categories
                    </div>
                    <div className="space-y-1">
                      <FilterButton
                        active={selectedCategory === 'all'}
                        onClick={() => setSelectedCategory('all')}
                        label="All Products"
                        count={products.length}
                      />
                      {categories.map((category) => {
                        const count = products.filter(p => p.categoryId === category.id).length
                        return (
                          <FilterButton
                            key={category.id}
                            active={selectedCategory === category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            label={category.name}
                            count={count}
                            icon={
                              category.imageUrl ? (
                                <Image
                                  src={category.imageUrl}
                                  alt={category.name}
                                  width={16}
                                  height={16}
                                  className="h-4 w-4 rounded-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-4 w-4 text-purple-400" />
                              )
                            }
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="space-y-3">
                    <div className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Price Range
                    </div>
                    <div className="px-2">
                      <Slider
                        min={minPrice}
                        max={maxPrice}
                        step={10}
                        value={priceRange}
                        onValueChange={val => setPriceRange(val as [number, number])}
                        className="w-full"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          ₹{priceRange[0]}
                        </div>
                        <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          ₹{priceRange[1]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Filters */}
                  <div className="space-y-3">
                    <div className="font-medium text-gray-700 text-sm">Options</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={stockOnly}
                          onChange={e => setStockOnly(e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">In Stock Only</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {products.filter(p => p.stockQuantity > 0).length}
                        </Badge>
                      </label>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-3">
                    <div className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                      <SortIcon className="h-4 w-4 text-blue-500" />
                      Sort By
                    </div>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                    >
                      <option value="relevance">Most Relevant</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Name: A to Z</option>
                      <option value="name-desc">Name: Z to A</option>
                    </select>
                  </div>

                  {/* Results Count */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 text-center">
                      <span className="font-medium text-purple-600">{filteredProducts.length}</span> products found
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden w-full">
            <div className="mb-6 flex gap-3">
              <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Search className="mr-2 h-4 w-4" />
                    Search & Filter
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <div className="py-4">
                    <h2 className="text-lg font-semibold mb-4">Search & Filters</h2>
                    {/* Same filter content as desktop but in mobile sheet */}
                    <div className="space-y-6">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {/* Category Filter */}
                      <div className="space-y-3">
                        <div className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-purple-500" />
                          Categories
                        </div>
                        <div className="space-y-1">
                          <FilterButton
                            active={selectedCategory === 'all'}
                            onClick={() => setSelectedCategory('all')}
                            label="All Products"
                            count={products.length}
                          />
                          {categories.map((category) => {
                            const count = products.filter(p => p.categoryId === category.id).length
                            return (
                              <FilterButton
                                key={category.id}
                                active={selectedCategory === category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                label={category.name}
                                count={count}
                                icon={
                                  category.imageUrl ? (
                                    <Image
                                      src={category.imageUrl}
                                      alt={category.name}
                                      width={16}
                                      height={16}
                                      className="h-4 w-4 rounded-full object-cover"
                                    />
                                  ) : (
                                    <BookOpen className="h-4 w-4 text-purple-400" />
                                  )
                                }
                              />
                            )
                          })}
                        </div>
                      </div>

                      {/* Price Filter */}
                      <div className="space-y-3">
                        <div className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          Price Range
                        </div>
                        <Slider
                          min={minPrice}
                          max={maxPrice}
                          step={10}
                          value={priceRange}
                          onValueChange={val => setPriceRange(val as [number, number])}
                          className="w-full"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            ₹{priceRange[0]}
                          </div>
                          <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            ₹{priceRange[1]}
                          </div>
                        </div>
                      </div>

                      {/* Additional Filters */}
                      <div className="space-y-3">
                        <div className="font-medium text-gray-700 text-sm">Options</div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={stockOnly}
                              onChange={e => setStockOnly(e.target.checked)}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">In Stock Only</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {products.filter(p => p.stockQuantity > 0).length}
                            </Badge>
                          </label>
                        </div>
                      </div>

                      {/* Sort Options */}
                      <div className="space-y-3">
                        <div className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                          <SortIcon className="h-4 w-4 text-blue-500" />
                          Sort By
                        </div>
                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                        >
                          <option value="relevance">Most Relevant</option>
                          <option value="price-asc">Price: Low to High</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="name-asc">Name: A to Z</option>
                          <option value="name-desc">Name: Z to A</option>
                        </select>
                      </div>

                      {/* Results Count */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 text-center">
                          <span className="font-medium text-purple-600">{filteredProducts.length}</span> products found
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Badge variant="outline" className="flex items-center gap-1 px-3">
                {filteredProducts.length} results
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1">
            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-gray-200 rounded-t"></div>
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filter selection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      price: Number(product.price) || 0,
                      category: product.category?.name || '',
                    }}
                    index={index}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

// Updated FilterButton component
function FilterButton({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-purple-50 text-purple-700 border border-purple-200'
          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        {label}
      </div>
      {count !== undefined && (
        <Badge 
          variant="outline" 
          className={`text-xs ${active ? 'border-purple-300 text-purple-600' : 'border-gray-300'}`}
        >
          {count}
        </Badge>
      )}
    </button>
  )
}

// Simple filter and sort icons
function FilterIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" className={`h-5 w-5 ${props.className || ''}`}>
      <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function SortIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" className={`h-5 w-5 ${props.className || ''}`}>
      <path d="M6 8l4-4 4 4M6 12l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
