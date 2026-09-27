/**
 * Model abstraction. An agent's `brain` names a provider id and a model,
 * never a hard-coded call site — so one agent can run on a local model
 * while another runs on a cloud model, and swapping either is a one-line
 * config change in `agents/registry.ts`, not a rewrite of the simulation.
 */

export type LLMRole = 'system' | 'user' | 'assistant' | 'tool'

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface LLMMessage {
  role: LLMRole
  content: string
  /** Set on an assistant message that requested tool calls, so history replays correctly. */
  toolCalls?: ToolCall[]
  /** Set on a 'tool' role message — which tool this is the result of. */
  toolName?: string
}

export interface ToolSpec {
  name: string
  description: string
  parameters: { type: 'object'; properties: Record<string, { type: string; description: string }>; required: string[] }
}

export interface LLMRequest {
  messages: LLMMessage[]
  maxTokens?: number
  /** Only meaningful to providers that actually support tool-calling (currently: ollama). Others ignore it. */
  tools?: ToolSpec[]
}

export interface LLMResponse {
  content: string
  providerId: string
  model: string
  isMock: boolean
  latencyMs: number
  /** Present only when the model itself decided to call a tool — never fabricated by the app. */
  toolCalls?: ToolCall[]
}

export interface LLMProvider {
  id: string
  name: string
  /** True for a provider that is genuinely usable right now (e.g. a local endpoint that responded). */
  isAvailable(): Promise<boolean>
  /** True only for a provider whose backend actually supports tool-calling (currently: ollama). */
  supportsTools: boolean
  generate(request: LLMRequest): Promise<LLMResponse>
}
