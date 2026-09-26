import type { AgentId } from './types'
import { agentRegistry } from './registry'
import type { AgentMemoryState } from '../memory/types'

/**
 * Heuristic conversational responder. This is NOT a language model — it is a
 * small rule-based function that answers using each agent's own memory, so
 * a conversation with Mancy differs from Null in substance, not just avatar.
 * Phase 5 (see project brief) replaces this with a real per-agent model
 * without changing the ChatDock component that calls it.
 */
export function buildHeuristicResponse(agentId: AgentId, userText: string, memory: AgentMemoryState): string {
  const def = agentRegistry[agentId]
  const text = userText.toLowerCase()

  const recent = memory.shortTerm[0]
  const recentLong = memory.longTerm[0]

  if (/status|doing|up to|busy/.test(text)) {
    return recent
      ? `Last thing I looked at: ${recent.content}`
      : `Nothing active right now. I'll flag it here the moment something in ${def.responsibilities[0].toLowerCase()} moves.`
  }

  if (/memory|remember|recall/.test(text)) {
    if (recentLong) return `Most recently filed: ${recentLong.content}`
    if (recent) return `Short-term, I'm holding: ${recent.content}`
    return `My memory is empty this session — nothing observed yet.`
  }

  if (/jarvis/.test(text) && agentId !== 'jarvis') {
    return `I report findings to Jarvis when something crosses my threshold. ${
      memory.relationships.jarvis ? `Last exchange: ${memory.relationships.jarvis.lastSummary}` : 'No exchanges yet this session.'
    }`
  }

  if (/who are you|what do you do|role/.test(text)) {
    return `${def.tagline} My permissions: ${def.permissions.join(', ')}.`
  }

  if (recent) {
    return `On ${def.responsibilities[0].toLowerCase()} — ${recent.content}`
  }

  return `I don't have anything concrete yet on that. I'm still ${def.isCoordinator ? 'listening to the facility' : `watching ${def.providerNames.length} feed${def.providerNames.length === 1 ? '' : 's'}`}.`
}
