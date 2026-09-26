/**
 * Core agent domain model for MINDHOUSE.
 *
 * Three things are kept deliberately separate:
 *  - AGENT   (this file, `registry.ts`) — the intelligence: identity, brain, permissions, memory.
 *  - TOOLS   (`tools/`) — what an agent is allowed to use to touch the real world.
 *  - WORLD   (`world/`, `rooms/`) — how the user observes the agent. The room is not the AI.
 *
 * An agent is a static `AgentDefinition` (authored once in `registry.ts`)
 * plus a mutable `AgentRuntime` (state, current task) that lives in the
 * facility store. Adding a new agent means adding one `AgentDefinition`,
 * one tool set, and one room component — nothing else needs to change.
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

/** Capability strings checked before an agent may take certain actions. See `permissions.ts`. */
export type Permission =
  | 'tool:execute'
  | 'agent:report'
  | 'agent:delegate'
  | 'agent:answer'
  | 'memory:write'

export interface AgentBrain {
  /** Relative capability tier, 1 (lightweight) to 5 (most capable). Not a literal IQ score. */
  tier: 1 | 2 | 3 | 4 | 5
  /** Where inference actually runs. 'mock' is the only one active until a model is connected. */
  provider: 'mock' | 'local' | 'cloud'
  /** The real model name for `local`/`cloud`, or 'heuristic-v1' for `mock`. Never invented. */
  model: string
  contextWindow?: number
  capabilities: string[]
}

export interface AgentDefinition {
  id: AgentId
  name: string
  role: string
  tagline: string
  personality: string[]
  /** Accent color used as this agent's room-lighting tint (hex). */
  accent: string
  /** Real system instructions — used verbatim as the system message for this agent's LLM calls. */
  systemPrompt: string
  brain: AgentBrain
  permissions: Permission[]
  /** Explicit allow-list of tool ids (see `tools/registry.ts`). This IS the permission boundary for tools. */
  toolIds: string[]
  responsibilities: string[]
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
