import type { AgentDefinition, AgentId } from '../agents/types'
import type { IntelligenceItem } from '../tools/types'
import type { LLMMessage } from '../llm/types'

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
 * Jarvis's policy for deciding whether a specialist's finding is worth a
 * second opinion from another specialist, and from whom. This is a plain
 * rule layer, separate from the LLM call that writes the briefing text —
 * real agent systems mix cheap deterministic policy with model reasoning,
 * and keeping this legible is what makes the facility feel like it reasons
 * instead of rolling dice.
 */
export function decideCorrelationTarget(from: AgentId, item: IntelligenceItem): AgentId | null {
  const tags = item.tags

  if (from === 'mancy' && tags.includes('transport') && item.severity !== 'low') return 'null'
  if (from === 'mancy' && tags.includes('development')) return 'atlas'
  if (from === 'null' && (tags.includes('infrastructure') || tags.includes('supply-chain'))) return 'atlas'
  if (from === 'atlas' && tags.includes('disaster')) return 'orbit'
  if (from === 'atlas' && tags.includes('infrastructure')) return 'null'
  if (from === 'orbit' && tags.includes('space-weather')) return 'null'
  return null
}

/** Prompt for a specialist writing a memory note about its own finding. */
export function buildMemoryPrompt(agent: AgentDefinition, item: IntelligenceItem): LLMMessage[] {
  return [
    { role: 'system', content: agent.systemPrompt },
    {
      role: 'user',
      content: `${item.title} — ${item.summary} Log this as one factual sentence.`,
    },
  ]
}

/** Prompt for a specialist asked by Jarvis to check a finding against its own memory. */
export function buildCorrelationPrompt(agent: AgentDefinition, fromName: string, findingContent: string, ownRecent: string | null): LLMMessage[] {
  return [
    { role: 'system', content: agent.systemPrompt },
    {
      role: 'user',
      content: ownRecent
        ? `${fromName} reported: "${findingContent}" You are currently tracking: "${ownRecent}" Answer in one sentence whether these are related.`
        : `${fromName} reported: "${findingContent}" Nothing in your memory relates to this yet. Answer in one sentence.`,
    },
  ]
}

/** Prompt for Jarvis synthesizing the final briefing line for the facility log. */
export function buildBriefingPrompt(jarvis: AgentDefinition, fromName: string, findingContent: string, correlation: { targetName: string; response: string } | null): LLMMessage[] {
  return [
    { role: 'system', content: jarvis.systemPrompt },
    {
      role: 'user',
      content: correlation
        ? `${fromName} reported: "${findingContent}" ${correlation.targetName} was asked to correlate and said: "${correlation.response}" Write one sentence for the facility briefing.`
        : `${fromName} reported: "${findingContent}" No correlation was needed. Write one sentence filing this in the facility briefing.`,
    },
  ]
}
