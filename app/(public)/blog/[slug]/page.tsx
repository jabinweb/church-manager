'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useScroll, useTransform } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TooltipProvider } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { CommentIcon, ArrowLeftIcon } from '@/components/icons'

// Import shared components
import HeroHeader from '@/components/content/HeroHeader'
import ContentActions from '@/components/content/ContentActions'
import AuthorBio from '@/components/content/AuthorBio'
import RelatedContent from '@/components/content/RelatedContent'

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt?: string | null
  slug: string
  authorId: string
  author?: {
    name: string | null
    image: string | null
    email?: string | null
  } | null
  isPublished: boolean
  publishDate?: string | null
  imageUrl?: string | null
  tags: string[]
  views: number
  createdAt: string
  updatedAt: string
  categoryId?: string | null
  category?: {
    name: string
  } | null
}

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function getInitials(name: string): string {
  if (!name) return 'GC';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : ''
  
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [emailSubscription, setEmailSubscription] = useState('')

  // Fix for hydration issue with useScroll
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Use a separate state to track if the component is mounted
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Always call hooks unconditionally, even if we don't use their values immediately
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end start"]
  })
  
  // Always create transforms unconditionally
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.05])
  const titleOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])
  const titleY = useTransform(scrollYProgress, [0, 0.1], [0, -50])

  // Reading progress
  const [readingProgress, setReadingProgress] = useState(0)
  
  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const totalHeight = element.clientHeight - window.innerHeight;
      const windowScrollTop = window.scrollY || document.documentElement.scrollTop;
      
      if (windowScrollTop === 0) {
        setReadingProgress(0);
        return;
      }
      
      if (windowScrollTop > element.offsetTop) {
        const scrolled = windowScrollTop - element.offsetTop;
        const progress = Math.min(scrolled / totalHeight, 1) * 100;
        setReadingProgress(progress);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  useEffect(() => {
    if (!slug) return
    
    const fetchBlogPost = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`)
        if (!res.ok) throw new Error('Failed to fetch blog post')
        
        const data = await res.json()
        setBlogPost(data.post)
        
        // Increment view count
        fetch(`/api/blog/${slug}/view`, { method: 'POST' }).catch(() => {})
        
        // Fetch related posts from the same category
        if (data.post.categoryId) {
          const relatedRes = await fetch(
            `/api/blog?category=${data.post.categoryId}&limit=3&exclude=${data.post.id}`
          )
          if (relatedRes.ok) {
            const relatedData = await relatedRes.json()
            setRelatedPosts(relatedData.posts || [])
          }
        }
      } catch (error) {
        console.error('Error fetching blog post:', error)
        setBlogPost(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBlogPost()
  }, [slug])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubscription) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    toast.success('Thank you for subscribing to our newsletter!');
    setEmailSubscription('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 animate-pulse">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 px-6">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-full inline-flex mb-4">
                <CommentIcon size={32} className="text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Blog Post Not Found</h1>
              <p className="text-gray-500 mb-6">The blog post you&apos;re looking for does not exist or has been removed.</p>
              <Button onClick={() => router.push('/blog')} className="bg-purple-600 hover:bg-purple-700">
                <ArrowLeftIcon size={16} className="mr-2" />
                Back to Blog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const readingTime = estimateReadingTime(blogPost.content);
  const publicationDate = blogPost.publishDate || blogPost.createdAt;
  const formattedDate = format(new Date(publicationDate), 'MMMM dd, yyyy');

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div ref={contentRef} className="relative w-full h-full">
          {/* Reading Progress Bar */}
          {mounted && (
            <div 
              className="h-1 bg-purple-500 fixed top-16 left-0 z-50 transition-all duration-300 ease-out"
              style={{ width: `${readingProgress}%` }}
            />
          )}
          
          {/* Hero Header Component */}
          <HeroHeader 
            title={blogPost.title}
            imageUrl={blogPost.imageUrl}
            author={blogPost.author}
            date={publicationDate}
            formattedDate={formattedDate}
            category={blogPost.category}
            categoryId={blogPost.categoryId}
            duration={readingTime}
            views={blogPost.views}
            backLink="/blog"
            backLinkText="Back to Blog"
            heroOpacity={heroOpacity}
            heroScale={heroScale}
            titleOpacity={titleOpacity}
            titleY={titleY}
            mounted={mounted}
            getInitials={getInitials}
          />

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Left Sidebar - Social Sharing */}
              <div className="lg:w-16 hidden lg:block">
                <ContentActions 
                  title={blogPost.title}
                  vertical={true}
                />
              </div>
              
              {/* Main Content */}
              <div className="lg:flex-1 max-w-4xl">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6 md:p-10">
                    {/* Mobile sharing buttons */}
                    <ContentActions 
                      title={blogPost.title}
                      vertical={false}
                      backLink="/blog"
                      onBack={() => router.push('/blog')}
                    />
                    
                    {/* Blog content */}
                    <article className="prose lg:prose-lg max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
                    </article>
                    
                    {/* Tags */}
                    {blogPost.tags && blogPost.tags.length > 0 && (
                      <div className="mt-10">
                        <h4 className="text-sm text-gray-500 mb-2">Tagged with:</h4>
                        <div className="flex flex-wrap gap-2">
                          {blogPost.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="px-3 py-1 hover:bg-purple-50 transition-colors cursor-pointer"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Author Bio Component */}
                    <AuthorBio
                      name={blogPost.author?.name}
                      image={blogPost.author?.image}
                      role="Pastor and Community Leader"
                      bio="Passionate about bringing the community together through faith and service. Has been serving at our church for over 10 years and loves to teach about finding joy in everyday life through spiritual practices."
                      getInitials={getInitials}
                    />
                  </CardContent>
                </Card>
                
                {/* Related Posts Component */}
                <RelatedContent 
                  items={relatedPosts}
                  basePath="/blog"
                  title="Related Articles"
                  emptyMessage="No related articles found"
                  getReadingTime={estimateReadingTime}
                />
              </div>
              
              {/* Right Sidebar */}
              <div className="lg:w-80 mt-8 lg:mt-0">
                <div className="sticky top-24 space-y-8">
                  {/* Newsletter Subscription */}
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="h-3 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-500"></div>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">Subscribe to our Newsletter</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Get notified about new articles and church updates.
                      </p>
                      
                      <form onSubmit={handleSubscribe} className="space-y-2">
                        <Input
                          type="email"
                          placeholder="Your email address"
                          value={emailSubscription}
                          onChange={(e) => setEmailSubscription(e.target.value)}
                          className="bg-gray-50"
                          required
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Subscribe
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  {/* Featured Categories */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Categories</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/blog/category/faith')}>
                          <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                          Faith & Spirituality
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/blog/category/community')}>
                          <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                          Community
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/blog/category/discipleship')}>
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          Discipleship
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/blog/category/family')}>
                          <span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
                          Family Life
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/blog/category/ministry')}>
                          <span className="h-2 w-2 rounded-full bg-pink-500 mr-2"></span>
                          Ministry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Popular Tags */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Prayer', 'Bible Study', 'Worship', 'Community', 'Faith', 'Family', 'Service', 'Outreach', 'Discipleship', 'Hope'].map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="px-3 py-1 bg-gray-100 hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
                 