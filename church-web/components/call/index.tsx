'use client'

import { IncomingCallModal } from './IncomingCallModal'
import { CallScreen } from './CallScreen'
import { useCallContext } from '@/lib/contexts/CallContext'

export function CallUI() {
  const { callState } = useCallContext()
  
  return (
    <>
      {/* Incoming Call Modal */}
      {callState.status === 'ringing' && <IncomingCallModal />}
      
      {/* Active Call Screen */}
      {['calling', 'connecting', 'connected'].includes(callState.status) && <CallScreen />}
    </>
  )
}

export { IncomingCallModal } from './IncomingCallModal'
export { CallScreen } from './CallScreen'
