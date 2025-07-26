'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CommentItem } from './CommentItem'
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

interface CommentSectionProps {
  contentType: 'sermon' | 'blog'
  contentId: string
  initialCommentCount?: number
}

export function CommentSection({ contentType, contentId, initialCommentCount = 0 }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [contentId, sortBy])

  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1)
      const params = new URLSearchParams({
        [`${contentType}Id`]: contentId,
        page: pageNum.toString(),
        sortBy,
        limit: '10'
      })

      const response = await fetch(`/api/comments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch comments')

      const data = await response.json()
      
      if (pageNum === 1) {
        setComments(data.comments)
      } else {
        setComments(prev => [...prev, ...data.comments])
      }
      
      setHasMore(data.pagination.page < data.pagination.pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          [`${contentType}Id`]: contentId
        })
      })

      if (!response.ok) throw new Error('Failed to create comment')

      const data = await response.json()
      setComments(prev => [data.comment, ...prev])
      setNewComment('')
      toast.success('Comment posted successfully!')
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateComment = (updatedComment: Comment) => {
    setComments(prev => prev.map(comment => 
      comment.id === updatedComment.id ? updatedComment : comment
    ))
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {session ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={session.user?.image || ''} />
                <AvatarFallback className="text-xs">
                  {getInitials(session.user?.name || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="min-h-[80px] resize-none"
                  disabled={submitting}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {newComment.length}/500 characters
                  </p>
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || submitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-3">Please sign in to join the conversation</p>
            <Button variant="outline">Sign In</Button>
          </div>
        )}

        {/* Sort Options */}
        {comments.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-gray-600">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No comments yet</h3>
              <p className="text-gray-500">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                contentType={contentType}
                contentId={contentId}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                getInitials={getInitials}
              />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && !loading && comments.length > 0 && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => fetchComments(page + 1)}
              className="w-full"
            >
              Load More Comments
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
