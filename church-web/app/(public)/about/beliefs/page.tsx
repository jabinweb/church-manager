'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Heart, Users, Globe, Cross, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BeliefsPage() {
  const beliefs = [
    {
      title: 'The Bible',
      icon: BookOpen,
      description: 'We believe the Bible is the inspired, infallible Word of God and our ultimate authority for faith and life.',
      scripture: '2 Timothy 3:16-17',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'The Trinity',
      icon: Crown,
      description: 'We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.',
      scripture: 'Matthew 28:19',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Salvation',
      icon: Cross,
      description: 'We believe salvation is by grace alone, through faith alone, in Christ alone.',
      scripture: 'Ephesians 2:8-9',
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'The Church',
      icon: Users,
      description: 'We believe the church is the body of Christ, called to worship, fellowship, and serve.',
      scripture: '1 Corinthians 12:27',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Christian Living',
      icon: Heart,
      description: 'We believe Christians are called to live holy lives, transformed by the Holy Spirit.',
      scripture: 'Romans 12:1-2',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'The Great Commission',
      icon: Globe,
      description: 'We believe Christians are called to make disciples of all nations.',
      scripture: 'Matthew 28:18-20',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ]

  const statementOfFaith = [
    {
      title: 'Scripture',
      content: 'We believe that the Holy Bible was written by men divinely inspired and is God\'s revelation of Himself to man. It is a perfect treasure of divine instruction. It has God for its author, salvation for its end, and truth, without any mixture of error, for its matter.'
    },
    {
      title: 'God',
      content: 'We believe that there is one and only one living and true God. He is an intelligent, spiritual, and personal Being, the Creator, Redeemer, Preserver, and Ruler of the universe.'
    },
    {
      title: 'Jesus Christ',
      content: 'We believe that Jesus Christ is the Son of God and was conceived of the Holy Spirit and born of the Virgin Mary. He lived a sinless life, died on the cross as a substitute for sinners, and rose bodily from the dead.'
    },
    {
      title: 'Holy Spirit',
      content: 'We believe that the Holy Spirit is a divine Person; equal with the Father and the Son and of the same nature. He convicts men of sin, of righteousness, and of judgment. He is the agent of regeneration.'
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
            What We Believe
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our beliefs are grounded in the Bible and centered on the gospel of Jesus Christ. 
            These core truths guide our worship, ministry, and daily living.
          </p>
        </motion.div>

        {/* Core Beliefs */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Core Beliefs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beliefs.map((belief, index) => (
              <motion.div
                key={belief.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${belief.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <belief.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl">{belief.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="mb-4 text-gray-600">
                      {belief.description}
                    </CardDescription>
                    <div className="text-sm font-medium text-purple-600">
                      {belief.scripture}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Statement of Faith */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Statement of Faith</h2>
            <div className="space-y-8">
              {statementOfFaith.map((item, index) => (
                <Card key={item.title}>
                  <CardHeader>
                    <CardTitle className="text-xl text-purple-600">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{item.content}</p>
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
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Questions About Our Beliefs?
              </h3>
              <p className="text-gray-700 text-lg mb-6">
                We&apos;d love to discuss our faith with you and answer any questions you might have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Contact a Pastor
                </Button>
                <Button variant="outline">
                  Join a Bible Study
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
