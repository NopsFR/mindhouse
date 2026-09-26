/**
 * Tool abstraction. An agent never talks to a specific API, MCP server, or
 * database directly — it calls a `IntelligenceTool` by id through the
 * registry (see `registry.ts`), which enforces that agent's permission to
 * use it. A future MCP-backed tool implements this exact interface, so
 * nothing above this layer (agents, the simulation engine) needs to change
 * when a mock tool is replaced by a real one.
 *
 *   Agent -> Tool Registry (permission check) -> IntelligenceTool -> MCP / HTTP API / local process
 */

export interface IntelligenceItem {
  id: string
  title: string
  summary: string
  timestamp: number
  tags: string[]
  severity?: 'low' | 'medium' | 'high'
}

export interface ToolResult {
  id: string
  toolId: string
  timestamp: number
  ok: boolean
  items: IntelligenceItem[]
  error?: string
  /** True for every tool currently in this codebase. A real tool sets this false. */
  isMock: boolean
  /** Human-readable origin, always shown in the UI next to anything this tool produced. */
  sourceLabel: string
}

export interface IntelligenceTool {
  id: string
  name: string
  description: string
  isMock: boolean
  sourceLabel: string
  execute(input?: unknown): Promise<ToolResult>
}
