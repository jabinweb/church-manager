'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️']
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export const EmojiPicker = memo(({ onEmojiSelect }: EmojiPickerProps) => {
  return (
    <div className="grid grid-cols-8 gap-1 p-3 max-h-48 overflow-y-auto">
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category} className="col-span-8">
          <h4 className="text-xs font-medium text-gray-600 mb-2">{category}</h4>
          <div className="grid grid-cols-8 gap-1 mb-3">
            {emojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 text-lg hover:bg-gray-100"
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

EmojiPicker.displayName = 'EmojiPicker'

EmojiPicker.displayName = 'EmojiPicker'

