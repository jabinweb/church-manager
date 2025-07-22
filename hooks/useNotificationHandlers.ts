import { useEffect } from 'react'
import type { LegacyConversation, LegacyMessage } from '@/components/chat/ChatLayout'

interface UseNotificationHandlersProps {
  session: any
  conversations: LegacyConversation[]
  showMessageNotification: (message: LegacyMessage) => void
  setSelectedConversation: (conversation: LegacyConversation | null) => void
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
          {
            ...message,
            sender: {
              ...message.sender,
              name: senderName,
              image: sender.image || undefined
            }
          }
        )
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
            
      if (type === 'new_message' && data?.message) {
        const message = data.message
        const isReceived = message.receiverId === session?.user?.id
        
        
        if (isReceived) {
          const sender = message.sender
          const senderName = sender.name || 'Someone'
                    
          showMessageNotification(
            {
              ...message,
              sender: {
                ...message.sender,
                name: senderName,
                image: sender.image || undefined
              }
            }
          )
        }
      }
    }
       
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
