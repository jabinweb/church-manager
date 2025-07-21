'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Upload,
  Save,
  ArrowLeft,
  Loader2,
  X,
  Plus
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import Link from 'next/link'

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
  dateOfBirth: string | null
  memberProfile?: {
    emergencyContact: string | null
    emergencyPhone: string | null
    baptismDate: string | null
    membershipDate: string | null
    skills: string[]
    interests: string[]
    ministryInvolvement: string[]
  }
}

export default function EditMemberPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = typeof params.id === 'string' ? params.id : ''
  
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'MEMBER',
    isActive: true,
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    baptismDate: '',
    membershipDate: '',
    skills: [] as string[],
    interests: [] as string[],
    ministryInvolvement: [] as string[]
  })
  
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [newMinistry, setNewMinistry] = useState('')

  const fetchMember = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/members/${memberId}`)
      if (!response.ok) throw new Error('Failed to fetch member')
      
      const data = await response.json()
      setMember(data.member)
      
      // Populate form data
      const m = data.member
      setFormData({
        name: m.name || '',
        email: m.email || '',
        phone: m.phone || '',
        address: m.address || '',
        role: m.role || 'MEMBER',
        isActive: m.isActive,
        dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : '',
        emergencyContact: m.memberProfile?.emergencyContact || '',
        emergencyPhone: m.memberProfile?.emergencyPhone || '',
        baptismDate: m.memberProfile?.baptismDate ? new Date(m.memberProfile.baptismDate).toISOString().split('T')[0] : '',
        membershipDate: m.memberProfile?.membershipDate ? new Date(m.memberProfile.membershipDate).toISOString().split('T')[0] : '',
        skills: m.memberProfile?.skills || [],
        interests: m.memberProfile?.interests || [],
        ministryInvolvement: m.memberProfile?.ministryInvolvement || []
      })
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error('Failed to load member data')
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    if (memberId) {
      fetchMember()
    }
  }, [memberId, fetchMember])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const payload = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        memberProfile: {
          emergencyContact: formData.emergencyContact || null,
          emergencyPhone: formData.emergencyPhone || null,
          baptismDate: formData.baptismDate ? new Date(formData.baptismDate).toISOString() : null,
          membershipDate: formData.membershipDate ? new Date(formData.membershipDate).toISOString() : null,
          skills: formData.skills,
          interests: formData.interests,
          ministryInvolvement: formData.ministryInvolvement
        }
      }

      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to update member')

      toast.success('Member updated successfully')
      router.push('/admin/members')
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type on client side
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setImageUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'member-avatar')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      // Update member image
      const updateResponse = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: data.url })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update member image')
      }

      setMember(prev => prev ? { ...prev, image: data.url } : null)
      toast.success('Profile image updated successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setImageUploading(false)
    }
  }

  const addItem = (type: 'skills' | 'interests' | 'ministryInvolvement', value: string) => {
    if (!value.trim()) return
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }))
    
    if (type === 'skills') setNewSkill('')
    if (type === 'interests') setNewInterest('')
    if (type === 'ministryInvolvement') setNewMinistry('')
  }

  const removeItem = (type: 'skills' | 'interests' | 'ministryInvolvement', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const getMemberImage = () => {
    if (member?.image) return member.image
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || formData.email)}&background=7c3aed&color=ffffff&size=128`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading member data...</p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-16">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Member not found</h3>
        <p className="text-gray-600 mb-4">The member you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/admin/members">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/members">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Member</h1>
            <p className="text-gray-600">Update member information and profile</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push('/admin/members')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Image & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Image
                  src={getMemberImage()}
                  alt={formData.name || 'Member'}
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
                {imageUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </div>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB</p>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                  />
                  <span className="text-sm">Active Member</span>
                  <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
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
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter full address"
                rows={2}
              />
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    placeholder="Enter emergency contact name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    placeholder="Enter emergency phone number"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Church Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Church Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baptismDate">Baptism Date</Label>
                  <Input
                    id="baptismDate"
                    type="date"
                    value={formData.baptismDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, baptismDate: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="membershipDate">Membership Date</Label>
                  <Input
                    id="membershipDate"
                    type="date"
                    value={formData.membershipDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, membershipDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Skills */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Skills & Talents</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && addItem('skills', newSkill)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addItem('skills', newSkill)}
                    disabled={!newSkill.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeItem('skills', index)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Interests</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest..."
                    onKeyPress={(e) => e.key === 'Enter' && addItem('interests', newInterest)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addItem('interests', newInterest)}
                    disabled={!newInterest.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeItem('interests', index)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Ministry Involvement */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Ministry Involvement</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newMinistry}
                    onChange={(e) => setNewMinistry(e.target.value)}
                    placeholder="Add ministry involvement..."
                    onKeyPress={(e) => e.key === 'Enter' && addItem('ministryInvolvement', newMinistry)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addItem('ministryInvolvement', newMinistry)}
                    disabled={!newMinistry.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.ministryInvolvement.map((ministry, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {ministry}
                      <button
                        type="button"
                        onClick={() => removeItem('ministryInvolvement', index)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
