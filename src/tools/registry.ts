import type { AgentDefinition } from '../agents/types'
import type { IntelligenceTool } from './types'
import { localNewsTool, transportStatusTool, regionalWeatherTool } from './mock/mancy'
import { cveLookupTool, securityResearchTool, threatIntelTool } from './mock/null'
import { globalNewsTool } from './mock/atlas'
import { spaceMissionsTool, scienceResearchTool } from './mock/orbit'

/**
 * Every tool wired into the facility, keyed by id. This is the ONLY place
 * that changes to swap a mock tool for a real one (an MCP server, an HTTP
 * API, a local process) — agents and the simulation engine only ever see
 * the `IntelligenceTool` interface via `toolsForAgent`.
 */
export const toolRegistry: Record<string, IntelligenceTool> = {
  [localNewsTool.id]: localNewsTool,
  [transportStatusTool.id]: transportStatusTool,
  [regionalWeatherTool.id]: regionalWeatherTool,
  [cveLookupTool.id]: cveLookupTool,
  [securityResearchTool.id]: securityResearchTool,
  [threatIntelTool.id]: threatIntelTool,
  [globalNewsTool.id]: globalNewsTool,
  [spaceMissionsTool.id]: spaceMissionsTool,
  [scienceResearchTool.id]: scienceResearchTool,
}

/** The permission boundary: an agent only ever sees the tools explicitly assigned to it. */
export function toolsForAgent(agent: AgentDefinition): IntelligenceTool[] {
  return agent.toolIds.map((id) => toolRegistry[id]).filter((t): t is IntelligenceTool => Boolean(t))
}

export function canUseTool(agent: AgentDefinition, toolId: string): boolean {
  return agent.toolIds.includes(toolId)
}
