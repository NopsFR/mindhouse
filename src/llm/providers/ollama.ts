import type { LLMProvider, LLMRequest, LLMResponse } from '../types'

const BASE_URL = 'http://localhost:11434'

/**
 * A REAL local model provider — it calls the user's own Ollama daemon on
 * localhost. This is genuinely wired up, not a placeholder: if Ollama is
 * running with a model pulled, this provider actually talks to it. It is
 * safe to call directly from the browser because nothing here is a secret —
 * it's a request to a process on the user's own machine (Ollama must have
 * `OLLAMA_ORIGINS` permitting the page's origin, or run with default local
 * settings). Contrast with `cloud.ts`, which must NOT be called this way.
 */
async function listModels(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(1500) })
  if (!res.ok) throw new Error(`Ollama responded ${res.status}`)
  const data = (await res.json()) as { models?: { name: string }[] }
  return (data.models ?? []).map((m) => m.name)
}

export function createOllamaProvider(model: string): LLMProvider {
  return {
    id: 'ollama',
    name: `Local (Ollama: ${model})`,
    async isAvailable() {
      try {
        const models = await listModels()
        return models.includes(model)
      } catch {
        return false
      }
    },
    async generate(request: LLMRequest): Promise<LLMResponse> {
      const start = Date.now()
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: request.messages, stream: false }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`)
      const data = (await res.json()) as { message?: { content: string } }
      return {
        content: data.message?.content?.trim() ?? '',
        providerId: 'ollama',
        model,
        isMock: false,
        latencyMs: Date.now() - start,
      }
    },
  }
}

export { listModels as listOllamaModels, BASE_URL as OLLAMA_BASE_URL }
