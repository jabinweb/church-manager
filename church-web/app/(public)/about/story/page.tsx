'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Church, Heart, Users, Globe } from 'lucide-react'

export default function StoryPage() {
  const timeline = [
    {
      year: '1998',
      title: 'Humble Beginnings',
      description: 'Grace Community Church was founded by Pastor John and Mary Smith in their living room with just 12 faithful members.',
      icon: Church
    },
    {
      year: '2001',
      title: 'First Building',
      description: 'After three years of growth, we moved into our first dedicated church building on Faith Street.',
      icon: Heart
    },
    {
      year: '2008',
      title: 'Community Expansion',
      description: 'Launched our first community outreach programs, serving over 500 families in need.',
      icon: Users
    },
    {
      year: '2015',
      title: 'Global Missions',
      description: 'Began supporting missionaries worldwide and established partnerships in 5 countries.',
      icon: Globe
    },
    {
      year: '2020',
      title: 'Digital Ministry',
      description: 'Adapted to serve our community through online services and virtual small groups during the pandemic.',
      icon: Church
    },
    {
      year: '2024',
      title: 'Present Day',
      description: 'Today, we continue to grow as a vibrant community of over 500 members, impacting lives locally and globally.',
      icon: Heart
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Story
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            For over 25 years, Grace Community Church has been a beacon of hope and love in our community. 
            Here&apos;s how God has been working through our church family.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-purple-200"></div>
          
          <div className="space-y-12">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative flex items-start"
              >
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg relative z-10">
                  <item.icon className="h-6 w-6" />
                </div>
                
                {/* Content */}
                <div className="ml-8 flex-1">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="text-purple-600 font-bold text-lg mb-2">{item.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Closing Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Story Continues
              </h3>
              <p className="text-gray-700 text-lg">
                Every day, God writes new chapters in our story through the lives of our members. 
                We invite you to become part of our ongoing journey of faith, hope, and love.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
