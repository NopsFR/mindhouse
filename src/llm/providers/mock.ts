import type { LLMProvider, LLMRequest, LLMResponse } from '../types'

/**
 * The default provider for every agent until a real one is connected.
 * It is NOT a language model — it is a small deterministic function that
 * condenses the prompt it's given into a single sentence. It exists so the
 * simulation engine, memory, and UI can all be built and tested against the
 * real `LLMProvider` interface today, and swapped for `ollama` or a cloud
 * provider later without touching any call site.
 */
/** Every instruction clause this mock is ever given starts with one of these — see simulation/engine.ts. */
const INSTRUCTION_PREFIX = /^(log|write|file|answer|say|note|compare)\b/i

function condense(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const sentences = clean.split(/(?<=[.!?])\s/).filter((s) => !INSTRUCTION_PREFIX.test(s.trim()))
  const taken = sentences.join(' ') || clean
  return taken.length > 260 ? `${taken.slice(0, 257)}...` : taken
}

export const mockLLMProvider: LLMProvider = {
  id: 'mock',
  name: 'Simulation',
  async isAvailable() {
    return true
  },
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 500))
    const lastUser = [...request.messages].reverse().find((m) => m.role === 'user')
    const content = condense(lastUser?.content ?? '')
    return {
      content,
      providerId: 'mock',
      model: 'heuristic-v1',
      isMock: true,
      latencyMs: Date.now() - start,
    }
  },
}
