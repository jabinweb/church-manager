'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Plus, 
  UserCheck, 
  UserX,
  User,
  Heart,
  Book,
  Star,
  ChevronRight,
  Filter,
  Loader2,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'

interface SmallGroup {
  id: string
  name: string
  description: string | null
  meetingDay: string
  meetingTime: string
  location: string | null
  capacity: number | null
  isActive: boolean
  leader: {
    id: string
    name: string | null
    image: string | null
  }
  members: {
    id: string
    user: {
      id: string
      name: string | null
      image: string | null
    }
    joinedAt: string
    isActive: boolean
  }[]
  _count: {
    members: number
  }
}

interface JoinRequest {
  id: string
  groupId: string
  userId: string
  message: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  group: {
    name: string
  }
}

export default function MyGroupsPage() {
  const { data: session } = useSession()
  const [myGroups, setMyGroups] = useState<SmallGroup[]>([])
  const [availableGroups, setAvailableGroups] = useState<SmallGroup[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState('all')
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<SmallGroup | null>(null)
  const [joinMessage, setJoinMessage] = useState('')
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    meetingDay: '',
    meetingTime: '',
    location: '',
    capacity: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [managedGroups, setManagedGroups] = useState<SmallGroup[]>([])
  const [manageGroupOpen, setManageGroupOpen] = useState(false)
  const [selectedManagedGroup, setSelectedManagedGroup] = useState<SmallGroup | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyGroups()
      fetchAvailableGroups()
      fetchJoinRequests()
      
      // Only fetch managed groups if user has permission
      if (['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)) {
        fetchManagedGroups()
      }
    }
  }, [session])

  const fetchMyGroups = async () => {
    try {
      const response = await fetch('/api/groups/my-groups')
      if (response.ok) {
        const data = await response.json()
        setMyGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching my groups:', error)
      toast.error('Failed to load your groups')
    }
  }

  const fetchAvailableGroups = async () => {
    try {
      const response = await fetch('/api/groups/available')
      if (response.ok) {
        const data = await response.json()
        setAvailableGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching available groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJoinRequests = async () => {
    try {
      const response = await fetch('/api/groups/join-requests')
      if (response.ok) {
        const data = await response.json()
        setJoinRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching join requests:', error)
    }
  }

  const fetchManagedGroups = async () => {
    try {
      const response = await fetch('/api/groups/my-managed')
      if (response.ok) {
        const data = await response.json()
        setManagedGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching managed groups:', error)
    }
  }

  const handleJoinGroup = async () => {
    if (!selectedGroup) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          message: joinMessage.trim()
        })
      })

      if (response.ok) {
        toast.success('Join request sent successfully!')
        setJoinDialogOpen(false)
        setJoinMessage('')
        setSelectedGroup(null)
        fetchJoinRequests()
        fetchAvailableGroups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send join request')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      toast.error('Failed to send join request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.meetingDay || !newGroup.meetingTime) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreatingGroup(true)
    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })

      if (response.ok) {
        toast.success('Group created successfully!')
        setCreateGroupOpen(false)
        setNewGroup({
          name: '',
          description: '',
          meetingDay: '',
          meetingTime: '',
          location: '',
          capacity: ''
        })
        fetchManagedGroups()
        fetchAvailableGroups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group')
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to leave this group?')) return

    try {
      const response = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      })

      if (response.ok) {
        toast.success('Left group successfully')
        fetchMyGroups()
        fetchAvailableGroups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to leave group')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      toast.error('Failed to leave group')
    }
  }

  const filteredAvailableGroups = availableGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDay = selectedDay === 'all' || group.meetingDay.toLowerCase() === selectedDay.toLowerCase()
    return matchesSearch && matchesDay
  })

  const openJoinDialog = (group: SmallGroup) => {
    setSelectedGroup(group)
    setJoinDialogOpen(true)
  }

  const openManageGroupDialog = (group: SmallGroup) => {
    setSelectedManagedGroup(group)
    setManageGroupOpen(true)
  }

  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      'Monday': 'bg-blue-100 text-blue-800',
      'Tuesday': 'bg-green-100 text-green-800',
      'Wednesday': 'bg-purple-100 text-purple-800',
      'Thursday': 'bg-orange-100 text-orange-800',
      'Friday': 'bg-red-100 text-red-800',
      'Saturday': 'bg-indigo-100 text-indigo-800',
      'Sunday': 'bg-yellow-100 text-yellow-800'
    }
    return colors[day] || 'bg-gray-100 text-gray-800'
  }

  const canCreateGroups = session?.user?.role && ['ADMIN', 'PASTOR', 'STAFF'].includes(session.user.role as string)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                My Small Groups
              </h1>
              <p className="text-gray-600 mt-2">Connect, grow, and fellowship together</p>
            </div>
            <div className="flex items-center space-x-4">
              {canCreateGroups && (
                <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Small Group</DialogTitle>
                      <DialogDescription>
                        Create a new small group for your church community
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="groupName">Group Name *</Label>
                        <Input
                          id="groupName"
                          value={newGroup.name}
                          onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                          placeholder="Enter group name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="groupDescription">Description</Label>
                        <Textarea
                          id="groupDescription"
                          value={newGroup.description}
                          onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                          placeholder="Describe the group's purpose and activities"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="meetingDay">Meeting Day *</Label>
                          <select
                            id="meetingDay"
                            value={newGroup.meetingDay}
                            onChange={(e) => setNewGroup({...newGroup, meetingDay: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select day</option>
                            <option value="Sunday">Sunday</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor="meetingTime">Meeting Time *</Label>
                          <Input
                            id="meetingTime"
                            type="time"
                            value={newGroup.meetingTime}
                            onChange={(e) => setNewGroup({...newGroup, meetingTime: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newGroup.location}
                          onChange={(e) => setNewGroup({...newGroup, location: e.target.value})}
                          placeholder="Meeting location"
                        />
                      </div>

                      <div>
                        <Label htmlFor="capacity">Capacity (Optional)</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          value={newGroup.capacity}
                          onChange={(e) => setNewGroup({...newGroup, capacity: e.target.value})}
                          placeholder="Maximum members"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateGroup}
                          disabled={creatingGroup}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {creatingGroup ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Group
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Member of</p>
                <p className="text-2xl font-bold text-purple-600">{myGroups.length} Groups</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Managed Groups Section (for leaders) */}
        {canCreateGroups && managedGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Settings className="h-6 w-6 mr-2 text-green-600" />
              Groups I Lead
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managedGroups.map((group) => (
                <Card key={group.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-900">{group.name}</CardTitle>
                        <CardDescription className="mt-1">
                          Leader: You
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Leader
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-green-500" />
                        {group.meetingDay}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-green-500" />
                        {group.meetingTime}
                      </div>
                      {group.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-green-500" />
                          {group.location}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-green-500" />
                        {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                        {group.capacity && ` (max ${group.capacity})`}
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-3">
                          {group.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-4">
                        <span className="text-sm text-gray-500">
                          {(group as any).joinRequests?.length || 0} pending requests
                        </span>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openManageGroupDialog(group)}
                        >
                          Manage Group
                          <Settings className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* My Groups Section */}
        {myGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map((group) => (
                <Card key={group.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-900">{group.name}</CardTitle>
                        <CardDescription className="mt-1">
                          Led by {group.leader.name}
                        </CardDescription>
                      </div>
                      <Badge className={getDayColor(group.meetingDay)}>
                        {group.meetingDay}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        {group.meetingTime}
                      </div>
                      {group.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                          {group.location}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-purple-500" />
                        {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                        {group.capacity && ` (max ${group.capacity})`}
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-3">
                          {group.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveGroup(group.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Leave Group
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Join Requests Status */}
        {joinRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-800">Pending Join Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {joinRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{request.group.name}</p>
                        <p className="text-sm text-gray-500">
                          Requested on {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Available Groups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Join a Group</h2>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Days</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  {filteredAvailableGroups.length} groups available
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Groups Grid */}
          {filteredAvailableGroups.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups available</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedDay !== 'all' 
                    ? 'Try adjusting your search criteria' 
                    : 'Check back later for new groups'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-gray-900">{group.name}</CardTitle>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                              <Star className="h-3 w-3 text-purple-600" />
                            </div>
                            <span>Led by {group.leader.name}</span>
                          </div>
                        </div>
                        <Badge className={getDayColor(group.meetingDay)}>
                          {group.meetingDay}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-purple-500" />
                          {group.meetingTime}
                        </div>
                        {group.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                            {group.location}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-purple-500" />
                          {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                          {group.capacity && (
                            <span className="ml-1">
                              (max {group.capacity})
                              {group._count.members >= group.capacity && (
                                <Badge variant="outline" className="ml-2 text-red-600 border-red-200">
                                  Full
                                </Badge>
                              )}
                            </span>
                          )}
                        </div>
                        
                        {group.description && (
                          <p className="text-sm text-gray-600 line-clamp-3 mt-3">
                            {group.description}
                          </p>
                        )}

                        <div className="pt-4">
                          <Button
                            onClick={() => openJoinDialog(group)}
                            disabled={group.capacity ? group._count.members >= group.capacity : false}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Request to Join
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Join Group Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join {selectedGroup?.name}</DialogTitle>
              <DialogDescription>
                Send a request to join this small group. The group leader will review your request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedGroup && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                      {selectedGroup.meetingDay} at {selectedGroup.meetingTime}
                    </div>
                    {selectedGroup.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                        {selectedGroup.location}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      Led by {selectedGroup.leader.name}
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="joinMessage">Message to Group Leader (Optional)</Label>
                <Textarea
                  id="joinMessage"
                  placeholder="Tell the leader why you'd like to join this group..."
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleJoinGroup}
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Group Dialog */}
        <Dialog open={manageGroupOpen} onOpenChange={setManageGroupOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage {selectedManagedGroup?.name}</DialogTitle>
              <DialogDescription>
                Manage members and join requests for your group
              </DialogDescription>
            </DialogHeader>
            {selectedManagedGroup && (
              <div className="space-y-6">
                {/* Group Info */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-500" />
                      {selectedManagedGroup.meetingDay} at {selectedManagedGroup.meetingTime}
                    </div>
                    {selectedManagedGroup.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-green-500" />
                        {selectedManagedGroup.location}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-green-500" />
                      {selectedManagedGroup._count.members} members
                    </div>
                    {selectedManagedGroup.capacity && (
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-green-500" />
                        Capacity: {selectedManagedGroup.capacity}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Join Requests */}
                {(selectedManagedGroup as any).joinRequests?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pending Join Requests</h3>
                    <div className="space-y-3">
                      {(selectedManagedGroup as any).joinRequests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{request.user.name}</h4>
                              <p className="text-sm text-gray-500">{request.user.email}</p>
                              {request.message && (
                                <p className="text-sm text-gray-600 mt-1 italic">&quot;{request.message}&quot;</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Requested on {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <UserX className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Members */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Current Members</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedManagedGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.user.name}</p>
                            <p className="text-xs text-gray-500">
                              Joined {format(new Date(member.joinedAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setManageGroupOpen(false)}>
                    Close
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Group Settings
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
