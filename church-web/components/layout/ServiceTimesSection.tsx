"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  ArrowRight,
  MapPin
} from 'lucide-react'

interface ServiceScheduleItem {
  title: string
  times: string[]
  description: string
  highlight: string | null
  childcare: boolean
  icon: any
}

interface ServiceTimesSectionProps {
  serviceSchedule: ServiceScheduleItem[]
}

export function ServiceTimesSection({ serviceSchedule }: ServiceTimesSectionProps) {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('/images/cross-pattern.svg')] opacity-[0.02]" />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Join Us This Week
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Come as you are and be part of something greater
            </p>
          </motion.div>
        </div>
        
        {/* Service Cards - Professional Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {serviceSchedule.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                ease: [0.25, 0.4, 0.25, 1]
              }}
            >
              <div className="relative h-full p-10 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 group">
                {/* Gradient accent on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  {/* Icon with beautiful styling */}
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-all duration-500">
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {service.title}
                  </h3>
                  
                  {/* Times with gradient */}
                  <div className="space-y-2 mb-6">
                    {service.times.map((time, i) => (
                      <motion.div 
                        key={i} 
                        className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.15 + 0.3 + i * 0.1 }}
                      >
                        {time}
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-base leading-relaxed mb-6">
                    {service.description}
                  </p>
                  
                  {/* Tags with better styling */}
                  {(service.highlight || service.childcare) && (
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100">
                      {service.highlight && (
                        <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-full shadow-sm">
                          {service.highlight}
                        </span>
                      )}
                      {service.childcare && (
                        <span className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                          Childcare Available
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Professional CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <motion.div 
                className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </div>
            
            {/* <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-3xl sm:text-5xl font-bold text-white mb-6">
                  First Time Visiting?
                </h3>
                <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                  We'd love to meet you! Plan your visit and discover a welcoming community.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  size="lg" 
                  className="bg-white text-indigo-600 hover:bg-gray-50 px-10 py-7 text-lg font-semibold rounded-full shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300 group"
                  asChild
                >
                  <Link href="/events/plan-your-visit">
                    <Calendar className="mr-2 h-5 w-5" />
                    Plan Your Visit
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/80 text-white hover:bg-white/10 hover:border-white px-10 py-7 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link href="/contact">
                    <MapPin className="mr-2 h-5 w-5" />
                    Get Directions
                  </Link>
                </Button>
              </motion.div>
            </div> */}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
