'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  MapPin,
  Clock,
  User,
  Filter,
  Loader2,
  Heart,
  Calendar,
  ArrowRight,
  UserPlus,
  Music,
  Baby,
  GraduationCap,
  Handshake
} from 'lucide-react'
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
  volunteers?: Array<{
    id: string
    position: string
    user: {
      id: string
      name: string | null
    }
  }>
}

export default function MinistriesPage() {
  const { data: session } = useSession()
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [filteredMinistries, setFilteredMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMinistries()
  }, [])

  const filterMinistries = useCallback(() => {
    const filtered = ministries.filter(ministry => {
      const matchesSearch = ministry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ministry.description && ministry.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ministry.leader && ministry.leader.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesSearch && ministry.isActive
    })

    setFilteredMinistries(filtered)
  }, [ministries, searchTerm])

  useEffect(() => {
    filterMinistries()
  }, [filterMinistries])

  const fetchMinistries = async () => {
    try {
      const response = await fetch('/api/ministries')
      if (response.ok) {
        const data = await response.json()
        setMinistries(data.ministries || [])
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
      toast.error('Failed to load ministries')
    } finally {
      setLoading(false)
    }
  }

  const joinMinistry = async (ministryId: string) => {
    if (!session) {
      toast.error('Please sign in to join a ministry')
      return
    }

    try {
      const response = await fetch('/api/ministries/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ministryId })
      })

      if (response.ok) {
        toast.success('Successfully joined ministry!')
        fetchMinistries()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to join ministry')
      }
    } catch (error) {
      console.error('Error joining ministry:', error)
      toast.error('Failed to join ministry')
    }
  }

  const getMinistryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('worship') || lowerName.includes('music')) return Music
    if (lowerName.includes('children') || lowerName.includes('kids')) return Baby
    if (lowerName.includes('youth') || lowerName.includes('teen')) return GraduationCap
    if (lowerName.includes('outreach') || lowerName.includes('mission')) return Handshake
    return Users
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
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
                Church Ministries
              </h1>
              <p className="text-gray-600 mt-2">Discover ways to serve and grow in faith together</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Active Ministries</p>
                <p className="text-2xl font-bold text-purple-600">{filteredMinistries.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search ministries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  {filteredMinistries.length} ministries
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ministries Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredMinistries.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No ministries found</h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'No active ministries at the moment'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMinistries.map((ministry, index) => {
                const IconComponent = getMinistryIcon(ministry.name)
                return (
                  <motion.div
                    key={ministry.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden h-full">
                      {/* Ministry Image/Icon */}
                      {ministry.imageUrl ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={ministry.imageUrl}
                            alt={ministry.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center relative">
                          <IconComponent className="h-20 w-20 text-white opacity-70" />
                        </div>
                      )}

                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="space-y-4 flex-1">
                          {/* Ministry Name */}
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                            {ministry.name}
                          </h3>

                          {/* Ministry Description */}
                          {ministry.description && (
                            <p className="text-gray-600 text-sm line-clamp-3">
                              {ministry.description}
                            </p>
                          )}

                          {/* Ministry Details */}
                          <div className="space-y-2 text-sm text-gray-600">
                            {ministry.leader && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                                <span className="font-medium">Led by {ministry.leader}</span>
                              </div>
                            )}

                            {ministry.meetingTime && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                                <span>{ministry.meetingTime}</span>
                              </div>
                            )}

                            {ministry.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                                <span className="truncate">{ministry.location}</span>
                              </div>
                            )}

                            {ministry.volunteers && ministry.volunteers.length > 0 && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0" />
                                <span>{ministry.volunteers.length} volunteer{ministry.volunteers.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* Volunteers List */}
                          {ministry.volunteers && ministry.volunteers.length > 0 && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-purple-700 mb-2">Team Members</p>
                              <div className="space-y-1">
                                {ministry.volunteers.slice(0, 3).map((volunteer) => (
                                  <div key={volunteer.id} className="text-xs text-purple-600">
                                    <span className="font-medium">{volunteer.user.name || 'Anonymous'}</span>
                                    {volunteer.position && (
                                      <span className="text-purple-500"> - {volunteer.position}</span>
                                    )}
                                  </div>
                                ))}
                                {ministry.volunteers.length > 3 && (
                                  <p className="text-xs text-purple-500">
                                    +{ministry.volunteers.length - 3} more volunteers
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-4 mt-auto">
                          <Button
                            onClick={() => joinMinistry(ministry.id)}
                            disabled={!session}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {session ? 'Join Ministry' : 'Sign In to Join'}
                          </Button>
                          <Button
                            variant="outline"
                            className="px-3"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Ministry Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ministry Areas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Worship', icon: Music, color: 'from-purple-400 to-purple-600' },
              { name: 'Children', icon: Baby, color: 'from-pink-400 to-pink-600' },
              { name: 'Youth', icon: GraduationCap, color: 'from-blue-400 to-blue-600' },
              { name: 'Outreach', icon: Handshake, color: 'from-green-400 to-green-600' }
            ].map((category) => {
              const count = ministries.filter(m => 
                m.name.toLowerCase().includes(category.name.toLowerCase()) && m.isActive
              ).length
              return (
                <Card key={category.name} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{count} ministr{count !== 1 ? 'ies' : 'y'}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
