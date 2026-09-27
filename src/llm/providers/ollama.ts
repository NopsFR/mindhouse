import type { LLMMessage, LLMProvider, LLMRequest, LLMResponse, ToolCall } from '../types'

const BASE_URL = 'http://localhost:11434'

/**
 * A REAL local model provider — it calls the user's own Ollama daemon on
 * localhost. This is genuinely wired up, not a placeholder: if Ollama is
 * running with a model pulled, this provider actually talks to it. It is
 * safe to call directly from the browser because nothing here is a secret —
 * it's a request to a process on the user's own machine (Ollama must have
 * `OLLAMA_ORIGINS` permitting the page's origin, or run with default local
 * settings). Contrast with `cloud.ts`, which must NOT be called this way.
 *
 * Tool-calling: passed through to Ollama's OpenAI-style `tools` field. Not
 * every model supports it — if the model ignores tools and just replies,
 * `toolCalls` is simply absent on the response and the caller treats it as
 * a normal final answer. Nothing here fabricates a tool call.
 */
async function listModels(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(1500) })
  if (!res.ok) throw new Error(`Ollama responded ${res.status}`)
  const data = (await res.json()) as { models?: { name: string }[] }
  return (data.models ?? []).map((m) => m.name)
}

interface OllamaWireMessage {
  role: string
  content: string
  tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[]
  name?: string
}

function toWireMessage(m: LLMMessage): OllamaWireMessage {
  const wire: OllamaWireMessage = { role: m.role, content: m.content }
  if (m.toolCalls?.length) {
    wire.tool_calls = m.toolCalls.map((tc) => ({ function: { name: tc.name, arguments: tc.arguments } }))
  }
  if (m.role === 'tool' && m.toolName) wire.name = m.toolName
  return wire
}

export function createOllamaProvider(model: string): LLMProvider {
  return {
    id: 'ollama',
    name: `Local (Ollama: ${model})`,
    supportsTools: true,
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
        body: JSON.stringify({
          model,
          messages: request.messages.map(toWireMessage),
          stream: false,
          ...(request.tools?.length ? { tools: request.tools.map((t) => ({ type: 'function', function: t })) } : {}),
        }),
        signal: AbortSignal.timeout(60000),
      })
      if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`)
      const data = (await res.json()) as {
        message?: { content: string; tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[] }
      }
      const rawCalls = data.message?.tool_calls
      const toolCalls: ToolCall[] | undefined = rawCalls?.length
        ? rawCalls.map((c, i) => ({ id: `call_${Date.now()}_${i}`, name: c.function.name, arguments: c.function.arguments ?? {} }))
        : undefined
      return {
        content: data.message?.content?.trim() ?? '',
        providerId: 'ollama',
        model,
        isMock: false,
        latencyMs: Date.now() - start,
        toolCalls,
      }
    },
  }
}

export { listModels as listOllamaModels, BASE_URL as OLLAMA_BASE_URL }
