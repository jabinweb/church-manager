'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode } from 'react'

interface DashboardHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  backHref?: string
  actions?: ReactNode
}

export function DashboardHeader({ 
  title, 
  description, 
  icon, 
  backHref = "/dashboard",
  actions 
}: DashboardHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            asChild 
            className="w-10 h-10 rounded-full bg-gray-100 p-0 hover:bg-gray-200"
          >
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 text-sm">{description}</p>
              )}
            </div>
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { DashboardHeader as default }
