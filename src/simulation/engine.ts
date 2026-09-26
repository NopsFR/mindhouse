import type { AgentId } from '../agents/types'
import type { IntelligenceItem } from '../providers/types'

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function randomBetween(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs)
}

export function confidenceFor(item: IntelligenceItem): number {
  const base = item.severity === 'high' ? 0.9 : item.severity === 'medium' ? 0.82 : 0.75
  return Math.min(0.98, base + Math.random() * 0.1)
}

/**
 * Jarvis's rule for deciding whether a specialist's finding is worth a
 * second opinion from another specialist, and from whom. This is
 * intentionally simple and legible rather than random — it is what makes
 * the facility feel like it reasons instead of rolling dice.
 */
export function decideCorrelationTarget(from: AgentId, item: IntelligenceItem): AgentId | null {
  const tags = item.tags

  if (from === 'mancy' && tags.includes('transport') && item.severity !== 'low') {
    return 'null'
  }
  if (from === 'mancy' && tags.includes('development')) {
    return 'atlas'
  }
  if (from === 'null' && (tags.includes('infrastructure') || tags.includes('supply-chain'))) {
    return 'atlas'
  }
  if (from === 'atlas' && tags.includes('disaster')) {
    return 'orbit'
  }
  if (from === 'atlas' && tags.includes('infrastructure')) {
    return 'null'
  }
  if (from === 'orbit' && tags.includes('space-weather')) {
    return 'null'
  }
  return null
}

/** A short, grounded line Jarvis writes when filing a finding with no correlation needed. */
export function soloBriefingLine(agentName: string, item: IntelligenceItem): string {
  return `${agentName}: ${item.title}. Filed, no cross-domain correlation required.`
}

export function correlatedBriefingLine(
  agentName: string,
  targetName: string,
  item: IntelligenceItem,
  relevant: boolean,
): string {
  return relevant
    ? `${agentName}: ${item.title}. ${targetName} confirmed related activity — merged into the active picture.`
    : `${agentName}: ${item.title}. ${targetName} found no related activity — filed as isolated.`
}
