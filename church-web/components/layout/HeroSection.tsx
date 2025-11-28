"use client"

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  Cross,
  Play,
  Heart,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/church-worship.jpg"
          alt="Church Worship"
          fill
          className="object-cover opacity-15"
          priority
          quality={90}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        {/* Modern gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-indigo-900/92 to-purple-900/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-fuchsia-400/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Main Content */}
          <motion.div 
            className="space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block"
            >
              <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-sm px-5 py-2.5 backdrop-blur-sm">
                <Cross className="w-4 h-4 mr-2" />
                Christ-Centered • Gospel-Driven
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight">
                <span className="text-white block">Welcome to a</span>
                <span className="relative inline-block mt-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                    Life-Changing
                  </span>
                </span>
                <span className="text-white block mt-2">Community</span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-xl text-gray-200 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                Experience authentic worship, powerful teaching, and genuine fellowship rooted in the Gospel of Jesus Christ.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button 
                asChild 
                size="lg" 
                className="group bg-white text-gray-900 hover:bg-gray-50 h-14 px-8 rounded-full font-semibold shadow-2xl hover:shadow-3xl transition-all text-base sm:text-lg"
              >
                <Link href="/events/plan-your-visit">
                  <Calendar className="mr-2 h-5 w-5" />
                  Plan Your Visit
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="group border-2 border-white/40 text-white hover:bg-white hover:border-white hover:text-gray-900 h-14 px-8 rounded-full font-semibold transition-all text-base sm:text-lg bg-white/5 backdrop-blur-sm"
              >
                <Link href="/sermons">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Sermons
                </Link>
              </Button>
            </motion.div>

            {/* Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
            >
              {[
                { icon: Calendar, title: "Sunday Service", subtitle: "9:00 & 11:00 AM" },
                { icon: MapPin, title: "Join Us", subtitle: "All Are Welcome" },
                // { icon: Heart, title: "Care & Support", subtitle: "We're Here For You" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-gray-300">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:grid grid-cols-2 gap-6"
          >
            {/* Card 1 - Video/Image */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
              className="col-span-2 relative rounded-3xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/10 h-64"
            >
              <video 
                className="w-full h-full object-cover opacity-80"
                autoPlay 
                muted 
                loop 
                playsInline
              >
                <source 
                  src="https://videos.pexels.com/video-files/5734826/5734826-sd_640_360_30fps.mp4" 
                  type="video/mp4" 
                />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 text-white">
                  <Play className="h-5 w-5" />
                  <span className="font-semibold">Watch Our Story</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2 - Community */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 backdrop-blur-sm border border-white/10 p-6"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Growing Together</h3>
                <p className="text-sm text-gray-200">Join our vibrant community of faith</p>
              </div>
            </motion.div>

            {/* Card 3 - Events */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-fuchsia-500/30 to-pink-600/30 backdrop-blur-sm border border-white/10 p-6"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Weekly Events</h3>
                <p className="text-sm text-gray-200">Connect through worship & fellowship</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
