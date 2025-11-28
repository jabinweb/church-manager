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
  Heart, 
  Search, 
  Users,
  Clock,
  MapPin,
  Plus,
  UserPlus,
  Filter,
  Loader2,
  Calendar,
  Award,
  Activity,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Volunteer {
  id: string
  position: string
  skills: string[]
  availability: string[]
  isActive: boolean
  ministry: {
    id: string
    name: string
    description: string | null
    leader: string | null
    meetingTime: string | null
    location: string | null
  }
}

interface Ministry {
  id: string
  name: string
  description: string | null
  leader: string | null
  meetingTime: string | null
  location: string | null
  isActive: boolean
  volunteers?: Array<{
    id: string
    position: string
    user: {
      id: string
      name: string | null
    }
  }>
}

export default function VolunteerPage() {
  const { data: session } = useSession()
  const [myVolunteering, setMyVolunteering] = useState<Volunteer[]>([])
  const [availableMinistries, setAvailableMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newVolunteerOpen, setNewVolunteerOpen] = useState(false)
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)
  const [newVolunteer, setNewVolunteer] = useState({
    position: '',
    skills: '',
    availability: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyVolunteering()
      fetchAvailableMinistries()
    }
  }, [session])

  const fetchMyVolunteering = async () => {
    try {
      const response = await fetch('/api/volunteer/my-volunteering')
      if (response.ok) {
        const data = await response.json()
        setMyVolunteering(data.volunteering || [])
      }
    } catch (error) {
      console.error('Error fetching my volunteering:', error)
      toast.error('Failed to load volunteer activities')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableMinistries = async () => {
    try {
      const response = await fetch('/api/ministries')
      if (response.ok) {
        const data = await response.json()
        setAvailableMinistries(data.ministries || [])
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
    }
  }

  const submitVolunteerApplication = async () => {
    if (!selectedMinistry || !newVolunteer.position.trim()) {
      toast.error('Please select a ministry and position')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/volunteer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ministryId: selectedMinistry.id,
          position: newVolunteer.position.trim(),
          skills: newVolunteer.skills.split(',').map(s => s.trim()).filter(Boolean),
          availability: newVolunteer.availability.split(',').map(s => s.trim()).filter(Boolean)
        })
      })

      if (response.ok) {
        toast.success('Volunteer application submitted successfully!')
        setNewVolunteerOpen(false)
        setNewVolunteer({ position: '', skills: '', availability: '' })
        setSelectedMinistry(null)
        fetchMyVolunteering()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting volunteer application:', error)
      toast.error('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const updateVolunteerStatus = async (volunteerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/volunteer/${volunteerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        toast.success(`Volunteer status ${isActive ? 'activated' : 'deactivated'}`)
        fetchMyVolunteering()
      } else {
        toast.error('Failed to update volunteer status')
      }
    } catch (error) {
      console.error('Error updating volunteer status:', error)
      toast.error('Failed to update volunteer status')
    }
  }

  const filteredMinistries = availableMinistries.filter(ministry => {
    const matchesSearch = ministry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ministry.description && ministry.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Check if user is already volunteering for this ministry
    const alreadyVolunteering = myVolunteering.some(v => v.ministry.id === ministry.id && v.isActive)
    
    return matchesSearch && ministry.isActive && !alreadyVolunteering
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                My Volunteer Activities
              </h1>
              <p className="text-gray-600 mt-2">Serve others and grow in faith through volunteering</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={newVolunteerOpen} onOpenChange={setNewVolunteerOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Apply to Volunteer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Apply to Volunteer</DialogTitle>
                    <DialogDescription>
                      Join a ministry and make a difference in your community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ministry">Select Ministry</Label>
                      <select
                        value={selectedMinistry?.id || ''}
                        onChange={(e) => {
                          const ministry = availableMinistries.find(m => m.id === e.target.value)
                          setSelectedMinistry(ministry || null)
                        }}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Choose a ministry...</option>
                        {filteredMinistries.map((ministry) => (
                          <option key={ministry.id} value={ministry.id}>
                            {ministry.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="position">Position/Role *</Label>
                      <Input
                        id="position"
                        value={newVolunteer.position}
                        onChange={(e) => setNewVolunteer({...newVolunteer, position: e.target.value})}
                        placeholder="e.g., Assistant, Team Member, Coordinator"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <Textarea
                        id="skills"
                        value={newVolunteer.skills}
                        onChange={(e) => setNewVolunteer({...newVolunteer, skills: e.target.value})}
                        placeholder="e.g., Music, Leadership, Organization, Technology"
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="availability">Availability (comma separated)</Label>
                      <Textarea
                        id="availability"
                        value={newVolunteer.availability}
                        onChange={(e) => setNewVolunteer({...newVolunteer, availability: e.target.value})}
                        placeholder="e.g., Sunday mornings, Weekday evenings, Saturday afternoons"
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setNewVolunteerOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={submitVolunteerApplication}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Apply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Active Roles</p>
                <p className="text-2xl font-bold text-green-600">
                  {myVolunteering.filter(v => v.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* My Current Volunteering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                My Volunteer Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myVolunteering.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No volunteer roles yet</h3>
                  <p className="text-gray-600 mb-4">Start making a difference by volunteering in a ministry</p>
                  <Button onClick={() => setNewVolunteerOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Apply to Volunteer
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myVolunteering.map((volunteer) => (
                    <div key={volunteer.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{volunteer.ministry.name}</h3>
                        <Badge 
                          className={volunteer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {volunteer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                          <span className="font-medium">{volunteer.position}</span>
                        </div>

                        {volunteer.ministry.leader && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span>Led by {volunteer.ministry.leader}</span>
                          </div>
                        )}

                        {volunteer.ministry.meetingTime && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                            <span>{volunteer.ministry.meetingTime}</span>
                          </div>
                        )}

                        {volunteer.ministry.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                            <span>{volunteer.ministry.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {volunteer.skills.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {volunteer.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                {skill}
                              </Badge>
                            ))}
                            {volunteer.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600">
                                +{volunteer.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Availability */}
                      {volunteer.availability.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Availability</p>
                          <div className="flex flex-wrap gap-1">
                            {volunteer.availability.slice(0, 2).map((time) => (
                              <Badge key={time} variant="outline" className="text-xs">
                                {time}
                              </Badge>
                            ))}
                            {volunteer.availability.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{volunteer.availability.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant={volunteer.isActive ? "outline" : "default"}
                        onClick={() => updateVolunteerStatus(volunteer.id, !volunteer.isActive)}
                        className="w-full"
                      >
                        {volunteer.isActive ? 'Pause Volunteering' : 'Resume Volunteering'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Ministries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Available Ministries
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search ministries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMinistries.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No available ministries</h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'No ministries match your search criteria'
                      : 'You are already volunteering in all available ministries!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMinistries.map((ministry) => (
                    <div key={ministry.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{ministry.name}</h3>
                      
                      {ministry.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ministry.description}</p>
                      )}

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {ministry.leader && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span>Led by {ministry.leader}</span>
                          </div>
                        )}

                        {ministry.meetingTime && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                            <span>{ministry.meetingTime}</span>
                          </div>
                        )}

                        {ministry.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                            <span>{ministry.location}</span>
                          </div>
                        )}

                        {ministry.volunteers && ministry.volunteers.length > 0 && (
                          <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                            <span>{ministry.volunteers.length} current volunteer{ministry.volunteers.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedMinistry(ministry)
                          setNewVolunteerOpen(true)
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Apply to Volunteer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{myVolunteering.filter(v => v.isActive).length}</p>
                <p className="text-sm text-gray-600">Active Roles</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{availableMinistries.length}</p>
                <p className="text-sm text-gray-600">Ministries</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {myVolunteering.reduce((total, v) => total + v.skills.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Skills Listed</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{myVolunteering.length}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
