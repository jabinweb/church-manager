'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit,
  ArrowLeft,
  Loader2,
  Heart,
  BookOpen,
  Users,
  DollarSign,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

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
  createdAt: string
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

interface MemberActivity {
  donations: Array<{
    id: string
    amount: number
    date: string
    fund: { name: string }
  }>
  eventRegistrations: Array<{
    id: string
    event: { title: string; startDate: string }
  }>
  prayerRequests: Array<{
    id: string
    request: string
    status: string
    createdAt: string
  }>
}

export default function ViewMemberPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = typeof params.id === 'string' ? params.id : ''
  
  const [member, setMember] = useState<Member | null>(null)
  const [activity, setActivity] = useState<MemberActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchMember = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/members/${memberId}`)
      if (!response.ok) throw new Error('Failed to fetch member')
      
      const data = await response.json()
      setMember(data.member)
    } catch (error) {
      console.error('Error fetching member:', error)
    } finally {
      setLoading(false)
    }
  }, [memberId])

  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivity(data)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }, [memberId])

  useEffect(() => {
    if (memberId) {
      fetchMember()
      fetchActivity()
    }
  }, [memberId, fetchMember, fetchActivity])

  const getMemberImage = () => {
    if (member?.image) return member.image
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || member?.email || 'User')}&background=7c3aed&color=ffffff&size=128`
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PASTOR': return 'bg-purple-100 text-purple-800'
      case 'STAFF': return 'bg-blue-100 text-blue-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
            <h1 className="text-3xl font-bold text-gray-900">{member.name || 'Member Profile'}</h1>
            <p className="text-gray-600">Member details and activity overview</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/members/${member.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Member Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <Image
                src={getMemberImage()}
                alt={member.name || 'Member'}
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            
            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{member.name || 'No Name'}</h2>
                <Badge className={getRoleBadgeColor(member.role)}>
                  {member.role}
                </Badge>
                <Badge variant={member.isActive ? 'default' : 'secondary'}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="truncate">{member.email}</span>
                </div>
                
                {member.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-purple-500" />
                    <span>{member.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                  <span>Joined {format(new Date(member.joinDate), 'MMM dd, yyyy')}</span>
                </div>
                
                {member.address && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="truncate">{member.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="ministry">Ministry</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Donations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${activity?.donations?.reduce((sum, d) => sum + d.amount, 0)?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Events Attended</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activity?.eventRegistrations?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Prayer Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activity?.prayerRequests?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ministries</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {member.memberProfile?.ministryInvolvement?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity?.donations?.slice(0, 3).map((donation) => (
                  <div key={donation.id} className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Donated ${donation.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">To {donation.fund.name}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(donation.date), 'MMM dd')}
                    </span>
                  </div>
                ))}
                
                {activity?.eventRegistrations?.slice(0, 2).map((registration) => (
                  <div key={registration.id} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Registered for event</p>
                      <p className="text-sm text-gray-600">{registration.event.title}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(registration.event.startDate), 'MMM dd')}
                    </span>
                  </div>
                ))}

                {(!activity?.donations?.length && !activity?.eventRegistrations?.length) && (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Details Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{member.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{member.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{member.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">
                    {member.dateOfBirth 
                      ? format(new Date(member.dateOfBirth), 'MMMM dd, yyyy')
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{member.address || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Name</label>
                  <p className="text-gray-900">
                    {member.memberProfile?.emergencyContact || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                  <p className="text-gray-900">
                    {member.memberProfile?.emergencyPhone || 'Not provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Church Information */}
            <Card>
              <CardHeader>
                <CardTitle>Church Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-gray-900">{format(new Date(member.joinDate), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Baptism Date</label>
                  <p className="text-gray-900">
                    {member.memberProfile?.baptismDate 
                      ? format(new Date(member.memberProfile.baptismDate), 'MMMM dd, yyyy')
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Membership Date</label>
                  <p className="text-gray-900">
                    {member.memberProfile?.membershipDate 
                      ? format(new Date(member.memberProfile.membershipDate), 'MMMM dd, yyyy')
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {member.role}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={member.isActive ? 'default' : 'secondary'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Interests */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Skills</label>
                  {member.memberProfile?.skills?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {member.memberProfile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No skills listed</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Interests</label>
                  {member.memberProfile?.interests?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {member.memberProfile.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No interests listed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Donation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity?.donations?.length ? (
                  <div className="space-y-3">
                    {activity.donations.map((donation) => (
                      <div key={donation.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">${donation.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{donation.fund.name}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(donation.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No donations recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Event Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity?.eventRegistrations?.length ? (
                  <div className="space-y-3">
                    {activity.eventRegistrations.map((registration) => (
                      <div key={registration.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{registration.event.title}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(registration.event.startDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No event registrations</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prayer Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Prayer Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity?.prayerRequests?.length ? (
                <div className="space-y-4">
                  {activity.prayerRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={request.status === 'ANSWERED' ? 'default' : 'secondary'}>
                          {request.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <p className="text-gray-700">{request.request}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No prayer requests</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ministry Tab */}
        <TabsContent value="ministry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Ministry Involvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.memberProfile?.ministryInvolvement?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {member.memberProfile.ministryInvolvement.map((ministry, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-purple-50">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium">{ministry}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No ministry involvement recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
