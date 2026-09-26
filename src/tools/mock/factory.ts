import type { IntelligenceItem, IntelligenceTool, ToolResult } from '../types'
import { makeId } from '../../state/id'

type ItemSeed = Omit<IntelligenceItem, 'id' | 'timestamp'>

/**
 * Builds a mock tool from a static seed pool. Every execute() call resolves
 * after a short simulated network delay with one fresh item — standing in
 * for a real search/API/MCP call until one is wired up in `registry.ts`.
 */
export function createMockTool(id: string, name: string, description: string, sourceLabel: string, pool: ItemSeed[]): IntelligenceTool {
  return {
    id,
    name,
    description,
    isMock: true,
    sourceLabel,
    async execute(): Promise<ToolResult> {
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 700))
      const seed = pool[Math.floor(Math.random() * pool.length)]
      return {
        id: makeId('result'),
        toolId: id,
        timestamp: Date.now(),
        ok: true,
        isMock: true,
        sourceLabel,
        items: [{ ...seed, id: makeId('item'), timestamp: Date.now() }],
      }
    },
  }
}
