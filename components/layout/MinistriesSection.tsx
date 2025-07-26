'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Heart, 
  BookOpen, 
  Music, 
  HandHeart,
  MapPin,
  Clock,
  ArrowRight,
  Cross,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Phone,
  Mail,
  X
} from 'lucide-react'

interface Ministry {
  id: string
  name: string
  description?: string
  leader?: string
  meetingTime?: string
  location?: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface MinistriesSectionProps {
  ministries: Ministry[]
}

export function MinistriesSection({ ministries }: MinistriesSectionProps) {
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Helper function to get ministry icon based on name or default
  const getMinistryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('youth')) return Heart
    if (lowerName.includes('children') || lowerName.includes('kids')) return BookOpen
    if (lowerName.includes('outreach') || lowerName.includes('mission')) return HandHeart
    if (lowerName.includes('worship') || lowerName.includes('music')) return Music
    if (lowerName.includes('prayer')) return Heart
    return Cross // Default icon
  }

  // Helper function to get ministry link
  const getMinistryLink = (ministry: Ministry) => {
    return `/ministries/${ministry.id}` // Use ID-based routing
  }

  const itemsPerSlide = 4
  const totalSlides = Math.ceil(ministries.length / itemsPerSlide)
  const showSlider = ministries.length > 4

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const getCurrentSlideItems = () => {
    if (!showSlider) return ministries.slice(0, 8)
    
    const start = currentSlide * itemsPerSlide
    const end = start + itemsPerSlide
    return ministries.slice(start, end)
  }

  const openMinistryDialog = (ministry: Ministry) => {
    setSelectedMinistry(ministry)
    setIsDialogOpen(true)
  }

  const closeMinistryDialog = () => {
    setIsDialogOpen(false)
    setSelectedMinistry(null)
  }

  if (ministries.length === 0) {
    return null
  }

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Gospel-Centered Ministries
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
            Every ministry exists to make disciples who make disciples
          </p>
        </div>
        
        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          {showSlider && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Ministries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-8">
            {getCurrentSlideItems().map((ministry, index) => {
              const MinistryIcon = getMinistryIcon(ministry.name)
              
              return (
                <motion.div
                  key={ministry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group overflow-hidden border-0 cursor-pointer">
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={ministry.imageUrl || `/api/placeholder/400/300?text=${encodeURIComponent(ministry.name)}&bg=7c3aed&color=white`}
                        alt={ministry.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent && !parent.querySelector('.fallback-bg')) {
                            const fallbackDiv = document.createElement('div')
                            fallbackDiv.className = 'fallback-bg absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center'
                            fallbackDiv.innerHTML = `
                              <div class="text-center text-white p-4">
                                <div class="text-2xl font-bold mb-2">${ministry.name.charAt(0).toUpperCase()}</div>
                                <div class="text-xs">${ministry.name}</div>
                              </div>
                            `
                            parent.appendChild(fallbackDiv)
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 text-white">
                        <MinistryIcon className="h-6 w-6" />
                      </div>
                      {ministry.leader && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 text-gray-900 text-xs">
                            {ministry.leader}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors">
                        {ministry.name}
                      </h3>
                      <p className="text-gray-600 mb-3 text-sm leading-relaxed line-clamp-2">
                        {ministry.description || 'Join us in this ministry to serve God and our community.'}
                      </p>
                      
                      {(ministry.meetingTime || ministry.location) && (
                        <div className="text-xs text-gray-500 mb-4 space-y-1">
                          {ministry.meetingTime && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {ministry.meetingTime}
                            </div>
                          )}
                          {ministry.location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {ministry.location}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="group-hover:bg-purple-600 group-hover:text-white transition-colors text-xs w-full"
                        onClick={() => openMinistryDialog(ministry)}
                      >
                        Learn More
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Slide Indicators */}
          {showSlider && totalSlides > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Ministries Button */}
        <div className="text-center mt-10">
          <Button size="lg" variant="outline" asChild>
            <Link href="/ministries">
              All Ministries
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

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
                {/* Ministry Image */}
                {selectedMinistry.imageUrl && (
                  <div className="relative h-64 w-full overflow-hidden rounded-lg">
                    <Image
                      src={selectedMinistry.imageUrl}
                      alt={selectedMinistry.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Ministry Icon and Title */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                    {(() => {
                      const IconComponent = getMinistryIcon(selectedMinistry.name)
                      return <IconComponent className="h-8 w-8 text-white" />
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedMinistry.name}</h3>
                    {selectedMinistry.leader && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <Users className="h-4 w-4 mr-1" />
                        <span>Led by {selectedMinistry.leader}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">About This Ministry</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedMinistry.description || 'Join us in this ministry to serve God and our community. We welcome all who feel called to participate in this important work of the church.'}
                  </p>
                </div>

                {/* Meeting Details */}
                {(selectedMinistry.meetingTime || selectedMinistry.location) && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Meeting Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMinistry.meetingTime && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">When</p>
                            <p className="text-gray-600">{selectedMinistry.meetingTime}</p>
                          </div>
                        </div>
                      )}
                      {selectedMinistry.location && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900">Where</p>
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
                    <strong>New to this ministry?</strong> We welcome newcomers! Feel free to attend a meeting or contact our ministry leader to learn more about how you can get involved.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
          