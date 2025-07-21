import { useEffect } from 'react'
import type { Conversation } from '@/components/chat/ChatLayout'

interface UseNotificationHandlersProps {
  session: any
  conversations: Conversation[]
  showMessageNotification: (senderName: string, message: string, senderImage?: string, conversationId?: string) => Promise<Notification | null>
  setSelectedConversation: (conversation: Conversation | null) => void
}

export function useNotificationHandlers({
  session,
  conversations,
  showMessageNotification,
  setSelectedConversation
}: UseNotificationHandlersProps) {
  useEffect(() => {
    const handleNewMessageReceived = (event: CustomEvent) => {
      const { message, isReceived } = event.detail
           
      if (isReceived && message.receiverId === session?.user?.id) {
        const sender = message.sender
        const senderName = sender.name || 'Someone'        
        
        showMessageNotification(
          senderName,
          message.content,
          sender.image || undefined,
          message.conversationId
        ).catch((error) => {
          console.error('Failed to show notification:', error)
        })
      }
    }

    const handleNotificationClick = (event: CustomEvent) => {
      const { type, conversationId } = event.detail
      
      if (type === 'message' && conversationId) {
        const conversation = conversations.find(conv => conv.id === conversationId)
        if (conversation) {
          setSelectedConversation(conversation)
        }
      }
    }

    const handleSSEMessage = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      if (type === 'new_message' && data?.message) {
        const message = data.message
        const isReceived = message.receiverId === session?.user?.id
        
        if (isReceived) {
          const sender = message.sender
          const senderName = sender.name || 'Someone'
          
          showMessageNotification(
            senderName,
            message.content,
            sender.image || undefined,
            message.conversationId
          ).catch((error) => {
            console.error('Failed to show SSE notification:', error)
          })
        }
      }
    }
   
    window.addEventListener('newMessageReceived', handleNewMessageReceived as EventListener)
    window.addEventListener('notificationClick', handleNotificationClick as EventListener)
    window.addEventListener('sseMessage', handleSSEMessage as EventListener)
    
    return () => {
      window.removeEventListener('newMessageReceived', handleNewMessageReceived as EventListener)
      window.removeEventListener('notificationClick', handleNotificationClick as EventListener)
      window.removeEventListener('sseMessage', handleSSEMessage as EventListener)
    }
  }, [showMessageNotification, session?.user?.id, conversations, setSelectedConversation])
}
