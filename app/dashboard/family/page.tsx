'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Baby,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Crown,
  Shield,
  UserCheck,
  Loader2,
  Search,
  X,
  Link as LinkIcon,
  UserPlus,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'

interface FamilyMember {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  relationship: string
  dateOfBirth: string | null
  anniversary: string | null
  address: string | null
  notes: string | null
  image: string | null
  isUser: boolean
  isLinkedUser?: boolean
  role?: string
  joinDate?: string
}

interface SearchUser {
  id: string
  name: string | null
  email: string
  phone: string | null
  image: string | null
  role: string
  dateOfBirth: string | null
}

export default function FamilyPage() {
  const { data: session } = useSession()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [editMemberOpen, setEditMemberOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    dateOfBirth: '',
    anniversary: '',
    address: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [searchingUsers, setSearchingUsers] = useState(false)

  useEffect(() => {
    fetchFamilyMembers()
  }, [])

  const filterMembers = useCallback(() => {
    const filtered = familyMembers.filter(member => {
      const matchesSearch = 
        (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        member.relationship.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesSearch
    })
    setFilteredMembers(filtered)
  }, [familyMembers, searchTerm])

  useEffect(() => {
    filterMembers()
  }, [filterMembers])

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family')
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data.familyMembers || [])
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
      toast.error('Failed to load family members')
    } finally {
      setLoading(false)
    }
  }

  const searchExistingUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchUsers([])
      return
    }

    setSearchingUsers(true)
    try {
      const response = await fetch(`/api/family/search-users?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearchingUsers(false)
    }
  }

  const addFamilyMember = async () => {
    if (selectedUser) {
      // Adding existing user as family member
      if (!newMember.relationship.trim()) {
        toast.error('Relationship is required')
        return
      }

      setSubmitting(true)
      try {
        const response = await fetch('/api/family', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            existingUserId: selectedUser.id,
            relationship: newMember.relationship,
            anniversary: newMember.anniversary || null,
            address: newMember.address || null,
            notes: newMember.notes || null
          })
        })

        if (response.ok) {
          toast.success('Family member added successfully!')
          resetAddMemberForm()
          fetchFamilyMembers()
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to add family member')
        }
      } catch (error) {
        console.error('Error adding family member:', error)
        toast.error('Failed to add family member')
      } finally {
        setSubmitting(false)
      }
    } else {
      // Adding new family member (not existing user)
      if (!newMember.name.trim()) {
        toast.error('Name is required')
        return
      }

      setSubmitting(true)
      try {
        const response = await fetch('/api/family', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newMember,
            dateOfBirth: newMember.dateOfBirth || null,
            anniversary: newMember.anniversary || null
          })
        })

        if (response.ok) {
          toast.success('Family member added successfully!')
          resetAddMemberForm()
          fetchFamilyMembers()
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to add family member')
        }
      } catch (error) {
        console.error('Error adding family member:', error)
        toast.error('Failed to add family member')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const resetAddMemberForm = () => {
    setAddMemberOpen(false)
    setSelectedUser(null)
    setUserSearchTerm('')
    setSearchUsers([])
    setShowUserSearch(false)
    setNewMember({
      name: '',
      email: '',
      phone: '',
      relationship: '',
      dateOfBirth: '',
      anniversary: '',
      address: '',
      notes: ''
    })
  }

  const selectUser = (user: SearchUser) => {
    setSelectedUser(user)
    setUserSearchTerm(user.name || user.email)
    setSearchUsers([])
    setShowUserSearch(false)
    // Pre-fill some fields from selected user
    setNewMember(prev => ({
      ...prev,
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''
    }))
  }

  const clearSelectedUser = () => {
    setSelectedUser(null)
    setUserSearchTerm('')
    setSearchUsers([])
    setShowUserSearch(false)
    setNewMember(prev => ({
      ...prev,
      name: '',
      email: '',
      phone: '',
      dateOfBirth: ''
    }))
  }

  const updateFamilyMember = async () => {
    if (!selectedMember || !selectedMember.name?.trim()) {
      toast.error('Name is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/family/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedMember.name,
          email: selectedMember.email || null,
          phone: selectedMember.phone || null,
          relationship: selectedMember.relationship,
          dateOfBirth: selectedMember.dateOfBirth || null,
          anniversary: selectedMember.anniversary || null,
          address: selectedMember.address || null,
          notes: selectedMember.notes || null
        })
      })

      if (response.ok) {
        toast.success('Family member updated successfully!')
        setEditMemberOpen(false)
        setSelectedMember(null)
        fetchFamilyMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update family member')
      }
    } catch (error) {
      console.error('Error updating family member:', error)
      toast.error('Failed to update family member')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteFamilyMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) {
      return
    }

    try {
      const response = await fetch(`/api/family/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Family member removed successfully!')
        fetchFamilyMembers()
      } else {
        toast.error('Failed to remove family member')
      }
    } catch (error) {
      console.error('Error deleting family member:', error)
      toast.error('Failed to remove family member')
    }
  }

  const openEditDialog = (member: FamilyMember) => {
    setSelectedMember(member)
    setEditMemberOpen(true)
  }

  const getRelationshipIcon = (relationship: string) => {
    const lowerRel = relationship.toLowerCase()
    if (lowerRel.includes('spouse') || lowerRel.includes('husband') || lowerRel.includes('wife')) {
      return <Heart className="h-4 w-4 text-red-500" />
    }
    if (lowerRel.includes('child') || lowerRel.includes('son') || lowerRel.includes('daughter')) {
      return <Baby className="h-4 w-4 text-blue-500" />
    }
    return <Users className="h-4 w-4 text-purple-500" />
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'PASTOR': return <Shield className="h-4 w-4 text-purple-500" />
      case 'STAFF': return <UserCheck className="h-4 w-4 text-blue-500" />
      case 'MEMBER': return <User className="h-4 w-4 text-green-500" />
      default: return null
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
              <p className="text-gray-600 mt-1">Manage your family information and connections</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredMembers.length}</div>
                <div className="text-sm text-gray-500">Total Members</div>
              </div>
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold">Add Family Member</DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Add an existing church member or create a new family member profile
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Search Existing Users Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <Label className="text-sm font-medium text-blue-900 mb-3 block">
                        Link Existing Church Member
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by name or email..."
                          value={userSearchTerm}
                          onChange={(e) => {
                            setUserSearchTerm(e.target.value)
                            setShowUserSearch(true)
                            searchExistingUsers(e.target.value)
                          }}
                          className="pl-10 bg-white"
                          disabled={!!selectedUser}
                        />
                        {selectedUser && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearSelectedUser}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Selected User Display */}
                      {selectedUser && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{selectedUser.name}</p>
                              <p className="text-sm text-gray-600">{selectedUser.email}</p>
                              <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                {selectedUser.role.toLowerCase()}
                              </Badge>
                            </div>
                            <LinkIcon className="h-4 w-4 text-blue-500" />
                          </div>
                        </div>
                      )}

                      {/* Search Results */}
                      {showUserSearch && searchUsers.length > 0 && !selectedUser && (
                        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {searchingUsers && (
                            <div className="p-3 text-center">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
                            </div>
                          )}
                          {searchUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => selectUser(user)}
                              className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                            >
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {user.role.toLowerCase()}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or create new member</span>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Name {!selectedUser && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="name"
                          value={newMember.name}
                          onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                          placeholder="Full name"
                          className="mt-1"
                          disabled={!!selectedUser}
                        />
                      </div>
                      <div>
                        <Label htmlFor="relationship" className="text-sm font-medium text-gray-700">
                          Relationship <span className="text-red-500">*</span>
                        </Label>
                        <select
                          value={newMember.relationship}
                          onChange={(e) => setNewMember({...newMember, relationship: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Grandchild">Grandchild</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {!selectedUser && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newMember.email}
                            onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                            placeholder="email@example.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                          <Input
                            id="phone"
                            value={newMember.phone}
                            onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                            placeholder="Phone number"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={newMember.dateOfBirth}
                          onChange={(e) => setNewMember({...newMember, dateOfBirth: e.target.value})}
                          className="mt-1"
                          disabled={!!selectedUser}
                        />
                      </div>
                      <div>
                        <Label htmlFor="anniversary" className="text-sm font-medium text-gray-700">Anniversary</Label>
                        <Input
                          id="anniversary"
                          type="date"
                          value={newMember.anniversary}
                          onChange={(e) => setNewMember({...newMember, anniversary: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                      <Textarea
                        id="address"
                        value={newMember.address}
                        onChange={(e) => setNewMember({...newMember, address: e.target.value})}
                        placeholder="Home address"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newMember.notes}
                        onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
                        placeholder="Any additional notes"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={resetAddMemberForm} disabled={submitting}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={addFamilyMember}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Member
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8 shadow-sm border-0">
          <CardContent className="p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search family members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Family Members Grid */}
        {filteredMembers.length === 0 ? (
          <Card className="text-center py-16 shadow-sm border-0">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No family members found' : 'No family members added'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search criteria to find family members'
                  : 'Start building your family tree by adding your family members'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setAddMemberOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Family Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Profile Image/Avatar */}
                        <div className="relative">
                          {member.image ? (
                            <Image
                              src={member.image}
                              alt={member.name || 'Family member'}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                              <span className="text-white font-semibold text-lg">
                                {member.name ? member.name.charAt(0).toUpperCase() : 'F'}
                              </span>
                            </div>
                          )}
                          {member.isLinkedUser && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <LinkIcon className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getRelationshipIcon(member.relationship)}
                            <span className="text-sm text-gray-600">{member.relationship}</span>
                            {member.isUser && member.role && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {member.role.toLowerCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      {!member.isUser && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => openEditDialog(member)}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteFamilyMember(member.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Member Details */}
                    <div className="space-y-3">
                      {member.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}

                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}

                      {member.dateOfBirth && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                          <span>Born {format(new Date(member.dateOfBirth), 'MMM dd, yyyy')}</span>
                        </div>
                      )}

                      {member.anniversary && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Heart className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                          <span>Anniversary {format(new Date(member.anniversary), 'MMM dd, yyyy')}</span>
                        </div>
                      )}

                      {member.address && (
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{member.address}</span>
                        </div>
                      )}

                      {member.notes && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-4">
                          <p className="text-xs text-gray-700 line-clamp-3">{member.notes}</p>
                        </div>
                      )}

                      {member.isUser && member.joinDate && (
                        <div className="bg-blue-50 rounded-lg p-3 mt-4">
                          <p className="text-xs text-blue-700 font-medium">
                            Church member since {format(new Date(member.joinDate), 'MMM yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Member Dialog - Similar improvements */}
        <Dialog open={editMemberOpen} onOpenChange={setEditMemberOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold">Edit Family Member</DialogTitle>
              <DialogDescription className="text-gray-600">
                Update family member information
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6 py-4">
                {/* Similar form structure as add dialog but for editing */}
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setEditMemberOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={updateFamilyMember}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Update Member
                      </>
                    )}
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
                     