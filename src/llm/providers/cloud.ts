import type { LLMProvider, LLMRequest, LLMResponse } from '../types'

/**
 * Placeholder for any cloud model (Anthropic, OpenAI, etc.). It deliberately
 * does not — and must not — call a cloud API directly from the browser: that
 * would require shipping a secret API key to every visitor. Calling this
 * provider is a clear signal that a server-side proxy needs to exist first.
 *
 * The intended shape once a backend exists:
 *   browser -> POST /api/agent/generate -> server (holds the API key) -> cloud provider
 *
 * `generate` throws on purpose rather than silently falling back to the mock
 * provider, so a misconfiguration is loud instead of quietly faking output.
 */
export function createUnconfiguredCloudProvider(label: string): LLMProvider {
  return {
    id: 'cloud',
    name: `Cloud (${label}) — not connected`,
    supportsTools: false,
    async isAvailable() {
      return false
    },
    async generate(_request: LLMRequest): Promise<LLMResponse> {
      throw new Error(
        `Cloud provider "${label}" has no server-side proxy configured in this client-only build. ` +
          `Cloud API keys must never be embedded in browser code — add a backend route before enabling this provider.`,
      )
    },
  }
}
