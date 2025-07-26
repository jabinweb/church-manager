'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users, 
  Heart, 
  BookOpen, 
  Music, 
  Globe,
  Clock,
  MapPin,
  User,
  ChevronRight,
  Calendar,
  Mail,
  Cross,
  HandHeart
} from 'lucide-react'

interface Ministry {
  id: string
  name: string
  description: string | null
  leader: string | null
  meetingTime: string | null
  location: string | null
  isActive: boolean
  imageUrl: string | null
}

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchMinistries()
  }, [])

  const fetchMinistries = async () => {
    try {
      const response = await fetch('/api/ministries')
      if (response.ok) {
        const data = await response.json()
        setMinistries(data.ministries || [])
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
    } finally {
      setLoading(false)
    }
  }

  const openMinistryDialog = (ministry: Ministry) => {
    setSelectedMinistry(ministry)
    setIsDialogOpen(true)
  }

  const closeMinistryDialog = () => {
    setIsDialogOpen(false)
    setSelectedMinistry(null)
  }

  // Helper function to get ministry icon based on name or default
  const getMinistryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('youth')) return Heart
    if (lowerName.includes('children') || lowerName.includes('kids')) return BookOpen
    if (lowerName.includes('outreach') || lowerName.includes('mission')) return HandHeart
    if (lowerName.includes('worship') || lowerName.includes('music')) return Music
    if (lowerName.includes('prayer')) return Heart
    if (lowerName.includes('adult')) return Users
    return Cross // Default icon
  }

  const getMinistryColor = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('youth')) return 'bg-red-100 text-red-600'
    if (lowerName.includes('children') || lowerName.includes('kids')) return 'bg-green-100 text-green-600'
    if (lowerName.includes('outreach') || lowerName.includes('mission')) return 'bg-yellow-100 text-yellow-600'
    if (lowerName.includes('worship') || lowerName.includes('music')) return 'bg-purple-100 text-purple-600'
    if (lowerName.includes('adult')) return 'bg-blue-100 text-blue-600'
    return 'bg-gray-100 text-gray-600' // Default color
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Ministries
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover opportunities to grow in faith, connect with others, and serve our community. 
            There&apos;s a place for everyone at Grace Community Church.
          </p>
        </motion.div>

        {/* All Ministries */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ministries.length === 0 ? (
          <div className="text-center py-16">
            <Cross className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Ministries Available</h3>
            <p className="text-gray-600">
              Check back later for ministry opportunities or contact us for more information.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ministries.filter(m => m.isActive).map((ministry, index) => {
              const MinistryIcon = getMinistryIcon(ministry.name)
              const colorClass = getMinistryColor(ministry.name)
              
              return (
                <motion.div
                  key={ministry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => openMinistryDialog(ministry)}>
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <MinistryIcon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-xl">{ministry.name}</CardTitle>
                      {ministry.leader && (
                        <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
                          <User className="h-4 w-4 mr-1" />
                          Led by {ministry.leader}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="mb-4 line-clamp-3">
                        {ministry.description || 'Join us in this ministry to serve God and our community.'}
                      </CardDescription>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {ministry.meetingTime && (
                          <div className="flex items-center justify-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {ministry.meetingTime}
                          </div>
                        )}
                        {ministry.location && (
                          <div className="flex items-center justify-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {ministry.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center text-purple-600 group-hover:text-purple-700">
                        <span className="text-sm font-medium">Learn More</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Ministry Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {selectedMinistry?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedMinistry && (
              <div className="space-y-6">
                {/* Ministry Description */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">About This Ministry</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedMinistry.description || 'Join us in this ministry to serve God and our community. We welcome all who feel called to participate in this important work of the church.'}
                  </p>
                </div>

                {/* Meeting Details */}
                {(selectedMinistry.meetingTime || selectedMinistry.location || selectedMinistry.leader) && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Ministry Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedMinistry.leader && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <User className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">Ministry Leader</p>
                            <p className="text-gray-600">{selectedMinistry.leader}</p>
                          </div>
                        </div>
                      )}
                      {selectedMinistry.meetingTime && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">Meeting Time</p>
                            <p className="text-gray-600">{selectedMinistry.meetingTime}</p>
                          </div>
                        </div>
                      )}
                      {selectedMinistry.location && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">Location</p>
                            <p className="text-gray-600">{selectedMinistry.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Users className="h-4 w-4 mr-2" />
                    Join Ministry
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Leader
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Interested in joining?</strong> We welcome new members! Contact our ministry leader or attend one of our meetings to learn more about how you can get involved and make a difference.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
                         
               