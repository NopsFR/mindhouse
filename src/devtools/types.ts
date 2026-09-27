import type { AgentId } from '../agents/types'

export type ToolPermission = 'read' | 'write' | 'execute'

export interface DevTool {
  name: string
  description: string
  permission: ToolPermission
  /** JSON-schema-shaped, passed straight through to the model as its tool-calling spec. */
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
  run(args: Record<string, unknown>): Promise<{ ok: boolean; output: string }>
}

/** One real tool call, for the activity log — never fabricated, always the actual request/response. */
export interface ToolActivityRecord {
  id: string
  agentId: AgentId
  tool: string
  args: Record<string, unknown>
  ok: boolean
  output: string
  timestamp: number
}

export type AutonomyLevel = 0 | 1 | 2

export const AUTONOMY_LABELS: Record<AutonomyLevel, string> = {
  0: 'Chat only',
  1: 'Read workspace',
  2: 'Read + write + run',
}
