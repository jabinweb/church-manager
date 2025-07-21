'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Loader2,
  Edit,
  Trash2,
  UserX,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Member {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  joinDate: string
  isActive: boolean
  address: string | null
  image: string | null
  memberProfile?: {
    ministryInvolvement: string[]
  }
}

interface MemberStats {
  totalMembers: number
  thisMonthMembers: number
  activeMembers: number
  staffCount: number
}

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Bulk operations state
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'role-change' | 'delete'>('activate')
  const [bulkNewRole, setBulkNewRole] = useState<string>('MEMBER')

  const fetchMembersData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterRole !== 'all') params.append('role', filterRole)

      const response = await fetch(`/api/admin/members?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch members data')
      
      const data = await response.json()
      setMembers(data.members)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterRole])

  useEffect(() => {
    fetchMembersData()
  }, [fetchMembersData])

  const statsData = stats ? [
    { title: 'Total Members', value: stats.totalMembers.toString(), icon: Users, color: 'text-blue-600' },
    { title: 'New This Month', value: stats.thisMonthMembers.toString(), icon: UserPlus, color: 'text-green-600' },
    { title: 'Active Members', value: stats.activeMembers.toString(), icon: Users, color: 'text-purple-600' },
    { title: 'Staff & Leadership', value: stats.staffCount.toString(), icon: Users, color: 'text-orange-600' },
  ] : []

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PASTOR': return 'bg-purple-100 text-purple-800'
      case 'STAFF': return 'bg-blue-100 text-blue-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(m => m.id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId])
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId))
    }
  }

  const handleBulkAction = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    setBulkActionLoading(true)
    try {
      const payload = {
        memberIds: selectedMembers,
        action: bulkAction,
        ...(bulkAction === 'role-change' && { newRole: bulkNewRole })
      }

      const response = await fetch('/api/admin/members/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Bulk action failed')

      toast.success(`Successfully updated ${selectedMembers.length} members`)
      setSelectedMembers([])
      setShowBulkDialog(false)
      fetchMembersData()
    } catch (error) {
      toast.error('Failed to perform bulk action')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const getMemberImage = (member: Member) => {
    if (member.image) {
      return member.image
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email)}&background=7c3aed&color=ffffff&size=48`
  }

  const handleToggleStatus = async (memberId: string, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success(`Member ${newStatus ? 'activated' : 'deactivated'} successfully`)
      fetchMembersData()
    } catch (error) {
      toast.error('Failed to update member status')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete member')

      toast.success('Member deleted successfully')
      fetchMembersData()
    } catch (error) {
      toast.error('Failed to delete member')
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading members data: {error}</p>
          <Button onClick={fetchMembersData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600 mt-2">Manage church members, roles, and information</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
          <Link href="/admin/members/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsData.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Roles</option>
                <option value="PASTOR">Pastor</option>
                <option value="STAFF">Staff</option>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            
            {/* Bulk Actions */}
            {selectedMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {selectedMembers.length} selected
                </span>
                <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Edit Members</DialogTitle>
                      <DialogDescription>
                        Select an action to apply to {selectedMembers.length} selected members.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Action</label>
                        <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activate">
                              <div className="flex items-center">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate Members
                              </div>
                            </SelectItem>
                            <SelectItem value="deactivate">
                              <div className="flex items-center">
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate Members
                              </div>
                            </SelectItem>
                            <SelectItem value="role-change">
                              <div className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                Change Role
                              </div>
                            </SelectItem>
                            <SelectItem value="delete">
                              <div className="flex items-center">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Members
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {bulkAction === 'role-change' && (
                        <div>
                          <label className="text-sm font-medium">New Role</label>
                          <Select value={bulkNewRole} onValueChange={setBulkNewRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="STAFF">Staff</SelectItem>
                              <SelectItem value="PASTOR">Pastor</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleBulkAction}
                        disabled={bulkActionLoading}
                        className={bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {bulkActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Apply Action
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading members...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2 p-2 border-b">
                <Checkbox
                  checked={selectedMembers.length === members.length && members.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label className="text-sm font-medium">
                  Select All ({members.length} members)
                </label>
              </div>
              
              <div className='overflow-y-auto h-auto max-h-[calc(70vh-260px)]'>
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => handleSelectMember(member.id, !!checked)}
                    />
                    
                    {/* Member Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={getMemberImage(member)}
                        alt={member.name || 'Member'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email)}&background=7c3aed&color=ffffff&size=48`
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{member.name || 'No Name'}</h3>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                        <Badge variant={member.isActive ? 'default' : 'secondary'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {member.phone}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {new Date(member.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                      {member.memberProfile?.ministryInvolvement && member.memberProfile.ministryInvolvement.length > 0 && (
                        <div className="flex items-center mt-2">
                          <span className="text-sm text-gray-500 mr-2">Ministries:</span>
                          <div className="flex space-x-1">
                            {member.memberProfile.ministryInvolvement.map((ministry) => (
                              <Badge key={ministry} variant="outline" className="text-xs">
                                {ministry}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/members/${member.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/members/${member.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/members/${member.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/members/${member.id}/edit`}>
                            Edit Member
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(member.id, !member.isActive)}
                          className="text-blue-600"
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600"
                        >
                          Delete Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
