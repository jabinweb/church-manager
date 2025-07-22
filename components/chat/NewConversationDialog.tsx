'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/types/messaging'

interface User {
  id: string
  name: string | null
  image: string | null
  role: string
}

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversations: Conversation[]
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void
  setSelectedConversation: (conversation: Conversation | null) => void
  session: any
  conversationType?: 'direct' | 'groups' | 'broadcasts' | 'channels'
}

export function NewConversationDialog({
  open,
  onOpenChange,
  conversations,
  setConversations,
  setSelectedConversation,
  session,
  conversationType = 'direct'
}: NewConversationDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [conversationName, setConversationName] = useState('')
  const [conversationDescription, setConversationDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchUsers()
      resetForm()
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
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDialogTitle = () => {
    switch (conversationType) {
      case 'direct': return 'New Direct Message'
      case 'groups': return 'Create Group Chat'
      case 'broadcasts': return 'Create Broadcast Channel'
      case 'channels': return 'Create Topic Channel'
      default: return 'New Conversation'
    }
  }

  const getDialogDescription = () => {
    switch (conversationType) {
      case 'direct': return 'Start a private conversation with another member'
      case 'groups': return 'Create a group chat with multiple members'
      case 'broadcasts': return 'Create a broadcast channel to send announcements'
      case 'channels': return 'Create a topic-based discussion channel'
      default: return 'Create a new conversation'
    }
  }

  const resetForm = () => {
    setSelectedUsers([])
    setSearchTerm('')
    setConversationName('')
    setConversationDescription('')
  }

  const createConversation = async () => {
    if (loading) return
    setLoading(true)

    try {
      let endpoint = '/api/messages/conversations'
      let payload: any = {}

      switch (conversationType) {
        case 'direct':
          if (selectedUsers.length !== 1) {
            toast.error('Please select exactly one user for direct message')
            return
          }
          
          // Check if user is trying to start conversation with themselves
          if (selectedUsers[0].id === session?.user?.id) {
            toast.error('You cannot start a conversation with yourself')
            return
          }
          
          payload = {
            type: 'DIRECT',
            participantIds: [selectedUsers[0].id]
          }
          break

        case 'groups':
          if (!conversationName.trim()) {
            toast.error('Group name is required')
            return
          }
          payload = {
            type: 'GROUP',
            name: conversationName.trim(),
            description: conversationDescription?.trim() || null,
            participantIds: selectedUsers.map(u => u.id)
          }
          break

        case 'broadcasts':
          if (!conversationName.trim()) {
            toast.error('Broadcast channel name is required')
            return
          }
          payload = {
            type: 'BROADCAST',
            name: conversationName.trim(),
            description: conversationDescription?.trim() || null,
            settings: {
              onlyAdminsCanPost: true,
              allowReactions: true,
              allowReplies: false
            }
          }
          break

        case 'channels':
          if (!conversationName.trim()) {
            toast.error('Channel name is required')
            return
          }
          payload = {
            type: 'CHANNEL',
            name: conversationName.trim(),
            description: conversationDescription?.trim() || null,
            participantIds: selectedUsers.map(u => u.id),
            settings: {
              isPublic: true,
              allowMemberInvites: true
            }
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        
        // For direct conversations, the API might return an existing conversation
        // that was previously "deleted" by this user but is now reactivated
        setConversations((prev: Conversation[]) => {
          // Check if this conversation already exists in our list
          const existingIndex = prev.findIndex(conv => conv.id === data.conversation.id)
          if (existingIndex >= 0) {
            // Update the existing conversation
            const updated = [...prev]
            updated[existingIndex] = data.conversation
            return updated
          } else {
            // Add new conversation
            return [data.conversation, ...prev]
          }
        })
        
        setSelectedConversation(data.conversation)
        
        resetForm()
        onOpenChange(false)
        
        if (conversationType === 'direct') {
          toast.success('Conversation started successfully')
        } else if (conversationType === 'broadcasts') {
          toast.success(`Broadcast channel "${conversationName}" created successfully! All members have been notified.`)
        } else {
          toast.success(`${getDialogTitle()} created successfully`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to create ${conversationType}`)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error(`Failed to create ${conversationType}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show name input for groups, broadcasts, and channels */}
          {conversationType !== 'direct' && (
            <div>
              <Label htmlFor="conversationName">
                {conversationType === 'groups' ? 'Group Name' : 
                 conversationType === 'broadcasts' ? 'Channel Name' : 'Channel Name'}
              </Label>
              <Input
                id="conversationName"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                placeholder={
                  conversationType === 'groups' ? 'Enter group name' :
                  conversationType === 'broadcasts' ? 'Enter broadcast channel name' :
                  'Enter channel name'
                }
              />
            </div>
          )}

          {/* Show description input for groups, broadcasts, and channels */}
          {conversationType !== 'direct' && (
            <div>
              <Label htmlFor="conversationDescription">Description (Optional)</Label>
              <Textarea
                id="conversationDescription"
                value={conversationDescription}
                onChange={(e) => setConversationDescription(e.target.value)}
                placeholder="Enter a description..."
                rows={3}
              />
            </div>
          )}

          {/* Show user selection for direct messages, groups, and channels */}
          {conversationType !== 'broadcasts' && (
            <div>
              <Label>
                {conversationType === 'direct' ? 'Select User' : 'Add Members'}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-60 h-auto overflow-y-auto space-y-2 mt-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (conversationType === 'direct') {
                        setSelectedUsers([user])
                      } else {
                        setSelectedUsers((prev) => {
                          if (prev.some((u) => u.id === user.id)) {
                            return prev.filter((u) => u.id !== user.id)
                          } else {
                            return [...prev, user]
                          }
                        })
                      }
                    }}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors border",
                      selectedUsers.some((u) => u.id === user.id)
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
            </div>
          )}

          {/* Show special settings for broadcasts */}
          {conversationType === 'broadcasts' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Broadcast Channel:</strong> Only admins can send messages. 
                All active members will be automatically added and notified about this new channel.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createConversation} 
              disabled={loading || (conversationType === 'direct' && selectedUsers.length !== 1)}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create {conversationType === 'direct' ? 'Conversation' : 
                     conversationType === 'groups' ? 'Group' :
                     conversationType === 'broadcasts' ? 'Channel' : 'Channel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
