import type { AgentId } from '../agents/types'

export interface MemoryEntry {
  id: string
  timestamp: number
  content: string
  /** Where this memory came from — a tool id, another agent, or 'synthesis'. */
  source: string
  /** True unless this memory came from a real (non-mock) tool or model call. */
  isMock: boolean
}

export type TaskStatus = 'queued' | 'active' | 'done' | 'failed'

export interface AgentTask {
  id: string
  agentId: AgentId
  /** The tool this task will call, when it involves one. */
  toolId: string | null
  title: string
  status: TaskStatus
  priority: 'low' | 'normal' | 'high'
  createdAt: number
  completedAt: number | null
}

export interface RelationshipMemory {
  with: AgentId
  interactionCount: number
  lastInteractionAt: number
  lastSummary: string
}

export interface AgentMemoryState {
  shortTerm: MemoryEntry[]
  longTerm: MemoryEntry[]
  tasks: AgentTask[]
  relationships: Partial<Record<AgentId, RelationshipMemory>>
}

export const SHORT_TERM_LIMIT = 8
export const LONG_TERM_LIMIT = 24

export function emptyMemory(): AgentMemoryState {
  return { shortTerm: [], longTerm: [], tasks: [], relationships: {} }
}
