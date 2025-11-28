'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, CommentIcon } from '@/components/layout/icons'
import { useRouter } from 'next/navigation'

interface Author {
  name?: string | null
  image?: string | null
  email?: string | null
}

interface Category {
  name: string
}

export interface HeroHeaderProps {
  title: string
  imageUrl?: string | null
  author?: Author | null
  date: string
  formattedDate: string
  category?: Category | null
  categoryId?: string | null
  duration?: number | string | null
  views?: number
  backLink: string
  backLinkText?: string
  heroOpacity?: any // motion value
  heroScale?: any // motion value
  titleOpacity?: any // motion value
  titleY?: any // motion value
  mounted: boolean
  getInitials?: (name: string) => string
}

export default function HeroHeader({
  title,
  imageUrl,
  author,
  date,
  formattedDate,
  category,
  categoryId,
  duration,
  views,
  backLink,
  backLinkText = 'Back',
  heroOpacity,
  heroScale,
  titleOpacity,
  titleY,
  mounted,
  getInitials = (name) => {
    if (!name) return 'GC';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}: HeroHeaderProps) {
  const router = useRouter()
  const defaultImage = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1374&auto=format&fit=crop'
  
  return (
    <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
      {mounted ? (
        <motion.div
          style={{ 
            opacity: heroOpacity,
            scale: heroScale
          }}
          className="absolute inset-0"
        >
          <Image
            src={imageUrl || defaultImage}
            alt={title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        </motion.div>
      ) : (
        <div className="absolute inset-0">
          <Image
            src={imageUrl || defaultImage}
            alt={title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        </div>
      )}
      
      {mounted && titleOpacity && titleY ? (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-8 md:pb-16 max-w-5xl mx-auto"
          style={{
            opacity: titleOpacity,
            y: titleY
          }}
        >
          {renderContent()}
        </motion.div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-8 md:pb-16 max-w-5xl mx-auto">
          {renderContent()}
        </div>
      )}
    </div>
  )

  function renderContent() {
    return (
      <>
        {/* Breadcrumb */}
        <div className="flex items-center text-white/80 text-sm mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 p-1"
            onClick={() => router.push(backLink)}
          >
            <ArrowLeftIcon size={18} className="mr-2" />
            {backLinkText}
          </Button>
          {category && (
            <div className="flex items-center">
              <span className="mx-2">/</span>
              <Badge 
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  if (categoryId) {
                    router.push(`${backLink}/category/${categoryId}`);
                  }
                }}
              >
                {category.name}
              </Badge>
            </div>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          {title}
        </h1>
        
        <div className="flex items-center flex-wrap gap-6">
          {/* Author */}
          {author && (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 border-2 border-white">
                {author.image ? (
                  <AvatarImage src={author.image} />
                ) : (
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {getInitials(author.name || 'Anonymous')}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="ml-3">
                <p className="text-white font-medium leading-tight">
                  {author.name || 'Anonymous'}
                </p>
                <div className="flex items-center text-white/70 text-xs">
                  <CalendarIcon size={12} className="mr-1" />
                  {formattedDate}
                </div>
              </div>
            </div>
          )}
          
          {/* Post Meta */}
          <div className="flex items-center space-x-4 text-white/80 text-sm">
            {duration && (
              <div className="flex items-center">
                <ClockIcon size={16} className="mr-1" />
                <span>{typeof duration === 'number' ? `${duration} min read` : duration}</span>
              </div>
            )}
            {views !== undefined && (
              <div className="flex items-center">
                <CommentIcon size={16} className="mr-1" />
                <span>{views} views</span>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }
}
