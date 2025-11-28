export type CallType = 'audio' | 'video'

export type CallStatus = 
  | 'idle'
  | 'calling'      // Outgoing call, waiting for answer
  | 'ringing'      // Incoming call, waiting for user to accept/reject
  | 'connecting'   // Call accepted, establishing connection
  | 'connected'    // Call in progress
  | 'ended'        // Call ended normally
  | 'rejected'     // Call was rejected
  | 'missed'       // Call was not answered
  | 'failed'       // Call failed due to error

export interface CallParticipant {
  id: string
  name: string
  image?: string | null
}

export interface CallState {
  status: CallStatus
  type: CallType
  isOutgoing: boolean
  caller: CallParticipant | null
  receiver: CallParticipant | null
  startTime: Date | null
  endTime: Date | null
  isMuted: boolean
  isVideoEnabled: boolean
  isSpeakerOn: boolean
  callId: string | null
  callerPeerId: string | null   // Store the caller's peer ID for connecting
}

export interface CallSignal {
  type: 'call_incoming' | 'call_accepted' | 'call_rejected' | 'call_ended' | 'call_failed'
  callId: string
  callType: CallType
  caller: CallParticipant
  receiver: CallParticipant
  peerId?: string           // The sender's peer ID
  callerPeerId?: string     // Original caller's peer ID (for accepting calls)
  timestamp: string
  reason?: string
}

export interface CallContextType {
  callState: CallState
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  startCall: (userId: string, userName: string, userImage: string | null, type: CallType) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  toggleSpeaker: () => void
}

export const initialCallState: CallState = {
  status: 'idle',
  type: 'audio',
  isOutgoing: false,
  caller: null,
  receiver: null,
  startTime: null,
  endTime: null,
  isMuted: false,
  isVideoEnabled: true,
  isSpeakerOn: false,
  callId: null,
  callerPeerId: null
}
