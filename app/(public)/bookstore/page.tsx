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
  Star,
  BookOpen,
  Music,
  Shirt,
  Gift,
  GraduationCap
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
        {/* ...existing header code... */}
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FilterIcon />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Category Filter */}
                  <div>
                    <div className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      Category
                    </div>
                    <div className="flex flex-col gap-2">
                      <FilterButton
                        active={selectedCategory === 'all'}
                        onClick={() => setSelectedCategory('all')}
                        label="All Products"
                      />
                      {categories.map((category) => (
                        <FilterButton
                          key={category.id}
                          active={selectedCategory === category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          label={category.name}
                          icon={
                            category.imageUrl ? (
                              <Image
                                src={category.imageUrl || ''}
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
                      ))}
                    </div>
                  </div>
                  {/* Price Filter */}
                  <div>
                    <div className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Price Range
                    </div>
                    <div className="px-1">
                      <Slider
                        min={minPrice}
                        max={maxPrice}
                        step={1}
                        value={priceRange}
                        onValueChange={val => setPriceRange(val as [number, number])}
                        className="accent-purple-600"
                      />
                      <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>
                  {/* Stock Filter */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stockOnly}
                      onChange={e => setStockOnly(e.target.checked)}
                      id="stockOnly"
                      className="accent-purple-600 rounded border-gray-300"
                    />
                    <label htmlFor="stockOnly" className="text-sm text-gray-700 select-none">In Stock Only</label>
                  </div>
                  {/* Sorting */}
                  <div>
                    <div className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <SortIcon />
                      Sort By
                    </div>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Name: A-Z</option>
                      <option value="name-desc">Name: Z-A</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Mobile Sidebar Trigger */}
          <div className="lg:hidden mb-6">
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="outline" onClick={() => setShowSidebar(true)}>
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FilterIcon />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        Category
                      </div>
                      <div className="flex flex-col gap-2">
                        <FilterButton
                          active={selectedCategory === 'all'}
                          onClick={() => setSelectedCategory('all')}
                          label="All Products"
                        />
                        {categories.map((category) => (
                          <FilterButton
                            key={category.id}
                            active={selectedCategory === category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            label={category.name}
                            icon={category.imageUrl ? (
                              <Image
                                src={category.imageUrl || ''}
                                alt={category.name}
                                width={16}
                                height={16}
                                className="h-4 w-4 rounded-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-4 w-4 text-purple-400" />
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Price Filter */}
                    <div>
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        Price Range
                      </div>
                      <Slider
                        min={minPrice}
                        max={maxPrice}
                        step={1}
                        value={priceRange}
                        onValueChange={val => setPriceRange(val as [number, number])}
                        className="accent-purple-600"
                      />
                      <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                    </div>
                    {/* Stock Filter */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={stockOnly}
                        onChange={e => setStockOnly(e.target.checked)}
                        id="stockOnlyMobile"
                        className="accent-purple-600 rounded border-gray-300"
                      />
                      <label htmlFor="stockOnlyMobile" className="text-sm select-none">In Stock Only</label>
                    </div>
                    {/* Sorting */}
                    <div>
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <SortIcon />
                        Sort By
                      </div>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Name: A-Z</option>
                        <option value="name-desc">Name: Z-A</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-t"></div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

// Modern filter button component
function FilterButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors border ${
        active
          ? 'bg-purple-600 text-white border-purple-600 shadow'
          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-purple-50 hover:text-purple-700'
      }`}
    >
      {icon}
      {label}
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
