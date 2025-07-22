'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Smile } from 'lucide-react'

interface EmojiPickerProps {
  isOpen: boolean
  onToggle: () => void
  onSelect: (emoji: string) => void
}

const commonEmojis = [
  '👍', '👎', '❤️', '😊', '😂', '😢', '😮', '😡', 
  '🙏', '👏', '🔥', '💯', '🎉', '🤝', '💪', '🌟'
]

export function EmojiPicker({ isOpen, onToggle, onSelect }: EmojiPickerProps) {
  return (
    <Popover open={isOpen} onOpenChange={onToggle}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Smile className="h-4 w-4 mr-1" />
          React
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji)
                onToggle()
              }}
              className="p-2 hover:bg-gray-100 rounded text-lg flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
