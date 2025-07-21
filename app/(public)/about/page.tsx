'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Heart, 
  Users, 
  Globe, 
  Church,
  ChevronRight,
  Calendar,
  MapPin
} from 'lucide-react'

export default function AboutPage() {
  const aboutSections = [
    {
      title: 'Our Story',
      description: 'Learn about our church history and how God has been working in our community.',
      icon: Church,
      href: '/about/story',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Leadership',
      description: 'Meet our pastoral team and church leaders who guide our ministry.',
      icon: Users,
      href: '/about/leadership',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Our Beliefs',
      description: 'Discover what we believe about God, salvation, and Christian living.',
      icon: Heart,
      href: '/about/beliefs',
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Vision & Mission',
      description: 'Understand our calling and purpose as a church community.',
      icon: Globe,
      href: '/about/vision',
      color: 'bg-green-100 text-green-600'
    }
  ]

  const stats = [
    { number: '25+', label: 'Years of Ministry' },
    { number: '500+', label: 'Active Members' },
    { number: '50+', label: 'Ministry Programs' },
    { number: '12', label: 'Community Outreaches' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                About Grace
                <span className="text-yellow-300"> Community Church</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                We are a loving community of believers committed to growing in faith, 
                serving others, and sharing the love of Jesus Christ.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Sections */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get to Know Us Better
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore different aspects of our church community and discover what makes us unique.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aboutSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={section.href} className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className={`w-16 h-16 ${section.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <section.icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-xl text-center">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="mb-4">
                        {section.description}
                      </CardDescription>
                      <div className="flex items-center justify-center text-purple-600 group-hover:text-purple-700">
                        <span className="text-sm font-medium">Learn More</span>
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Our Community
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              We&apos;d love to welcome you into our church family. Come as you are and 
              experience God&apos;s love in our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100" asChild>
                <Link href="/visit">
                  Plan Your Visit
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
                