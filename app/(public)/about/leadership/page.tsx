'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Linkedin, Twitter } from 'lucide-react'

export default function LeadershipPage() {
  const leaders = [
    {
      name: 'Pastor Mike Johnson',
      title: 'Senior Pastor',
      bio: 'Pastor Mike has been leading Grace Community Church for over 15 years. He holds a Master of Divinity from Seminary and is passionate about expository preaching and discipleship.',
      email: 'pastor@gracechurch.org',
      phone: '(555) 123-4567',
      image: '/api/placeholder/300/300',
      specialties: ['Preaching', 'Counseling', 'Leadership Development']
    },
    {
      name: 'Sarah Williams',
      title: 'Associate Pastor',
      bio: 'Sarah oversees our youth and young adult ministries. She brings energy and creativity to our programs while maintaining a heart for biblical truth.',
      email: 'sarah@gracechurch.org',
      phone: '(555) 234-5678',
      image: '/api/placeholder/300/300',
      specialties: ['Youth Ministry', 'Worship', 'Small Groups']
    },
    {
      name: 'David Chen',
      title: 'Worship Pastor',
      bio: 'David leads our worship team and music ministry. He is a gifted musician and songwriter who helps our congregation connect with God through music.',
      email: 'david@gracechurch.org',
      image: '/api/placeholder/300/300',
      specialties: ['Music', 'Worship Leading', 'Arts Ministry']
    },
    {
      name: 'Lisa Rodriguez',
      title: 'Children\'s Ministry Director',
      bio: 'Lisa has a heart for children and families. She creates engaging programs that help kids learn about Jesus in age-appropriate ways.',
      email: 'lisa@gracechurch.org',
      image: '/api/placeholder/300/300',
      specialties: ['Children\'s Ministry', 'Family Ministry', 'Education']
    }
  ]

  const elders = [
    { name: 'Robert Thompson', role: 'Elder & Board Chair' },
    { name: 'Maria Gonzalez', role: 'Elder & Treasurer' },
    { name: 'James Wilson', role: 'Elder & Secretary' },
    { name: 'Patricia Davis', role: 'Elder & Outreach Coordinator' }
  ]

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
            Our Leadership
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the dedicated pastors and leaders who guide our church family 
            with wisdom, compassion, and biblical truth.
          </p>
        </motion.div>

        {/* Pastoral Staff */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Pastoral Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {leaders.map((leader, index) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full mx-auto mb-4"></div>
                    <CardTitle className="text-xl">{leader.name}</CardTitle>
                    <CardDescription className="text-purple-600 font-semibold">
                      {leader.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{leader.bio}</p>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Areas of Ministry:</h4>
                      <div className="flex flex-wrap gap-2">
                        {leader.specialties.map((specialty) => (
                          <span key={specialty} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      {leader.phone && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Board of Elders */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Board of Elders</h2>
            <Card>
              <CardHeader>
                <CardTitle>Church Governance</CardTitle>
                <CardDescription>
                  Our elders provide spiritual oversight and guidance for the church, 
                  serving with wisdom and dedication to God&apos;s calling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {elders.map((elder, index) => (
                    <div key={elder.name} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{elder.name}</h3>
                        <p className="text-gray-600 text-sm">{elder.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
