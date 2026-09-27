import { useState } from 'react'
import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'

export function ChatDock({ agentId }: { agentId: AgentId }) {
  const def = agentRegistry[agentId]
  const brain = useFacilityStore((s) => s.brains[agentId])
  const lines = useFacilityStore((s) => s.conversations[agentId])
  const sendChatMessage = useFacilityStore((s) => s.sendChatMessage)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)

  async function send() {
    const text = draft.trim()
    if (!text || pending) return
    setDraft('')
    setPending(true)
    await sendChatMessage(agentId, text)
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
          <p className="text-xs italic text-[var(--color-text-faint)]">{def.personality.join(' · ')}. Just say hi.</p>
        )}
        {lines.map((l) => (
          <div key={l.id} className={l.role === 'user' ? 'text-right' : 'text-left'}>
            <p className="text-[13px] leading-snug" style={{ color: l.role === 'user' ? 'var(--color-text-dim)' : 'var(--color-text)' }}>
              {l.role === 'agent' && <span style={{ color: def.accent }}>{def.name}: </span>}
              {l.content}
            </p>
            {((l.delegatedTo && l.delegatedTo.length > 0) || (l.sources && l.sources.length > 0)) && (
              <p className="mt-0.5 font-mono text-[9px] text-[var(--color-text-faint)]">
                {l.delegatedTo && l.delegatedTo.length > 0 && (
                  <>
                    checked with{' '}
                    {l.delegatedTo.map((id, i) => (
                      <span key={id}>
                        {i > 0 && ', '}
                        <span style={{ color: agentRegistry[id].accent }}>{agentRegistry[id].name}</span>
                      </span>
                    ))}
                    {l.sources && l.sources.length > 0 && ' · '}
                  </>
                )}
                {l.sources && l.sources.length > 0 && l.sources.join(', ')}
              </p>
            )}
            {l.modelMeta && (
              <p className="mt-0.5 font-mono text-[9px] text-[var(--color-text-faint)]">
                {l.modelMeta.providerId} · {l.modelMeta.model} · {l.modelMeta.latencyMs}ms
              </p>
            )}
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
