'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Heart, MessageCircle, MoreVertical, Edit, Trash2, Reply } from 'lucide-react'
import { toast } from 'sonner'
import { LikeButton } from './LikeButton'

interface Comment {
  id: string
  content: string
  createdAt: string
  isEdited: boolean
  editedAt?: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  replies?: Comment[]
  likes?: Array<{ id: string; type: string; userId: string }> | null
  _count?: {
    likes: number
    replies: number
  } | null
}

interface CommentItemProps {
  comment: Comment
  contentType: 'sermon' | 'blog'
  contentId: string
  onUpdate: (comment: Comment) => void
  onDelete: (commentId: string) => void
  getInitials: (name: string | null) => string
  isReply?: boolean
}

export function CommentItem({ 
  comment, 
  contentType, 
  contentId, 
  onUpdate, 
  onDelete, 
  getInitials,
  isReply = false 
}: CommentItemProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const isAuthor = session?.user?.id === comment.author.id
  const isAdmin = ['ADMIN', 'PASTOR'].includes(session?.user?.role as string)

  // Safe access to comment data with defaults
  const likes = comment.likes || []
  const likeCount = comment._count?.likes || 0
  const replyCount = comment._count?.replies || 0

  const handleEdit = async () => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (!response.ok) throw new Error('Failed to update comment')

      const data = await response.json()
      onUpdate(data.comment)
      setIsEditing(false)
      toast.success('Comment updated successfully!')
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete comment')

      onDelete(comment.id)
      toast.success('Comment deleted successfully!')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim() || !session) return

    setSubmittingReply(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          [`${contentType}Id`]: contentId,
          parentId: comment.id
        })
      })

      if (!response.ok) throw new Error('Failed to create reply')

      // Refresh comments to show new reply
      setReplyContent('')
      setShowReplyForm(false)
      toast.success('Reply posted successfully!')
    } catch (error) {
      console.error('Error submitting reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  return (
    <div className={`space-y-3 ${isReply ? 'ml-10 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.author.image || ''} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-gray-500">
              {format(new Date(comment.createdAt), 'MMM d, yyyy')}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-2">
            <LikeButton
              contentType="comment"
              contentId={comment.id}
              likes={likes}
              likeCount={likeCount}
            />

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-gray-500 hover:text-gray-700 p-0 h-auto"
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}

            {replyCount > 0 && !isReply && (
              <span className="text-sm text-gray-500">
                {replyCount} repl{replyCount === 1 ? 'y' : 'ies'}
              </span>
            )}

            {(isAuthor || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {isAuthor && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && session && !isReply && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleReply}
                  disabled={!replyContent.trim() || submittingReply}
                >
                  {submittingReply ? 'Posting...' : 'Reply'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              contentType={contentType}
              contentId={contentId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              getInitials={getInitials}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
