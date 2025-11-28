'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin,
  Clock,
  User,
  Eye,
  CheckCircle,
  XCircle,
  Heart,
  BookOpen,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Image from 'next/image'

interface Ministry {
  id: string
  name: string
  description: string | null
  leader: string | null
  meetingTime: string | null
  location: string | null
  isActive: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    volunteers: number
  }
}

interface MinistryStats {
  totalMinistries: number
  activeMinistries: number
  totalVolunteers: number
  recentlyCreated: number
}

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [stats, setStats] = useState<MinistryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: '',
    meetingTime: '',
    location: '',
    imageUrl: '',
    isActive: true
  })

  const fetchMinistries = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ministries')
      if (response.ok) {
        const data = await response.json()
        setMinistries(data.ministries || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
      toast.error('Failed to load ministries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMinistries()
  }, [fetchMinistries])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      leader: '',
      meetingTime: '',
      location: '',
      imageUrl: '',
      isActive: true
    })
    setEditingMinistry(null)
  }

  const handleEdit = (ministry: Ministry) => {
    setEditingMinistry(ministry)
    setFormData({
      name: ministry.name,
      description: ministry.description || '',
      leader: ministry.leader || '',
      meetingTime: ministry.meetingTime || '',
      location: ministry.location || '',
      imageUrl: ministry.imageUrl || '',
      isActive: ministry.isActive
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Ministry name is required')
      return
    }

    setSaving(true)
    try {
      const endpoint = editingMinistry 
        ? `/api/admin/ministries/${editingMinistry.id}` 
        : '/api/admin/ministries'
      
      const method = editingMinistry ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingMinistry ? 'Ministry updated successfully' : 'Ministry created successfully')
        setDialogOpen(false)
        resetForm()
        fetchMinistries()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save ministry')
      }
    } catch (error) {
      console.error('Error saving ministry:', error)
      toast.error('Failed to save ministry')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ministryId: string) => {
    if (!confirm('Are you sure you want to delete this ministry? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/ministries/${ministryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Ministry deleted successfully')
        fetchMinistries()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete ministry')
      }
    } catch (error) {
      console.error('Error deleting ministry:', error)
      toast.error('Failed to delete ministry')
    }
  }

  const toggleActive = async (ministry: Ministry) => {
    try {
      const response = await fetch(`/api/admin/ministries/${ministry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ministry.isActive })
      })

      if (response.ok) {
        toast.success(`Ministry ${!ministry.isActive ? 'activated' : 'deactivated'} successfully`)
        fetchMinistries()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update ministry')
      }
    } catch (error) {
      console.error('Error updating ministry:', error)
      toast.error('Failed to update ministry')
    }
  }

  const filteredMinistries = ministries.filter(ministry =>
    ministry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.leader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-purple-600 bg-clip-text text-transparent">
                Ministry Management
              </h1>
              <p className="text-gray-600 mt-2">Manage church ministries and volunteer opportunities</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Ministry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingMinistry ? 'Edit Ministry' : 'Create New Ministry'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingMinistry ? 'Update ministry details' : 'Add a new ministry to your church'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Ministry Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Youth Ministry"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="leader">Ministry Leader</Label>
                      <Input
                        id="leader"
                        value={formData.leader}
                        onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the ministry's purpose and activities..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meetingTime">Meeting Time</Label>
                      <Input
                        id="meetingTime"
                        value={formData.meetingTime}
                        onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                        placeholder="Sundays 6:00 PM"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Youth Hall"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/ministry-image.jpg"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isActive">Ministry is active</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingMinistry ? 'Update Ministry' : 'Create Ministry'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Ministries</p>
                    <p className="text-3xl font-bold">{stats.totalMinistries}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Ministries</p>
                    <p className="text-3xl font-bold">{stats.activeMinistries}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-400 to-pink-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Volunteers</p>
                    <p className="text-3xl font-bold">{stats.totalVolunteers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-400 to-red-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Recently Created</p>
                    <p className="text-3xl font-bold">{stats.recentlyCreated}</p>
                  </div>
                  <Heart className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search ministries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ministries Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : filteredMinistries.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No ministries found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Create your first ministry to get started'}
                </p>
                <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ministry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMinistries.map((ministry, index) => (
                <motion.div
                  key={ministry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      {ministry.imageUrl ? (
                        <Image
                          src={ministry.imageUrl}
                          alt={ministry.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = `https://placehold.co/400x300/7c3aed/white?text=${encodeURIComponent(ministry.name)}`
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge variant={ministry.isActive ? 'default' : 'secondary'}>
                          {ministry.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {ministry.name}
                        </h3>
                      </div>
                      
                      {ministry.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {ministry.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        {ministry.leader && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <span>{ministry.leader}</span>
                          </div>
                        )}
                        
                        {ministry.meetingTime && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{ministry.meetingTime}</span>
                          </div>
                        )}
                        
                        {ministry.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{ministry.location}</span>
                          </div>
                        )}
                        
                        {ministry._count && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{ministry._count.volunteers} volunteers</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Created {format(new Date(ministry.createdAt), 'MMM dd, yyyy')}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleActive(ministry)}
                            title={ministry.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {ministry.isActive ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(ministry)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(ministry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  )
}
