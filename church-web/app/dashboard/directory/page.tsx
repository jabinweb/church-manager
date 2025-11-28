'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  Mail,
  Phone,
  MessageCircle,
  Filter,
  Loader2,
  Calendar,
  Crown,
  Shield,
  UserCheck,
  Grid3X3,
  List,
  BookOpen
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'

interface DirectoryMember {
  id: string
  name: string | null
  email: string
  image: string | null
  role: 'ADMIN' | 'PASTOR' | 'STAFF' | 'MEMBER' | 'CUSTOMER'
  phone: string | null
  joinDate: string
  isActive: boolean
  memberProfile?: {
    skills: string[]
    interests: string[]
    ministryInvolvement: string[]
  }
  smallGroupMembers: Array<{
    smallGroup: {
      id: string
      name: string
    }
  }>
}

export default function DirectoryPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [members, setMembers] = useState<DirectoryMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<DirectoryMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedMinistry, setSelectedMinistry] = useState('all')
  const [ministries, setMinistries] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchMembers()
  }, [])

  const filterMembers = useCallback(() => {
    let filtered = members.filter(member => {
      const matchesSearch = 
        (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.memberProfile?.skills?.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        (member.memberProfile?.interests?.some(interest => 
          interest.toLowerCase().includes(searchTerm.toLowerCase())
        ))

      const matchesRole = selectedRole === 'all' || member.role === selectedRole
      const matchesMinistry = selectedMinistry === 'all' || 
        member.memberProfile?.ministryInvolvement?.includes(selectedMinistry)

      return matchesSearch && matchesRole && matchesMinistry && member.isActive
    })

    // Sort by role priority and then by name
    filtered.sort((a, b) => {
      const rolePriority = { ADMIN: 1, PASTOR: 2, STAFF: 3, MEMBER: 4, CUSTOMER: 5 }
      const aPriority = rolePriority[a.role] || 6
      const bPriority = rolePriority[b.role] || 6
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      return (a.name || '').localeCompare(b.name || '')
    })

    setFilteredMembers(filtered)
  }, [members, searchTerm, selectedRole, selectedMinistry])

  useEffect(() => {
    filterMembers()
  }, [filterMembers])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/directory')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
        
        // Extract unique ministries for filter
        const allMinistries = new Set<string>()
        data.members?.forEach((member: DirectoryMember) => {
          member.memberProfile?.ministryInvolvement?.forEach(ministry => {
            allMinistries.add(ministry)
          })
        })
        setMinistries(Array.from(allMinistries).sort())
      }
    } catch (error) {
      console.error('Error fetching directory:', error)
      toast.error('Failed to load directory')
    } finally {
      setLoading(false)
    }
  }

  const handleCall = (phone: string | null) => {
    if (!phone) {
      toast.error('Phone number not available')
      return
    }
    window.open(`tel:${phone}`, '_self')
  }

  const handleMessage = async (member: DirectoryMember) => {
    try {
      // Create conversation and redirect to messages
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DIRECT',
          participantIds: [member.id]
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Create conversation response:', data)
        const conversationId = data.conversation?.id
        console.log('Conversation ID:', conversationId)
        // Store conversation ID in sessionStorage for the messages page to pick up
        if (conversationId) {
          sessionStorage.setItem('openConversation', conversationId)
          console.log('Stored in sessionStorage:', sessionStorage.getItem('openConversation'))
        }
        // Use window.location for hard navigation to ensure fresh component mount
        window.location.href = '/dashboard/messages'
      } else {
        const errorData = await response.json()
        console.error('Failed to create conversation:', errorData)
        toast.error('Failed to start conversation')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank')
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'PASTOR': return <BookOpen className="h-4 w-4 text-purple-500" />
      case 'STAFF': return <Shield className="h-4 w-4 text-blue-500" />
      case 'MEMBER': return <UserCheck className="h-4 w-4 text-green-500" />
      default: return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800'
      case 'PASTOR': return 'bg-purple-100 text-purple-800'
      case 'STAFF': return 'bg-blue-100 text-blue-800'
      case 'MEMBER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Church Directory
              </h1>
              <p className="text-gray-600 mt-2">Connect with fellow church members</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-blue-600">{filteredMembers.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-0 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 border-0 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="all">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PASTOR">Pastor</option>
                    <option value="STAFF">Staff</option>
                    <option value="MEMBER">Member</option>
                  </select>

                  <select
                    value={selectedMinistry}
                    onChange={(e) => setSelectedMinistry(e.target.value)}
                    className="px-4 py-2 border-0 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="all">All Ministries</option>
                    {ministries.map((ministry) => (
                      <option key={ministry} value={ministry}>{ministry}</option>
                    ))}
                  </select>

                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-50 rounded-xl p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-9 w-9 p-0 rounded-lg transition-all ${
                        viewMode === 'grid' 
                          ? 'bg-blue-600 shadow-lg' 
                          : 'hover:bg-white'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-9 w-9 p-0 rounded-lg transition-all ${
                        viewMode === 'list' 
                          ? 'bg-blue-600 shadow-lg' 
                          : 'hover:bg-white'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                    <Filter className="h-4 w-4 mr-2" />
                    {filteredMembers.length} members
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Members Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='overflow-y-auto max-h-[65vh] h-auto'
        >
          {filteredMembers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No members found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedRole !== 'all' || selectedMinistry !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'The directory is currently empty'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white overflow-hidden relative">
                    {/* Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                    
                    <CardContent className="relative p-6">
                      {/* Header with Avatar and Role Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {/* Enhanced Avatar */}
                          <div className="relative">
                            {member.image ? (
                              <Image
                                src={member.image}
                                alt={member.name || 'Member'}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white">
                                <span className="text-white font-bold text-xl">
                                  {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                                </span>
                              </div>
                            )}
                            {/* Online Status Indicator */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900 truncate">
                                {member.name || 'Unknown Member'}
                              </h3>
                              {getRoleIcon(member.role)}
                            </div>
                            
                            <Badge className={`text-xs font-semibold px-3 py-1 rounded-full ${getRoleBadgeColor(member.role)} border-0`}>
                              {member.role.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Member Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center group/item">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:item:bg-blue-200 transition-colors">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-600 truncate font-medium">{member.email}</span>
                        </div>
                        
                        {member.phone && (
                          <div className="flex items-center group/item">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:item:bg-green-200 transition-colors">
                              <Phone className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">{member.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center group/item">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:item:bg-purple-200 transition-colors">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">
                            Joined {format(new Date(member.joinDate), 'MMM yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Small Groups Pills */}
                      {member.smallGroupMembers.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Small Groups</p>
                          <div className="flex flex-wrap gap-2">
                            {member.smallGroupMembers.slice(0, 2).map((groupMember) => (
                              <span key={groupMember.smallGroup.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Users className="w-3 h-3 mr-1" />
                                {groupMember.smallGroup.name}
                              </span>
                            ))}
                            {member.smallGroupMembers.length > 2 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{member.smallGroupMembers.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {session?.user?.id !== member.id && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(member.phone)}
                            disabled={!member.phone}
                            className="flex-1 rounded-xl border-2 hover:border-green-300 hover:bg-green-50 transition-all duration-300"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMessage(member)}
                            className="flex-1 rounded-xl border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmail(member.email)}
                            className="flex-1 rounded-xl border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            /* List View */
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <CardContent className="p-0">
                <div className="">
                  {filteredMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="group flex items-center justify-between p-6 border-b border-gray-100 last:border-b-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Enhanced Avatar for List */}
                        <div className="relative">
                          {member.image ? (
                            <Image
                              src={member.image}
                              alt={member.name || 'Member'}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-md group-hover:ring-blue-200 transition-all"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md ring-2 ring-white group-hover:ring-blue-200 transition-all">
                              <span className="text-white font-semibold">
                                {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                              </span>
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm" />
                        </div>

                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {member.name || 'Unknown Member'}
                            </h3>
                            {getRoleIcon(member.role)}
                            <Badge className={`text-xs font-semibold px-2 py-1 rounded-lg ${getRoleBadgeColor(member.role)} border-0`}>
                              {member.role.toLowerCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="truncate font-medium">{member.email}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-green-500" />
                                <span className="font-medium">{member.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                              <span className="font-medium">Joined {format(new Date(member.joinDate), 'MMM yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {session?.user?.id !== member.id && (
                        <div className="flex space-x-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(member.phone)}
                            disabled={!member.phone}
                            className="h-9 w-9 p-0 rounded-xl border-2 hover:border-green-300 hover:bg-green-50 transition-all"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMessage(member)}
                            className="h-9 w-9 p-0 rounded-xl border-2 hover:border-blue-300 hover:bg-blue-50 transition-all"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmail(member.email)}
                            className="h-9 w-9 p-0 rounded-xl border-2 hover:border-purple-300 hover:bg-purple-50 transition-all"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}

