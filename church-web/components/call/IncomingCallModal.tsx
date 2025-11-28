'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useCallContext } from '@/lib/contexts/CallContext'

export function IncomingCallModal() {
  const { callState, acceptCall, rejectCall } = useCallContext()

  const isRinging = callState.status === 'ringing'
  const caller = callState.caller

  // Audio is handled by useCall hook, no need for duplicate here

  if (!isRinging || !caller) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4"
        >
          {/* Caller Avatar with animated ring */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Animated rings */}
              <div className="absolute inset-0 animate-ping">
                <div className="w-32 h-32 rounded-full border-4 border-green-500/30"></div>
              </div>
              <div className="absolute inset-0 animate-pulse">
                <div className="w-32 h-32 rounded-full border-2 border-green-500/50"></div>
              </div>
              
              {/* Avatar */}
              {caller.image ? (
                <Image
                  src={caller.image}
                  alt={caller.name}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover relative z-10"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center relative z-10">
                  <span className="text-white text-4xl font-bold">
                    {caller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Caller Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{caller.name}</h2>
            <p className="text-gray-400 flex items-center justify-center gap-2">
              {callState.type === 'video' ? (
                <>
                  <Video className="w-4 h-4" />
                  Incoming video call...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Incoming audio call...
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-8">
            {/* Reject Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </Button>
              <p className="text-center text-gray-400 text-sm mt-2">Decline</p>
            </motion.div>

            {/* Accept Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
              >
                {callState.type === 'video' ? (
                  <Video className="w-7 h-7 text-white" />
                ) : (
                  <Phone className="w-7 h-7 text-white" />
                )}
              </Button>
              <p className="text-center text-gray-400 text-sm mt-2">Accept</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
