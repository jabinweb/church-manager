import { useState, useCallback } from 'react'
import type { Message } from '@/lib/types/messaging'

export function useChatState() {
  const [newMessage, setNewMessage] = useState('')
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<{
    id: string
    content: string
  } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const resetReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  const resetEditing = useCallback(() => {
    setEditingMessage(null)
  }, [])

  const addPendingMessage = useCallback((messageId: string) => {
    setPendingMessages(prev => new Set([...Array.from(prev), messageId]))
  }, [])

  const removePendingMessage = useCallback((messageId: string) => {
    setPendingMessages(prev => {
      const newSet = new Set(Array.from(prev))
      newSet.delete(messageId)
      return newSet
    })
  }, [])

  const handleTyping = useCallback((value: string, selectedConversation: any, sendTypingIndicator: Function) => {
    setNewMessage(value)
    
    if (!selectedConversation) return

    if (value.trim() && !isTyping) {
      setIsTyping(true)
      sendTypingIndicator(selectedConversation.id, true)
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        sendTypingIndicator(selectedConversation.id, false)
      }
    }, 2000)

    setTypingTimeout(timeout)
  }, [isTyping, typingTimeout])

  return {
    newMessage,
    setNewMessage,
    messagesLoading,
    setMessagesLoading,
    sending,
    setSending,
    isTyping,
    setIsTyping,
    typingTimeout,
    setTypingTimeout,
    pendingMessages,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    showInfo,
    setShowInfo,
    resetReply,
    resetEditing,
    addPendingMessage,
    removePendingMessage,
    handleTyping
  }
}
