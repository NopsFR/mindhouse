import type { AgentBrain } from '../agents/types'
import type { LLMProvider } from './types'
import { mockLLMProvider } from './providers/mock'
import { createOllamaProvider } from './providers/ollama'
import { createUnconfiguredCloudProvider } from './providers/cloud'

const cloudProvider = createUnconfiguredCloudProvider('anthropic')

/** Ollama providers are created per-model on demand (see `connectLocalModel` in the store). */
const ollamaProviders = new Map<string, LLMProvider>()

export function resolveLLM(brain: AgentBrain): LLMProvider {
  if (brain.provider === 'mock') return mockLLMProvider
  if (brain.provider === 'cloud') return cloudProvider
  // local
  let provider = ollamaProviders.get(brain.model)
  if (!provider) {
    provider = createOllamaProvider(brain.model)
    ollamaProviders.set(brain.model, provider)
  }
  return provider
}

export { mockLLMProvider }
