import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

interface MemoryPanelProps {
  agentId: AgentId
}

export function MemoryPanel({ agentId }: MemoryPanelProps) {
  const memory = useFacilityStore((s) => s.memories[agentId])
  const accent = agentRegistry[agentId].accent

  const relationships = Object.values(memory.relationships)

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h4 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Short-term memory</h4>
        {memory.shortTerm.length === 0 ? (
          <p className="text-xs italic text-[var(--color-text-faint)]">No recent observations.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {memory.shortTerm.map((m) => (
              <li key={m.id} className="border-l-2 pl-3 text-[13px] leading-snug" style={{ borderColor: `${accent}66` }}>
                <p className="text-[var(--color-text)]">{m.content}</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-faint)]">{m.source} &middot; {timeAgo(m.timestamp)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Long-term memory</h4>
        {memory.longTerm.length === 0 ? (
          <p className="text-xs italic text-[var(--color-text-faint)]">Nothing archived yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {memory.longTerm.map((m) => (
              <li key={m.id} className="border-l-2 pl-3 text-[13px] leading-snug" style={{ borderColor: `${accent}44` }}>
                <p className="text-[var(--color-text-dim)]">{m.content}</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-faint)]">{timeAgo(m.timestamp)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Relationships</h4>
        {relationships.length === 0 ? (
          <p className="text-xs italic text-[var(--color-text-faint)]">No interactions recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {relationships.map((r) => (
              <li key={r!.with} className="flex items-start justify-between gap-3 text-[13px]">
                <div>
                  <span style={{ color: agentRegistry[r!.with].accent }}>{agentRegistry[r!.with].name}</span>
                  <p className="text-[11px] text-[var(--color-text-faint)]">{r!.interactionCount} interactions</p>
                </div>
                <p className="max-w-[55%] text-right text-[11px] text-[var(--color-text-dim)]">{r!.lastSummary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
