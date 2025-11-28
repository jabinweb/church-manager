'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Calendar,
  User,
  Eye,
  ChevronRight,
  MessageSquare,
  Clock,
  Filter
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string | null
  slug: string
  isPublished: boolean
  publishDate: string | null
  imageUrl: string | null
  tags: string[] | null
  views: number
  createdAt: string
  author: {
    name: string | null
    email: string
    image?: string | null
  }
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('featured')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog')
      if (response.ok) {
        const data = await response.json()
        // Ensure posts is always an array with proper structure
        const safePosts = Array.isArray(data.posts) ? data.posts.map((post: any) => ({
          ...post,
          tags: Array.isArray(post.tags) ? post.tags : [],
          author: post.author || { name: null, email: '', image: null },
          content: post.content || '',
          excerpt: post.excerpt || null,
          views: post.views || 0
        })) : []
        setPosts(safePosts)
      } else {
        console.error('Failed to fetch posts:', response.status)
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  // Enhanced filtering with better null safety
  const filteredPosts = posts.filter(post => {
    if (!post || !post.id) return false
    
    const title = post.title || ''
    const excerpt = post.excerpt || ''
    const searchLower = searchTerm.toLowerCase()
    
    const matchesSearch = title.toLowerCase().includes(searchLower) ||
                         excerpt.toLowerCase().includes(searchLower)
    
    const postTags = Array.isArray(post.tags) ? post.tags : []
    const matchesTag = selectedTag === 'all' || postTags.includes(selectedTag)
    
    return matchesSearch && matchesTag && post.isPublished
  })

  // Safe tag extraction with comprehensive filtering
  const uniqueTags = Array.from(new Set(
    posts
      .filter(post => post && Array.isArray(post.tags) && post.tags.length > 0)
      .flatMap(post => post.tags)
      .filter((tag): tag is string => 
        tag !== null && 
        tag !== undefined && 
        typeof tag === 'string' && 
        tag.trim().length > 0
      )
  ))
  
  // Always ensure we have arrays, even if empty
  const featuredPosts = Array.isArray(filteredPosts) ? filteredPosts.slice(0, 3) : []
  const remainingPosts = Array.isArray(filteredPosts) ? filteredPosts.slice(3) : []
  
  // Calculate estimated reading time
  const estimateReadingTime = (content: string) => {
    if (!content || typeof content !== 'string') return 1
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500 mb-4">
            Church Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Insights, reflections, and spiritual nourishment for your journey of faith
          </p>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-100"
                />
              </div>
              
              <div className="relative inline-flex">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select 
                  value={selectedTag} 
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
                >
                  <option value="all">All Topics</option>
                  {uniqueTags
                    .filter((tag): tag is string => tag !== null)
                    .map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* View Toggle Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="featured" value={activeView} onValueChange={setActiveView} className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="featured" className="data-[state=active]:bg-white">Featured</TabsTrigger>
                <TabsTrigger value="recent" className="data-[state=active]:bg-white">Recent</TabsTrigger>
                <TabsTrigger value="popular" className="data-[state=active]:bg-white">Popular</TabsTrigger>
              </TabsList>
              
              {Array.isArray(filteredPosts) && filteredPosts.length > 0 && (
                <p className="text-sm text-gray-500">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
                </p>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !Array.isArray(filteredPosts) || filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600">
                  {posts.length === 0 ? 'No blog posts available yet.' : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            ) : (
              <>
                <TabsContent value="featured" className="mt-0">
                  {Array.isArray(featuredPosts) && featuredPosts.length > 0 && featuredPosts[0] && (
                    <>
                      {/* Featured Posts - Hero Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Main Featured Post */}
                        <div className="lg:col-span-1">
                          <div className="relative overflow-hidden rounded-xl group h-[28rem]">
                            <Link href={`/blog/${featuredPosts[0].slug}`}>
                              {/* Post Image with Gradient Overlay */}
                              {featuredPosts[0].imageUrl ? (
                                <Image 
                                  src={featuredPosts[0].imageUrl} 
                                  alt={featuredPosts[0].title}
                                  fill
                                  className="object-cover"
                                  priority
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-500"></div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 group-hover:opacity-70 transition-opacity duration-300"></div>
                              
                              {/* Content */}
                              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                <div className="flex items-center space-x-2 mb-3">
                                  {Array.isArray(featuredPosts[0].tags) && featuredPosts[0].tags.length > 0 && 
                                    featuredPosts[0].tags.slice(0, 1).map(tag => (
                                      <Badge key={tag} className="bg-white/20 hover:bg-white/30 text-white border-none">
                                        {tag}
                                      </Badge>
                                    ))
                                  }
                                </div>
                                
                                <h2 className="text-2xl font-bold mb-2 group-hover:text-white/90">
                                  {featuredPosts[0].title}
                                </h2>
                                
                                <p className="line-clamp-2 text-white/80 mb-4">
                                  {featuredPosts[0].excerpt || (featuredPosts[0].content?.substring(0, 120) || '')}...
                                </p>
                                
                                <div className="flex items-center justify-between text-white/70 text-sm">
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {featuredPosts[0].author?.name || 'Anonymous'}
                                  </span>
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(featuredPosts[0].publishDate || featuredPosts[0].createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Secondary Featured Posts */}
                        <div className="lg:col-span-1 grid grid-rows-2 gap-8">
                          {Array.isArray(featuredPosts) && featuredPosts.slice(1, 3).map((post) => (
                            <div key={post.id} className="relative overflow-hidden rounded-xl group h-52">
                              <Link href={`/blog/${post.slug}`}>
                                {/* Post Image with Gradient Overlay */}
                                {post.imageUrl ? (
                                  <Image 
                                    src={post.imageUrl} 
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-500"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 group-hover:opacity-70 transition-opacity duration-300"></div>
                                
                                {/* Content */}
                                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {Array.isArray(post.tags) && post.tags.length > 0 && 
                                      post.tags.slice(0, 1).map(tag => (
                                        <Badge key={tag} className="bg-white/20 hover:bg-white/30 text-white border-none text-xs">
                                          {tag}
                                        </Badge>
                                      ))
                                    }
                                  </div>
                                  
                                  <h3 className="text-lg font-bold mb-1 group-hover:text-white/90">
                                    {post.title}
                                  </h3>
                                  
                                  <div className="flex items-center justify-between text-white/70 text-xs">
                                    <span className="flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      {post.author?.name || 'Anonymous'}
                                    </span>
                                    <span className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(post.publishDate || post.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Regular Grid Posts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                    {Array.isArray(remainingPosts) && remainingPosts.map((post, index) => (
                      <PostCard key={post.id} post={post} index={index} estimateReadingTime={estimateReadingTime} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="recent" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                    {Array.isArray(filteredPosts) && [...filteredPosts]
                      .sort((a, b) => new Date(b.publishDate || b.createdAt).getTime() - new Date(a.publishDate || a.createdAt).getTime())
                      .map((post, index) => (
                        <PostCard key={post.id} post={post} index={index} estimateReadingTime={estimateReadingTime} />
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="popular" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                    {Array.isArray(filteredPosts) && [...filteredPosts]
                      .sort((a, b) => (b.views || 0) - (a.views || 0))
                      .map((post, index) => (
                        <PostCard key={post.id} post={post} index={index} estimateReadingTime={estimateReadingTime} />
                      ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Enhanced PostCard component with better error handling
function PostCard({ 
  post, 
  index, 
  estimateReadingTime 
}: { 
  post: BlogPost, 
  index: number, 
  estimateReadingTime: (content: string) => number 
}) {
  // Safe tag handling with comprehensive checks
  const postTags = Array.isArray(post.tags) ? post.tags.filter(tag => tag && typeof tag === 'string') : []
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/blog/${post.slug || ''}`}>
        <div className="group h-full">
          {/* Image Container */}
          <div className="relative h-56 mb-4 rounded-xl overflow-hidden">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500"></div>
            )}
            
            {/* Tags Overlay */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {postTags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} className="bg-white/80 text-gray-800 hover:bg-white border-none">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(post.publishDate || post.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {estimateReadingTime(post.content || '')} min read
              </span>
            </div>
            
            <h3 className="font-bold text-xl leading-tight group-hover:text-purple-600 transition-colors">
              {post.title}
            </h3>
            
            <p className="text-gray-600 line-clamp-2 text-sm">
              {post.excerpt || (post.content?.substring(0, 120) || '')}...
            </p>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 overflow-hidden">
                  {post.author?.image ? (
                    <Image 
                      src={post.author.image} 
                      alt={post.author.name || "Author"} 
                      width={32} 
                      height={32} 
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <span className="text-sm font-medium">
                  {post.author?.name || "Anonymous"}
                </span>
              </div>
              
              <div className="flex items-center text-purple-600 text-sm font-medium">
                <span>Read</span>
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
