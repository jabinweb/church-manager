'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Heart, Users, Globe, BookOpen, Compass } from 'lucide-react'
import Link from 'next/link'

export default function VisionPage() {
  const visionPoints = [
    {
      title: 'Worship',
      description: 'To glorify God through authentic, Spirit-led worship that transforms hearts.',
      icon: Heart,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Discipleship',
      description: 'To grow disciples who love God, love others, and make disciples.',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Community',
      description: 'To build a loving community where everyone belongs and is valued.',
      icon: Users,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Mission',
      description: 'To reach our community and the world with the gospel of Jesus Christ.',
      icon: Globe,
      color: 'bg-purple-100 text-purple-600'
    }
  ]

  const coreValues = [
    {
      title: 'Biblical Truth',
      description: 'We believe the Bible is God\'s Word and our ultimate authority for faith and practice.',
      verse: '2 Timothy 3:16-17'
    },
    {
      title: 'Grace & Love',
      description: 'We extend God\'s grace and love to all people, regardless of their background or circumstances.',
      verse: 'Ephesians 2:8-9'
    },
    {
      title: 'Authentic Community',
      description: 'We pursue genuine relationships where people can be real, find healing, and grow together.',
      verse: 'Acts 2:42-47'
    },
    {
      title: 'Servant Leadership',
      description: 'We lead by serving others, following the example of Jesus Christ.',
      verse: 'Mark 10:43-44'
    },
    {
      title: 'Excellence',
      description: 'We strive for excellence in all we do as an offering to God and service to others.',
      verse: 'Colossians 3:23'
    },
    {
      title: 'Generosity',
      description: 'We give generously of our time, talents, and treasures to advance God\'s kingdom.',
      verse: '2 Corinthians 9:7'
    }
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
            Vision & Mission
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our God-given vision and mission that guides everything we do 
            as a church community.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-12 text-center">
              <Target className="h-16 w-16 text-purple-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                &quot;To know Christ and make Him known by loving God, loving people, 
                and serving our community through the power of the Holy Spirit.&quot;
              </p>
              <div className="mt-8">
                <span className="text-purple-600 font-semibold">Matthew 28:19-20 | Acts 1:8</span>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Vision Points */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Vision</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {visionPoints.map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-16 h-16 ${point.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <point.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl">{point.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{point.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Core Values */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {coreValues.map((value, index) => (
                <Card key={value.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-purple-600 flex items-center">
                      <Compass className="h-5 w-5 mr-2" />
                      {value.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{value.description}</p>
                    <div className="text-sm font-medium text-purple-600">{value.verse}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <Card className="bg-purple-600 text-white">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-6">Join Our Mission</h3>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                God is calling ordinary people to do extraordinary things. 
                Come and be part of what He&apos;s doing at Grace Community Church.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100" asChild>
                  <Link href="/visit">Start Your Journey</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600" asChild>
                  <Link href="/ministries">Get Involved</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
