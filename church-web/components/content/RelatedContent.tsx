'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommentIcon, ClockIcon } from '@/components/layout/icons'
import { useMemo, useCallback } from 'react'

// Base interface with minimal required properties
export interface BaseContentItem {
  id: string
  title: string
  slug: string
  imageUrl?: string | null
}

// Type guard for checking if a value is a valid date string
function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return !isNaN(Date.parse(value))
}

// Type guard function for safely checking properties
function hasProperty<K extends string>(obj: unknown, prop: K): obj is Record<K, unknown> {
  return obj !== null && typeof obj === 'object' && prop in obj;
}

interface RelatedContentProps {
  items: BaseContentItem[]
  basePath: string
  title?: string
  emptyMessage?: string
  getReadingTime?: (content: string) => number
}

export default function RelatedContent({
  items,
  basePath,
  title = 'Related Content',
  emptyMessage = 'No related content found',
  getReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
}: RelatedContentProps) {
  const router = useRouter()

  // Helper function to safely format dates - memoized to prevent re-renders
  const formatDate = useCallback((item: any): string => {
    try {
      // Check for various date fields with proper type validation
      if (hasProperty(item, 'publishDate') && isValidDateString(item.publishDate)) {
        return format(new Date(item.publishDate), 'MMM dd, yyyy');
      }
      
      if (hasProperty(item, 'date') && isValidDateString(item.date)) {
        return format(new Date(item.date), 'MMM dd, yyyy');
      }
      
      if (hasProperty(item, 'createdAt') && isValidDateString(item.createdAt)) {
        return format(new Date(item.createdAt), 'MMM dd, yyyy');
      }
      
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, []);

  // Helper function to get category or series name - memoized
  const getCategoryName = useCallback((item: any): string | undefined => {
    if (
      hasProperty(item, 'category') &&
      item.category &&
      hasProperty(item.category, 'name') &&
      typeof item.category.name === 'string'
    ) {
      return item.category.name;
    }
    
    if (hasProperty(item, 'series') && typeof item.series === 'string') {
      return item.series;
    }
    
    return undefined;
  }, []);

  // Helper function to get excerpt or description - memoized
  const getDescription = useCallback((item: any): string => {
    if (hasProperty(item, 'excerpt') && item.excerpt) {
      return item.excerpt as string;
    }
    
    if (hasProperty(item, 'description') && item.description) {
      return item.description as string;
    }
    
    return item.title;
  }, []);

  // Helper function to determine if item has duration - memoized with dependency on getReadingTime
  const getDuration = useCallback((item: any): React.ReactNode => {
    if (hasProperty(item, 'content') && typeof item.content === 'string') {
      return (
        <span className="flex items-center">
          <ClockIcon size={14} className="mr-1" />
          {getReadingTime(item.content)} min read
        </span>
      );
    }
    
    if (hasProperty(item, 'duration') && item.duration !== null && item.duration !== undefined) {
      return (
        <span className="flex items-center">
          <ClockIcon size={14} className="mr-1" />
          {String(item.duration)}
        </span>
      );
    }
    
    return null;
  }, [getReadingTime]);

  // Memoize the card rendering to prevent unnecessary rerenders
  const renderedItems = useMemo(() => {
    return items.map((item) => (
      <Card 
        key={item.id} 
        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
        onClick={() => router.push(`${basePath}/${item.slug}`)}
      >
        <div className="h-48 relative">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-r from-purple-100 to-blue-100">
              <CommentIcon size={32} className="text-purple-300" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          {/* Category/Series Badge */}
          {getCategoryName(item) && (
            <Badge variant="outline" className="mb-2">
              {getCategoryName(item)}
            </Badge>
          )}
          
          <h4 className="font-bold text-lg line-clamp-2 mb-2 hover:text-purple-600">
            {item.title}
          </h4>
          
          {/* Description */}
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">
            {getDescription(item)}
          </p>
          
          <div className="flex justify-between items-center text-sm text-gray-500">
            {/* Date */}
            <span>{formatDate(item)}</span>
            
            {/* Duration or Reading Time */}
            {getDuration(item)}
          </div>
        </CardContent>
      </Card>
    ));
  }, [items, basePath, router, formatDate, getCategoryName, getDescription, getDuration]);

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.length > 0 ? (
          renderedItems
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-10 bg-gray-50 rounded-lg">
            <CommentIcon size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
