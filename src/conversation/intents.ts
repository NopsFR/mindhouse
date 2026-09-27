import type { AgentDefinition, AgentId } from '../agents/types'
import { agentRegistry, specialistIds } from '../agents/registry'

/**
 * `other` is the important bucket: real questions and requests. It is NOT
 * a dead end — it's what reaches a connected LLM, or (with no model) the
 * knowledge base and graceful fallback. Every other intent here exists only
 * to keep the heuristic layer from mistaking a bare topic, a follow-up, or
 * small talk for an unanswerable open-ended question.
 */
export type Intent = 'greeting' | 'thanks' | 'research' | 'chitchat' | 'topic' | 'continuation' | 'other'

const GREETING = /^\s*(hi|hey|hello|yo|sup|good (morning|afternoon|evening)|how'?s it going|how are you)\b/i
const THANKS = /^\s*(thanks|thank you|cheers|appreciate it)\b/i
/** Words that signal "I need this checked right now", not general/timeless knowledge. */
const RESEARCH_SIGNAL = /\b(today|latest|current|currently|recent|recently|now|happening|happened|this week|investigate|research|news|update)\b/i
/** Vague, undirected requests — a nudge to say more, not a dead end. */
const CHITCHAT = /^\s*(help me|i'?m bored|entertain me|say something|got any ideas)\s*\.?\s*$/i
/** A word/phrase that leans on whatever was just said, rather than standing alone. */
const CONTINUATION_PHRASES = ['tell me more', 'go on', 'continue', 'elaborate', 'why', 'and', 'so', 'interesting', 'how does that work', 'how does this work']
/** A message starting with these is a request/question, never a bare topic — even if it's short. */
const NON_TOPIC_START = /^(what|why|how|who|when|where|which|is|are|can|could|would|will|do|does|did|should|explain|describe|define|tell|investigate|research|write|help|give|show|list|compare|analyse|analyze)\b/i

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[.!?]+$/, '')
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function isContinuation(text: string): boolean {
  const n = normalize(text)
  if (CONTINUATION_PHRASES.includes(n)) return true
  return /^what about\b/i.test(text.trim())
}

/** A bare subject with nothing else to go on — "manchester", "cybersecurity" — not a question or command. */
function looksLikeBareTopic(text: string): boolean {
  const t = text.trim()
  if (t.includes('?')) return false
  if (NON_TOPIC_START.test(t)) return false
  return wordCount(t) > 0 && wordCount(t) <= 3
}

export function classifyIntent(text: string): Intent {
  if (GREETING.test(text)) return 'greeting'
  if (THANKS.test(text)) return 'thanks'
  if (wordCount(text) <= 4 && CHITCHAT.test(text)) return 'chitchat'
  if (isContinuation(text)) return 'continuation'
  if (RESEARCH_SIGNAL.test(text)) return 'research'
  if (looksLikeBareTopic(text)) return 'topic'
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

const CHITCHAT_REPLIES = ["What's on your mind?", 'Sure — what are you working on?', "Give me a topic and I'll dig in."]

export function pickChitchat(): string {
  return CHITCHAT_REPLIES[Math.floor(Math.random() * CHITCHAT_REPLIES.length)]
}

/** No model, no prior turn to lean on, and the message alone isn't enough — ask, don't dead-end. */
export function continuationReply(hasHistory: boolean): string {
  return hasHistory
    ? "I don't have more depth than that without a connected model right now — want to come at it from a different angle?"
    : 'More on what, exactly? Give me a bit to go on.'
}

/** Lowercase a responsibility for mid-sentence use, unless it's already an acronym (e.g. "CVEs" should stay "CVEs"). */
function toMidSentence(r: string): string {
  return /^[A-Z]{2,}/.test(r) ? r : r.charAt(0).toLowerCase() + r.slice(1)
}

/** A natural clarifying question built from an agent's own responsibilities — not a canned line about one topic. */
export function topicClarification(def: AgentDefinition, topic: string): string {
  const angles = def.responsibilities.slice(0, 2).map(toMidSentence)
  const cap = topic.charAt(0).toUpperCase() + topic.slice(1)
  return `${cap}, sure — are you after ${angles[0]}, ${angles[1]}, or what's going on there right now?`
}

/**
 * Jarvis's topic match against each specialist's declared `topics`. This is
 * the same kind of cheap deterministic policy layer as the correlation
 * rules in `simulation/engine.ts` — it decides WHO is relevant; the model
 * (real or heuristic) still writes the actual answer.
 */
export function detectRelevantSpecialists(text: string): AgentDefinition[] {
  const normalized = text.toLowerCase()
  const scored = specialistIds
    .map((id) => agentRegistry[id])
    .map((def) => ({ def, score: def.topics.filter((t) => normalized.includes(t)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, 2).map((s) => s.def)
}

export function detectRelevantSpecialist(text: string): AgentDefinition | null {
  return detectRelevantSpecialists(text)[0] ?? null
}

/** A specialist asked something outside its patch points the user somewhere better, instead of dead-ending. */
export function outOfDomainReply(agentId: AgentId, text: string): string {
  const def = agentRegistry[agentId]
  const other = detectRelevantSpecialists(text).find((d) => d.id !== agentId)
  const redirect = other ? `${other.name} might be a better bet for that, or ask Jarvis.` : 'Jarvis can help more broadly.'
  return `That's a bit outside my patch — I focus on ${toMidSentence(def.responsibilities[0])}. ${redirect}`
}
