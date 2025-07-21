'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Clock, MapPin, Phone, Mail, CarFront, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { useSystemSettings } from '@/lib/useSystemSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function VisitPage() {
  const { churchName, churchAddress } = useSystemSettings()
  const [activeTab, setActiveTab] = useState('visit-info')

  // Sample service times - these could come from an API or CMS
  const serviceTimes = [
    { day: 'Sunday', time: '9:00 AM', name: 'Contemporary Service' },
    { day: 'Sunday', time: '11:00 AM', name: 'Traditional Service' },
    { day: 'Wednesday', time: '7:00 PM', name: 'Midweek Bible Study' },
    { day: 'Saturday', time: '6:00 PM', name: 'Prayer Meeting' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-gradient-to-r from-purple-900 to-purple-700 overflow-hidden">
        <Image 
          src="/images/church-exterior.jpg"
          alt="Church Building"
          fill
          className="object-cover opacity-30"
          priority
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            Visit {churchName || 'Our Church'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-white/90 max-w-2xl"
          >
            We&apos;re excited to welcome you to our church family. Here&apos;s everything you need to know before your visit.
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <Tabs defaultValue="visit-info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="visit-info">Plan Your Visit</TabsTrigger>
              <TabsTrigger value="what-to-expect">What to Expect</TabsTrigger>
              <TabsTrigger value="faq">FAQs</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="visit-info" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Service Times and Location */}
              <div className="md:col-span-2 space-y-8">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <Clock className="mr-2 text-purple-600 h-5 w-5" />
                      Service Times
                    </h2>
                    <div className="space-y-4">
                      {serviceTimes.map((service, index) => (
                        <div 
                          key={index} 
                          className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <h3 className="font-medium text-lg">{service.name}</h3>
                            <p className="text-gray-600">{service.day}</p>
                          </div>
                          <div className="mt-1 md:mt-0">
                            <span className="inline-block bg-purple-100 text-purple-800 font-medium px-3 py-1 rounded-full">
                              {service.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <MapPin className="mr-2 text-purple-600 h-5 w-5" />
                      Our Location
                    </h2>
                    <div className="mb-4">
                      <p className="text-lg">{churchAddress || '123 Church Street, Cityville, ST 12345'}</p>
                      <p className="text-gray-600 mt-2">
                        We&apos;re located near downtown, with convenient access from major highways.
                        Plenty of free parking available on-site.
                      </p>
                    </div>
                    <div className="aspect-[16/9] w-full rounded-md overflow-hidden bg-gray-100">
                      <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3016.0169292683133!2d-73.98825548436338!3d40.74844097932764!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a61dae0e9b%3A0x71a5889abf92dc5a!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1631234567890!5m2!1sen!2sus" 
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen={true}
                        loading="lazy"
                        title="Church Location Map"
                      ></iframe>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Planning Your Visit */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Plan Your First Visit</h2>
                    <p className="mb-6">Let us know you&apos;re coming, and we&apos;ll have a welcome gift ready for you!</p>
                    <Button variant="secondary" size="lg" className="w-full" asChild>
                      <Link href="/events/plan-your-visit">
                        Reserve Your Sunday
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h2 className="text-xl font-semibold">How to Get Here</h2>
                    
                    <div>
                      <h3 className="font-medium flex items-center">
                        <CarFront className="mr-2 text-purple-600 h-4 w-4" />
                        By Car
                      </h3>
                      <p className="text-gray-600 mt-1">Free parking available in our lot and on surrounding streets.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium flex items-center">
                        <Home className="mr-2 text-purple-600 h-4 w-4" />
                        From Highway 101
                      </h3>
                      <p className="text-gray-600 mt-1">Take exit 25, turn right on Main St. We&apos;re 2 blocks down on the left.</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h2 className="text-xl font-semibold">Contact Us</h2>
                    
                    <div className="flex items-center">
                      <Phone className="text-purple-600 h-4 w-4 mr-3" />
                      <p className="text-gray-800">(555) 123-4567</p>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail className="text-purple-600 h-4 w-4 mr-3" />
                      <p className="text-gray-800">info@yourchurch.org</p>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/contact">Contact Form</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="what-to-expect" className="mt-0">
            <div className="max-w-4xl mx-auto space-y-8">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-4">Your First Visit</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-medium text-purple-700">What to Wear</h3>
                      <p className="mt-2 text-gray-700">
                        Come as you are! You&apos;ll see people in everything from casual jeans to business casual. 
                        We care about you, not your wardrobe.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-purple-700">When to Arrive</h3>
                      <p className="mt-2 text-gray-700">
                        We recommend arriving about 15 minutes before the service starts. 
                        This will give you time to park, check in your children (if applicable), 
                        and find a comfortable seat.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-purple-700">The Service Experience</h3>
                      <p className="mt-2 text-gray-700">
                        Our services typically last about 75 minutes. We begin with contemporary worship music, 
                        followed by a relevant, Scripture-based message. We end with a response time for 
                        prayer and reflection.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-4">For Families</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-medium text-purple-700">Children&apos;s Ministry</h3>
                      <p className="mt-2 text-gray-700">
                        We offer safe, engaging children&apos;s programs during all services for kids from birth through 5th grade. 
                        Our check-in process ensures your child&apos;s safety and gives you peace of mind while you enjoy the service.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-purple-700">Youth Ministry</h3>
                      <p className="mt-2 text-gray-700">
                        Students in 6th-12th grade meet during our midweek service for relevant teaching, 
                        worship, small groups, and fun activities designed specifically for them.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-medium text-purple-700">Accessibility</h3>
                    <p className="mt-2 text-gray-700">
                      Our facility is wheelchair accessible with designated parking spaces near the main entrance.
                      Assisted listening devices are available at the welcome center.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-medium text-purple-700">Refreshments</h3>
                    <p className="mt-2 text-gray-700">
                      Enjoy complimentary coffee and refreshments in our lobby before and after each service.
                      It&apos;s a great way to meet others and get connected.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="faq" className="mt-0">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-purple-700">How long are your services?</h3>
                      <p className="mt-1 text-gray-700">
                        Our services typically last 70-80 minutes, including worship, announcements, and the message.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-purple-700">What kind of music do you play?</h3>
                      <p className="mt-1 text-gray-700">
                        Our worship style is contemporary with a mix of modern worship songs and updated hymns.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-purple-700">Do I need to bring a Bible?</h3>
                      <p className="mt-1 text-gray-700">
                        While we encourage you to bring your Bible, all Scripture references are displayed on screens. 
                        We also have Bibles available to use during the service.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-purple-700">Is there a dress code?</h3>
                      <p className="mt-1 text-gray-700">
                        No dress code - come as you are! You&apos;ll see people in everything from jeans to business casual.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-purple-700">Will I be asked to give money?</h3>
                      <p className="mt-1 text-gray-700">
                        While we do receive an offering during services, as a guest, please don&apos;t feel obligated to give.
                        Your presence is your gift to us.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-purple-700">How do I get connected beyond Sunday?</h3>
                      <p className="mt-1 text-gray-700">
                        We encourage everyone to join a small group and serve on a ministry team. 
                        Visit our Connection Center after the service to learn about next steps.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-purple-700">What about communion/baptism?</h3>
                      <p className="mt-1 text-gray-700">
                        We celebrate communion monthly, usually on the first Sunday. 
                        We have baptism services quarterly - speak with a pastor if you&apos;re interested in being baptized.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-4">Still have questions about visiting?</p>
                <Button asChild>
                  <Link href="/contact">
                    Contact Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* CTA Section */}
      <div className="bg-purple-100 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Visit?</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            We can&apos;t wait to meet you and help you find your place in our church family.
            Let us know you&apos;re coming and we&apos;ll have a special gift waiting for you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700" asChild>
              <Link href="/events/plan-your-visit">
                Plan Your Visit
                <Calendar className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Learn More About Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
