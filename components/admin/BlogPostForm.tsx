'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { TagInput } from '@/components/ui/tag-input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Loader2, Eye, Code, Save, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Editor } from '@/components/editor'
import ImageUpload from '@/components/admin/ImageUpload'

// Define the blog post schema for validation
const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, with no spaces (use hyphens instead)',
  }),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().nullable().optional(),
  isPublished: z.boolean().default(false),
  publishDate: z.date().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().nullable().optional(),
})

type BlogPostFormValues = z.infer<typeof blogPostSchema>

interface Category {
  id: string
  name: string
}

interface BlogPostFormProps {
  postId?: string // Optional: If provided, we're editing an existing post
}

export default function BlogPostForm({ postId }: BlogPostFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [activeTab, setActiveTab] = useState('edit')
  const isEditing = !!postId

  // Initialize form with default values
  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      isPublished: false,
      publishDate: null,
      imageUrl: null,
      tags: [],
      categoryId: null,
    },
  })

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/settings/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // If postId is provided, fetch the post data
  useEffect(() => {
    if (!postId) return

    const fetchPost = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/blog/${postId}`)
        if (!response.ok) throw new Error('Failed to fetch post')
        
        const data = await response.json()
        const post = data.post
        
        // Format the data for the form
        form.reset({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt || '',
          isPublished: post.isPublished,
          publishDate: post.publishDate ? new Date(post.publishDate) : null,
          imageUrl: post.imageUrl,
          tags: post.tags || [],
          categoryId: post.categoryId || null,
        })
        
        // Set preview content
        setPreviewContent(post.content)
      } catch (error) {
        console.error('Error fetching post:', error)
        toast.error('Failed to load post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [postId, form])

  // Handle form submission
  async function onSubmit(values: BlogPostFormValues) {
    setIsLoading(true)
    try {
      const endpoint = isEditing 
        ? `/api/admin/blog/${postId}` 
        : '/api/admin/blog'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      // Convert "none" back to null for categoryId
      const finalValues = {
        ...values,
        categoryId: values.categoryId === "none" ? null : values.categoryId,
      };
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalValues),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Something went wrong')
      }

      toast.success(isEditing ? 'Post updated successfully' : 'Post created successfully')
      router.push('/admin/blog')
      router.refresh()
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save post')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    form.setValue('title', title)
    
    // Only auto-generate slug if it's a new post or the slug hasn't been manually edited
    if (!isEditing || !form.getValues('slug')) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
      
      form.setValue('slug', slug)
    }
  }

  // Handle content changes for preview
  const handleContentChange = (value: string) => {
    form.setValue('content', value)
    setPreviewContent(value)
  }

  // Handle image upload
  const handleImageUploaded = (url: string) => {
    form.setValue('imageUrl', url)
  }

  return (
    <div className="mx-auto md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/blog')}
            className="mb-2"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Blog Posts
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => router.push('/admin/blog')}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {isLoading && !form.formState.isSubmitting ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <Form {...form}>
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main content area (2/3 width on desktop) */}
              <div className="md:col-span-2 space-y-6">
                {/* Title & slug fields */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Post Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter post title"
                                {...field}
                                onChange={handleTitleChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="enter-post-slug" 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be used for the post URL
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Content editor with tabs */}
                <Card>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between px-6 pt-6">
                      <h3 className="text-lg font-semibold">Content</h3>
                      <TabsList>
                        <TabsTrigger value="edit" onClick={() => setActiveTab('edit')}>
                          <Code size={16} className="mr-2" />
                          Edit
                        </TabsTrigger>
                        <TabsTrigger value="preview" onClick={() => setActiveTab('preview')}>
                          <Eye size={16} className="mr-2" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <CardContent className="pt-4">
                      <TabsContent value="edit" className="mt-0">
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Editor
                                  value={field.value}
                                  onChange={handleContentChange}
                                  placeholder="Write your post content here..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      
                      <TabsContent value="preview" className="mt-0">
                        <div className="min-h-[400px] p-4 border rounded-md bg-white prose max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>

                {/* Excerpt */}
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Excerpt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief summary of your post (optional)"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            This will be displayed in post listings and SEO descriptions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar (1/3 width on desktop) */}
              <div className="space-y-6">
                {/* Featured Image */}
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value || ''}
                              onChange={handleImageUploaded}
                              onRemove={() => form.setValue('imageUrl', null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Publication settings */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Publication Settings</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Published</FormLabel>
                              <FormDescription>
                                Make this post publicly visible
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="publishDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Publish Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              Schedule when this post should be published
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Categories & Tags */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              value={field.value || ''} 
                              onValueChange={field.onChange}
                              disabled={isLoadingCategories}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem> {/* Changed empty string to "none" */}
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Separator />
                      
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <TagInput
                                placeholder="Add tags..."
                                tags={field.value || []}
                                setTags={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Press enter to add a tag
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
