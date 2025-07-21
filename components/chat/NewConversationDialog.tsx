'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Conversation, User } from './ChatLayout'

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  setSelectedConversation: (conversation: Conversation) => void
  session: any
}

export function NewConversationDialog({
  open,
  onOpenChange,
  conversations,
  setConversations,
  setSelectedConversation,
  session
}: NewConversationDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/directory')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.members?.map((member: any) => ({
          id: member.id,
          name: member.name,
          image: member.image,
          role: member.role
        })) || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.id !== session?.user?.id &&
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !conversations.some(conv => 
      conv.participants.some(p => p.id === user.id)
    )
  )

  const startNewConversation = async () => {
    if (!selectedUser) return

    try {
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.id === selectedUser.id)
      )

      if (existingConversation) {
        setSelectedConversation(existingConversation)
        onOpenChange(false)
        setSelectedUser(null)
        return
      }

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: selectedUser.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        const existingIndex = conversations.findIndex(conv => conv.id === data.conversation.id)
        
        if (existingIndex >= 0) {
          setConversations(conversations.map((conv, index) => 
            index === existingIndex ? data.conversation : conv
          ))
        } else {
          setConversations([data.conversation, ...conversations])
        }
        
        setSelectedConversation(data.conversation)
        onOpenChange(false)
        setSelectedUser(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start conversation')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Choose a church member to start messaging
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-60 h-auto overflow-y-auto space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors border",
                  selectedUser?.id === user.id
                    ? "bg-purple-100 border-purple-200"
                    : "hover:bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center space-x-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'User'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 capitalize truncate">{user.role.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="order-2 sm:order-1">
              Cancel
            </Button>
            <Button
              onClick={startNewConversation}
              disabled={!selectedUser}
              className="bg-purple-600 hover:bg-purple-700 order-1 sm:order-2"
            >
              Start Conversation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
