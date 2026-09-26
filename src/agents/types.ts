/**
 * Core agent domain model for MINDHOUSE.
 *
 * An agent is a static `AgentDefinition` (identity, brain, permissions —
 * authored once in `registry.ts`) plus a mutable `AgentRuntime` (state,
 * current task, memory) that lives in the facility store. Adding a new
 * agent means adding one `AgentDefinition`, one provider set, and one room
 * component — nothing else in the simulation needs to change.
 */

export type AgentId = 'jarvis' | 'mancy' | 'null' | 'atlas' | 'orbit'

/** What an agent is doing right now. The UI reacts to this, not to timers. */
export type AgentState =
  | 'idle'
  | 'thinking'
  | 'researching'
  | 'processing'
  | 'communicating'
  | 'waiting'
  | 'reporting'

export interface AgentBrain {
  /** Relative capability tier, 1 (lightweight) to 5 (most capable). Not a literal IQ score. */
  tier: 1 | 2 | 3 | 4 | 5
  /** Reserved for Phase 5 — the real model this agent will call once connected. */
  model?: string
  contextWindow?: number
  capabilities: string[]
}

export interface AgentDefinition {
  id: AgentId
  name: string
  role: string
  tagline: string
  personality: string[]
  /** Accent color used throughout that agent's room, in the CSS variable sense (hex). */
  accent: string
  brain: AgentBrain
  permissions: string[]
  responsibilities: string[]
  /** Names of the IntelligenceProviders this agent draws from — see providers/registry.ts */
  providerNames: string[]
  /** True for the coordinator. Only one agent should set this. */
  isCoordinator?: boolean
}

export interface AgentRuntime {
  id: AgentId
  state: AgentState
  /** Free-text description of the current activity, shown in the room. */
  activity: string | null
  currentTaskId: string | null
  lastActivityAt: number
}
