import type { AgentId } from '../agents/types'

export type MessageType = 'request' | 'response' | 'report' | 'alert' | 'question'

export interface AgentMessage {
  id: string
  from: AgentId
  to: AgentId
  type: MessageType
  content: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  timestamp: number
  /** 0-1 confidence the sending agent has in this content, when applicable. */
  confidence?: number
  metadata?: Record<string, string | number | boolean>
}
