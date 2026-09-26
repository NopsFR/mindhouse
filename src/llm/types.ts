/**
 * Model abstraction. An agent's `brain` names a provider id and a model,
 * never a hard-coded call site — so one agent can run on a local model
 * while another runs on a cloud model, and swapping either is a one-line
 * config change in `agents/registry.ts`, not a rewrite of the simulation.
 */

export type LLMRole = 'system' | 'user' | 'assistant'

export interface LLMMessage {
  role: LLMRole
  content: string
}

export interface LLMRequest {
  messages: LLMMessage[]
  maxTokens?: number
}

export interface LLMResponse {
  content: string
  providerId: string
  model: string
  isMock: boolean
  latencyMs: number
}

export interface LLMProvider {
  id: string
  name: string
  /** True for a provider that is genuinely usable right now (e.g. a local endpoint that responded). */
  isAvailable(): Promise<boolean>
  generate(request: LLMRequest): Promise<LLMResponse>
}
