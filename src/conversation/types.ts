import type { AgentId } from '../agents/types'

/**
 * The conversation layer. This is deliberately separate from `memory/` —
 * a ChatMessage is what the user and an agent actually said to each other,
 * never a dump of the agent's internal short/long-term intelligence memory.
 * See `agents/converse.ts` for the orchestrator that keeps that boundary.
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
  /** Present only when a real model produced this reply (vs. the heuristic layer). */
  modelMeta?: { providerId: string; model: string; latencyMs: number }
  /** Present only when answering this required asking one or more other agents — shown as a small aside, not inline text. */
  delegatedTo?: AgentId[]
  /** Where a delegated finding actually came from (a tool's sourceLabel) — only ever set when a real tool call happened. */
  sources?: string[]
}
