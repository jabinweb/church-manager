'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  MoreVertical, 
  ArrowLeft, 
  X, 
  Reply, 
  Trash2, 
  Smile, 
  Paperclip, 
  Phone,
  Video,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { MessageContextMenu } from './MessageContextMenu'
import { EmojiPicker } from './EmojiPicker'
import { useChatState } from './hooks/useChatState'
import { 
  getConversationName, 
  getConversationAvatar, 
  getParticipantCount, 
  getTypingUsers 
} from './utils/conversationHelpers'
import { 
  getMessageStatus, 
  renderMessageStatus, 
  createTempMessage 
} from './utils/messageHelpers'
import type { Conversation, Message } from '@/lib/types/messaging'
import { MessageItem } from './MessageItem'

interface ChatAreaProps {
  selectedConversation: Conversation | null
  setSelectedConversation: (conversation: Conversation | null) => void
  conversations: Conversation[]
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  typingUsers: Set<string>
  markAsRead: (conversationId: string) => Promise<void>
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => void
  session: any
}

export function ChatArea({
  selectedConversation,
  conversations,
  setSelectedConversation,
  setConversations,
  messages,
  setMessages,
  typingUsers,
  markAsRead,
  sendTypingIndicator,
  session
}: ChatAreaProps) {
  const {
    newMessage,
    setNewMessage,
    messagesLoading,
    setMessagesLoading,
    sending,
    setSending,
    isTyping,
    setIsTyping,
    pendingMessages,
    replyingTo,
    setReplyingTo,
    showEmojiPicker,
    setShowEmojiPicker,
    showInfo,
    setShowInfo,
    resetReply,
    addPendingMessage,
    removePendingMessage,
    handleTyping
  } = useChatState()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true)
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        await markAsRead(conversationId)
        
        setConversations((prev: Conversation[]) => prev.map((conv: Conversation) => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ))
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }, [markAsRead, setConversations, setMessages, setMessagesLoading])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 50)
    
    return () => clearTimeout(timer)
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (selectedConversation && typingUsers.size > 0) {
      const hasTypingInCurrentConversation = Array.from(typingUsers).some(userId => 
        userId !== session?.user?.id && 
        selectedConversation.participants.some(p => p.userId === userId)
      )
      
      if (hasTypingInCurrentConversation) {
        setTimeout(scrollToBottom, 150)
      }
    }
  }, [typingUsers, selectedConversation, session?.user?.id, scrollToBottom])

  useEffect(() => {
    if (selectedConversation) {
      setTimeout(scrollToBottom, 200)
    }
  }, [selectedConversation, scrollToBottom])

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedConversation) return

    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== messageId))
        toast.success('Message deleted successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message)
    messageInputRef.current?.focus()
  }

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setNewMessage(message.content)
      setReplyingTo(message)
    }
  }

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Text copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy text')
    })
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return

    const conversationType = selectedConversation.type || 'DIRECT'
    let confirmMessage = ''
    
    if (conversationType === 'DIRECT') {
      confirmMessage = 'Are you sure you want to delete this conversation? The conversation will be removed from your chat list, but you can restart it anytime by messaging this person again.'
    } else {
      confirmMessage = 'Are you sure you want to delete this conversation? This will delete it for all members and cannot be undone.'
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Conversation deleted successfully')
        
        setConversations((prev: Conversation[]) => 
          prev.filter((conv: Conversation) => conv.id !== selectedConversation.id)
        )
        
        setSelectedConversation(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    messageInputRef.current?.focus()
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !replyingTo) || !selectedConversation) return

    if (isTyping) {
      setIsTyping(false)
      sendTypingIndicator(selectedConversation.id, false)
    }

    const messageContent = newMessage.trim()
    const replyToId = replyingTo?.id || undefined
    
    const tempMessage = createTempMessage(messageContent, selectedConversation, replyingTo, session)

    setMessages((prev: Message[]) => [...prev, tempMessage])
    addPendingMessage(tempMessage.id)
    
    setNewMessage('')
    resetReply()
    setTimeout(scrollToBottom, 10)

    setSending(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: messageContent,
          replyToId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        setMessages((prev: Message[]) => prev.map((msg: Message) => 
          msg.id === tempMessage.id ? data.message : msg
        ))
        removePendingMessage(tempMessage.id)
        
        setConversations((prev: Conversation[]) => prev.map((conv: Conversation) => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: data.message, updatedAt: data.message.createdAt }
            : conv
        ))

        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 10)
      } else {
        setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== tempMessage.id))
        removePendingMessage(tempMessage.id)
        
        setNewMessage(messageContent)
        if (replyToId) {
          const replyMessage = messages.find(m => m.id === replyToId)
          if (replyMessage) setReplyingTo(replyMessage)
        }
        
        const error = await response.json()
        toast.error(error.error || 'Failed to send message')
      }
    } catch (error) {
      setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== tempMessage.id))
      removePendingMessage(tempMessage.id)
      
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleReactionToggle = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update the message with new reactions
        setMessages((prev: Message[]) => prev.map((msg: Message) => 
          msg.id === messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
        ))

      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update reaction')
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      toast.error('Failed to update reaction')
    }
  }

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p>Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  const conversationName = getConversationName(selectedConversation, session?.user?.id)
  const conversationAvatar = getConversationAvatar(selectedConversation, session?.user?.id)
  const participantCount = getParticipantCount(selectedConversation)
  const typingUsersList = getTypingUsers(selectedConversation, typingUsers, session?.user?.id)

  return (
    <div className="flex flex-col justify-between h-full relative overflow-hidden">
      {/* Chat Header */}
      <div className="p-3 md:p-4 border-b border-gray-200 bg-white flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="p-2 lg:hidden flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {/* Avatar */}
            {conversationAvatar ? (
              <Image
                src={conversationAvatar}
                alt={conversationName}
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs md:text-sm">
                  {conversationName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Conversation Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 flex items-center text-sm md:text-base truncate">
                <span className="truncate">{conversationName}</span>
                {selectedConversation.type !== 'DIRECT' && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0 hidden sm:inline">
                    {participantCount} members
                  </span>
                )}
              </h2>
              
              {/* Typing indicator or status */}
              <div className="text-xs md:text-sm text-gray-500 truncate">
                {typingUsersList.length > 0 ? (
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="truncate">
                      {typingUsersList.length === 1 
                        ? `${typingUsersList[0]} is typing...`
                        : `${typingUsersList.length} people are typing...`
                      }
                    </span>
                  </div>
                ) : selectedConversation.type === 'DIRECT' ? (
                  'Online'
                ) : (
                  <span className="truncate">{participantCount} members</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {selectedConversation.type === 'DIRECT' && (
              <>
                <Button variant="ghost" size="sm" className="p-2 hidden sm:flex">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2 hidden sm:flex">
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hidden md:flex"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                <DropdownMenuItem>Search Messages</DropdownMenuItem>
                <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={handleDeleteConversation}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="absolute inset-0 top-[80px] bottom-[80px] overflow-y-auto"
        style={{
          top: '80px',
          bottom: replyingTo ? '140px' : '80px',
        }}
      >
        <div className="flex flex-col justify-end min-h-full p-3 md:p-4 space-y-3 md:space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const messageStatus = getMessageStatus(message, selectedConversation, pendingMessages, session?.user?.id)
                const isPending = pendingMessages.has(message.id)
                
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    previousMessage={messages[index - 1]}
                    conversation={selectedConversation}
                    session={session}
                    isPending={isPending}
                    messageStatus={messageStatus}
                    onDelete={handleDeleteMessage}
                    onReply={handleReplyToMessage}
                    onEdit={handleEditMessage}
                    onCopy={handleCopyText}
                    onReactionToggle={handleReactionToggle}
                    renderMessageStatus={renderMessageStatus}
                  />
                )
              })}
              
              {/* Typing indicator */}
              {typingUsersList.length > 0 && (
                <div className="flex justify-start flex-shrink-0">
                  <div className="bg-gray-200 text-gray-900 px-3 py-2 md:px-4 md:py-2 rounded-lg">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-xs text-gray-600 ml-2">
                        {typingUsersList.length === 1 
                          ? `${typingUsersList[0]} is typing...`
                          : `${typingUsersList.length} people are typing...`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
            </>
          )}
        </div>
      </div>
      
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-3 py-2 md:px-4 md:py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Reply className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-gray-700">Replying to {replyingTo.sender?.name}</span>
              <p className="text-xs text-gray-600 truncate">{replyingTo.content}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={resetReply} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="p-3 md:p-4 border-t border-gray-200 bg-white flex-shrink-0 z-20">
        <div className="flex items-end space-x-2">
          {/* Attachment button */}
          <Button variant="ghost" size="sm" className="p-2 self-end flex-shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Message input container */}
          <div className="flex-1 relative">
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value, selectedConversation, sendTypingIndicator)}
              placeholder={replyingTo ? "Reply to message..." : "Type a message..."}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              className="flex-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10 text-sm md:text-base"
              disabled={sending}
              autoFocus={!!selectedConversation}
            />
            
            {/* Emoji picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="top">
                <EmojiPicker onEmojiSelect={addEmoji} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Send button */}
          <Button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !replyingTo) || sending}
            className="bg-purple-600 hover:bg-purple-700 self-end flex-shrink-0"
            size="sm"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            </Button>
        </div>
      </div>
    </div>
  )
}
              