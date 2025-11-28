'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  TrendingUp,
  FileText,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface BlogPost {
  id: string
  title: string
  excerpt: string | null
  slug: string
  isPublished: boolean
  publishDate: string | null
  views: number
  tags: string[]
  imageUrl?: string | null
  createdAt: string
  author: {
    name: string | null
    email: string
  }
}

interface BlogStats {
  totalPosts: number
  publishedPosts: number
  totalViews: number
  thisMonthPosts: number
}

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBlogData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch stats first
      const statsResponse = await fetch('/api/admin/blog?mode=stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch blog stats')
      }
      const statsData = await statsResponse.json()
      
      // Ensure we have the correct structure
      if (statsData.blogPosts && Array.isArray(statsData.blogPosts)) {
        setBlogPosts(statsData.blogPosts)
      } else {
        setBlogPosts([])
      }
      
      if (statsData.stats) {
        setStats(statsData.stats)
      }
      
    } catch (err) {
      console.error('Error fetching blog data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setBlogPosts([]) // Ensure we always have an array
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlogData()
  }, [fetchBlogData])

  // Safe array access with fallback
  const safeStats = stats || {
    totalPosts: 0,
    publishedPosts: 0,
    totalViews: 0,
    thisMonthPosts: 0
  }

  const statsData = [
    { title: 'Total Posts', value: safeStats.totalPosts.toString(), icon: FileText, color: 'text-blue-600' },
    { title: 'Published', value: safeStats.publishedPosts.toString(), icon: MessageSquare, color: 'text-green-600' },
    { title: 'Total Views', value: safeStats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600' },
    { title: 'This Month', value: safeStats.thisMonthPosts.toString(), icon: TrendingUp, color: 'text-orange-600' },
  ]

  // Ensure blogPosts is always an array
  const safeBlogPosts = Array.isArray(blogPosts) ? blogPosts : []

  // Filter posts based on search and status
  const filteredPosts = safeBlogPosts.filter(post => {
    if (!post) return false
    
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && post.isPublished) ||
      (statusFilter === 'draft' && !post.isPublished)
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (isPublished: boolean) => {
    return isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = (isPublished: boolean) => {
    return isPublished ? 'Published' : 'Draft'
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading blog data: {error}</p>
          <Button onClick={fetchBlogData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">Create and manage blog posts and articles</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto" asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats - Mobile responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-6">
                <div className="h-3 lg:h-4 bg-gray-200 rounded w-16 lg:w-20 animate-pulse"></div>
                <div className="h-3 w-3 lg:h-4 lg:w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="p-3 lg:p-6 pt-0">
                <div className="h-6 lg:h-8 bg-gray-200 rounded w-12 lg:w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsData.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-6">
                <CardTitle className="text-xs lg:text-sm font-medium truncate">{stat.title}</CardTitle>
                <stat.icon className={`h-3 w-3 lg:h-4 lg:w-4 ${stat.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent className="p-3 lg:p-6 pt-0">
                <div className="text-lg lg:text-2xl font-bold truncate">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Search and Filter - Mobile responsive */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter dropdown */}
            <div className="flex items-center justify-between">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 max-w-xs"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              
              {/* Results count */}
              <span className="text-sm text-gray-500">
                {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 lg:p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm lg:text-base">Loading blog posts...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4 text-sm lg:text-base">{error}</p>
              <Button onClick={fetchBlogData} size="sm">Try Again</Button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm lg:text-base mb-4">
                {safeBlogPosts.length === 0 ? 'No blog posts found' : 'No posts match your search criteria'}
              </p>
              {safeBlogPosts.length === 0 && (
                <Button className="bg-purple-600 hover:bg-purple-700" asChild size="sm">
                  <Link href="/admin/blog/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Post
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-4 lg:p-6 border rounded-lg hover:bg-gray-50 gap-4">
                  {/* Main content */}
                  <div className="flex items-start space-x-3 lg:space-x-4 flex-1 min-w-0">
                    {/* Image thumbnail */}
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {post.imageUrl ? (
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Post details */}
                    <div className="flex-1 min-w-0">
                      {/* Title and status */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-base lg:text-lg truncate flex-1">
                          {post.title}
                        </h3>
                        <Badge className={`${getStatusColor(post.isPublished)} text-xs flex-shrink-0 w-fit`}>
                          {getStatusText(post.isPublished)}
                        </Badge>
                      </div>
                      
                      {/* Excerpt - hidden on small screens */}
                      <p className="text-gray-600 mb-2 line-clamp-2 text-sm lg:text-base hidden sm:block">
                        {post.excerpt || 'No excerpt available'}
                      </p>
                      
                      {/* Meta information */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs lg:text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{post.author?.name || 'Unknown Author'}</span>
                        </div>
                        
                        {post.publishDate && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">
                              {new Date(post.publishDate).toLocaleDateString()}
                            </span>
                            <span className="sm:hidden">
                              {new Date(post.publishDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                          <span>{post.views || 0} views</span>
                        </div>
                      </div>
                      
                      {/* Tags - hidden on mobile, shown on larger screens */}
                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="flex items-center mt-2 hidden lg:flex">
                          <span className="text-sm text-gray-500 mr-2">Tags:</span>
                          <div className="flex space-x-1 flex-wrap">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 lg:flex-col lg:items-stretch lg:w-auto w-full">
                    <Button variant="outline" size="sm" asChild className="flex-1 lg:flex-none">
                      <Link href={`/blog/${post.slug}`}>
                        <Eye className="h-4 w-4 mr-1 lg:mr-0" />
                        <span className="lg:hidden">View</span>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild className="flex-1 lg:flex-none">
                      <Link href={`/admin/blog/${post.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1 lg:mr-0" />
                        <span className="lg:hidden">Edit</span>
                      </Link>
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 flex-1 lg:flex-none">
                      <Trash2 className="h-4 w-4 mr-1 lg:mr-0" />
                      <span className="lg:hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
