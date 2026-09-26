import { useState } from 'react'
import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { buildHeuristicResponse } from '../agents/responder'
import { useFacilityStore } from '../state/store'

interface ChatLine {
  id: string
  role: 'user' | 'agent'
  text: string
}

export function ChatDock({ agentId }: { agentId: AgentId }) {
  const def = agentRegistry[agentId]
  const memory = useFacilityStore((s) => s.memories[agentId])
  const [lines, setLines] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')

  function send() {
    const text = draft.trim()
    if (!text) return
    const userLine: ChatLine = { id: `${Date.now()}-u`, role: 'user', text }
    const reply = buildHeuristicResponse(agentId, text, memory)
    const agentLine: ChatLine = { id: `${Date.now()}-a`, role: 'agent', text: reply }
    setLines((prev) => [...prev, userLine, agentLine])
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Speak with {def.name}</h4>
        <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]" title="Rule-based response drawing on this agent's own memory — no live model connected yet.">
          heuristic &middot; no live model
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {lines.length === 0 && (
          <p className="text-xs italic text-[var(--color-text-faint)]">
            {def.personality.join(' · ')}. Ask about status, memory, or Jarvis.
          </p>
        )}
        {lines.map((l) => (
          <div
            key={l.id}
            className="max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-snug"
            style={
              l.role === 'user'
                ? { marginLeft: 'auto', background: 'var(--color-panel-2)', color: 'var(--color-text)' }
                : { background: `${def.accent}14`, color: 'var(--color-text)', border: `1px solid ${def.accent}33` }
            }
          >
            {l.text}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask ${def.name} something…`}
          className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-border-strong)]"
        />
        <button
          type="submit"
          className="rounded-md border px-3 py-2 text-[12px] uppercase tracking-[0.08em] transition-colors"
          style={{ borderColor: `${def.accent}55`, color: def.accent }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
