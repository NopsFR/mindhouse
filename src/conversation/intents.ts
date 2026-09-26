import type { AgentDefinition, AgentId } from '../agents/types'
import { agentRegistry, specialistIds } from '../agents/registry'

export type Intent = 'greeting' | 'thanks' | 'research' | 'other'

const GREETING = /^\s*(hi|hey|hello|yo|sup|good (morning|afternoon|evening)|how'?s it going|how are you)\b/i
const THANKS = /^\s*(thanks|thank you|cheers|appreciate it)\b/i
/** Words that signal "I need this checked right now", not general/timeless knowledge. */
const RESEARCH_SIGNAL = /\b(today|latest|current|currently|recent|recently|now|happening|happened|this week|investigate|research|news|update)\b/i

export function classifyIntent(text: string): Intent {
  if (GREETING.test(text)) return 'greeting'
  if (THANKS.test(text)) return 'thanks'
  if (RESEARCH_SIGNAL.test(text)) return 'research'
  return 'other'
}

const GREETINGS: Record<AgentId, string[]> = {
  jarvis: ["Hey. What can I help with?", "Hi there — what's on your mind?", "Hey, good to hear from you. What do you need?"],
  mancy: ["Hiya! What do you want to know about Manchester?", "Hey — ask away."],
  null: ['Go ahead.', "Hi. What are we looking at?"],
  atlas: ["Hello. What's the topic?", 'Hi there.'],
  orbit: ['Hey! What are we exploring today?', 'Hi — space, science, ask away.'],
}

export function pickGreeting(agentId: AgentId): string {
  const options = GREETINGS[agentId]
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Jarvis's topic match against each specialist's declared `topics`. This is
 * the same kind of cheap deterministic policy layer as the correlation
 * rules in `simulation/engine.ts` — it decides WHO is relevant; the model
 * (real or heuristic) still writes the actual answer.
 */
export function detectRelevantSpecialist(text: string): AgentDefinition | null {
  const normalized = text.toLowerCase()
  let best: { score: number; def: AgentDefinition } | null = null
  for (const id of specialistIds) {
    const def = agentRegistry[id]
    const score = def.topics.filter((t) => normalized.includes(t)).length
    if (score > 0 && (!best || score > best.score)) best = { score, def }
  }
  return best?.def ?? null
}
