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
      
      console.log('New message event received:', { 
        message, 
        isReceived, 
        currentUserId: session?.user?.id,
        receiverId: message.receiverId,
        senderId: message.senderId 
      })
           
      if (isReceived && message.receiverId === session?.user?.id) {
        const sender = message.sender
        const senderName = sender.name || 'Someone'        
        
        console.log('Triggering notification for message from:', senderName)
        
        showMessageNotification(
          senderName,
          message.content,
          sender.image || undefined,
          message.conversationId
        ).then((notification) => {
          console.log('Notification shown successfully:', notification)
        }).catch((error) => {
          console.error('Failed to show notification:', error)
        })
      } else {
        console.log('Not showing notification:', {
          isReceived,
          messageReceiverId: message.receiverId,
          currentUserId: session?.user?.id
        })
      }
    }

    const handleNotificationClick = (event: CustomEvent) => {
      const { type, conversationId } = event.detail
      
      console.log('Notification clicked:', { type, conversationId })
      
      if (type === 'message' && conversationId) {
        const conversation = conversations.find(conv => conv.id === conversationId)
        if (conversation) {
          setSelectedConversation(conversation)
          console.log('Selected conversation from notification:', conversation.id)
        }
      }
    }

    const handleSSEMessage = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      console.log('Direct SSE message received:', { type, data })
      
      if (type === 'new_message' && data?.message) {
        const message = data.message
        const isReceived = message.receiverId === session?.user?.id
        
        console.log('Processing SSE new_message:', { 
          message, 
          isReceived,
          currentUserId: session?.user?.id 
        })
        
        if (isReceived) {
          const sender = message.sender
          const senderName = sender.name || 'Someone'
          
          console.log('Triggering SSE notification for message from:', senderName)
          
          showMessageNotification(
            senderName,
            message.content,
            sender.image || undefined,
            message.conversationId
          ).then((notification) => {
            console.log('SSE notification shown successfully:', notification)
          }).catch((error) => {
            console.error('Failed to show SSE notification:', error)
          })
        }
      }
    }
   
    console.log('Setting up notification event listeners for user:', session?.user?.id)
    
    window.addEventListener('newMessageReceived', handleNewMessageReceived as EventListener)
    window.addEventListener('notificationClick', handleNotificationClick as EventListener)
    window.addEventListener('sseMessage', handleSSEMessage as EventListener)
    
    return () => {
      console.log('Cleaning up notification event listeners')
      window.removeEventListener('newMessageReceived', handleNewMessageReceived as EventListener)
      window.removeEventListener('notificationClick', handleNotificationClick as EventListener)
      window.removeEventListener('sseMessage', handleSSEMessage as EventListener)
    }
  }, [showMessageNotification, session?.user?.id, conversations, setSelectedConversation])
}
