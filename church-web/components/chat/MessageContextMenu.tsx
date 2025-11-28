'use client'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Reply, Copy, Edit3, Trash2 } from 'lucide-react'
import type { Message } from '@/lib/types/messaging'

interface MessageContextMenuProps {
  children: React.ReactNode
  message: Message
  isOwnMessage: boolean
  onReply: (message: Message) => void
  onCopy: (content: string) => void
  onEdit: (messageId: string) => void
  onDelete: (messageId: string) => void
}

export function MessageContextMenu({
  children,
  message,
  isOwnMessage,
  onReply,
  onCopy,
  onEdit,
  onDelete
}: MessageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onReply(message)}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCopy(message.content)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy text
        </ContextMenuItem>
        {isOwnMessage && (
          <>
            <ContextMenuItem onClick={() => onEdit(message.id)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem 
              className="text-red-600 focus:text-red-600"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
       