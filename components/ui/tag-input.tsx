'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagInputProps {
  placeholder?: string
  tags: string[]
  setTags: (tags: string[]) => void
  disabled?: boolean
  maxTags?: number
  className?: string
}

export function TagInput({
  placeholder = 'Add a tag...',
  tags,
  setTags,
  disabled = false,
  maxTags = 10,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key press
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault()
      addTag(inputValue)
    }
    
    // Handle backspace to remove last tag
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
    
    // Handle comma to add tag
    if (e.key === ',') {
      e.preventDefault()
      const value = inputValue.trim()
      if (value) {
        addTag(value)
      }
    }
  }

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase()
    
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < maxTags) {
      setTags([...tags, normalizedTag])
      setInputValue('')
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {tag}
          <button
            type="button"
            className="ml-1 text-muted-foreground hover:text-foreground"
            onClick={() => removeTag(index)}
            disabled={disabled}
          >
            <X size={14} />
            <span className="sr-only">Remove tag</span>
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length < maxTags ? placeholder : `Max ${maxTags} tags`}
        disabled={disabled || tags.length >= maxTags}
        className="flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  )
}
