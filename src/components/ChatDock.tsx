import { useState } from 'react'
import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { resolveLLM } from '../llm/registry'
import { useFacilityStore } from '../state/store'

interface ChatLine {
  id: string
  role: 'user' | 'agent'
  text: string
  meta?: string
}

/** Builds the same kind of prompt the simulation uses, so chat answers are grounded in real memory, not invented. */
function buildChatMessages(agentId: AgentId, question: string) {
  const def = agentRegistry[agentId]
  const memory = useFacilityStore.getState().memories[agentId]
  const context = [...memory.shortTerm.slice(0, 3), ...memory.longTerm.slice(0, 2)].map((m) => `- ${m.content}`).join('\n')
  return [
    { role: 'system' as const, content: def.systemPrompt },
    {
      role: 'user' as const,
      content: context
        ? `Recent memory:\n${context}\n\nQuestion: ${question}\nAnswer in one or two sentences, using only the memory above — say plainly if you don't know.`
        : `You have no memory yet this session.\n\nQuestion: ${question}\nAnswer in one sentence, saying plainly that you have nothing on it yet.`,
    },
  ]
}

export function ChatDock({ agentId }: { agentId: AgentId }) {
  const def = agentRegistry[agentId]
  const brain = useFacilityStore((s) => s.brains[agentId])
  const [lines, setLines] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)

  async function send() {
    const text = draft.trim()
    if (!text || pending) return
    setDraft('')
    setLines((prev) => [...prev, { id: `${Date.now()}-u`, role: 'user', text }])
    setPending(true)
    const llm = resolveLLM(brain)
    const response = await llm.generate({ messages: buildChatMessages(agentId, text) })
    setLines((prev) => [
      ...prev,
      { id: `${Date.now()}-a`, role: 'agent', text: response.content, meta: `${response.providerId} · ${response.model} · ${response.latencyMs}ms` },
    ])
    setPending(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Speak with {def.name}</h4>
        <span className="font-mono text-[9px] text-[var(--color-text-faint)]">{brain.provider} &middot; {brain.model}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {lines.length === 0 && (
          <p className="text-xs italic text-[var(--color-text-faint)]">{def.personality.join(' · ')}. Ask about status, memory, or Jarvis.</p>
        )}
        {lines.map((l) => (
          <div key={l.id} className={l.role === 'user' ? 'text-right' : 'text-left'}>
            <p className="text-[13px] leading-snug" style={{ color: l.role === 'user' ? 'var(--color-text-dim)' : 'var(--color-text)' }}>
              {l.role === 'agent' && <span style={{ color: def.accent }}>{def.name}: </span>}
              {l.text}
            </p>
            {l.meta && <p className="mt-0.5 font-mono text-[9px] text-[var(--color-text-faint)]">{l.meta}</p>}
          </div>
        ))}
        {pending && <p className="font-mono text-[11px] text-[var(--color-text-faint)]">{def.name} is thinking…</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="mt-3 flex items-center gap-2 border-t border-[var(--color-hairline)] pt-3"
      >
        <span className="font-mono text-[13px] text-[var(--color-text-faint)]">&gt;</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask ${def.name} something…`}
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--color-text-faint)]"
        />
      </form>
    </div>
  )
}
