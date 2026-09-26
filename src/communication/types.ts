import type { AgentId } from '../agents/types'

export type MessageType =
  | 'finding'
  | 'request'
  | 'response'
  | 'briefing'
  | 'correlation'

export interface AgentMessage {
  id: string
  from: AgentId
  to: AgentId
  timestamp: number
  type: MessageType
  content: string
  priority: 'low' | 'normal' | 'high'
  /** 0-1 confidence the sending agent has in this content, when applicable. */
  confidence?: number
  metadata?: Record<string, string | number | boolean>
}
