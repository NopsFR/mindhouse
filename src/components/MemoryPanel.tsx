import type { AgentId } from '../agents/types'
import type { MemoryEntry } from '../memory/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h`
}

function MemoryRow({ entry, dim }: { entry: MemoryEntry; dim?: boolean }) {
  return (
    <li className="border-t border-[var(--color-hairline)] py-2.5 first:border-t-0 first:pt-0">
      <p className={dim ? 'text-[13px] leading-relaxed text-[var(--color-text-dim)]' : 'text-[13px] leading-relaxed text-[var(--color-text)]'}>
        {entry.content}
      </p>
      <p className="mt-1 font-mono text-[10px] text-[var(--color-text-faint)]">
        {entry.source} &middot; {timeAgo(entry.timestamp)} ago{entry.isMock ? ' · sim' : ''}
      </p>
    </li>
  )
}

export function MemoryPanel({ agentId }: { agentId: AgentId }) {
  const memory = useFacilityStore((s) => s.memories[agentId])
  const relationships = Object.values(memory.relationships)

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h4 className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Short-term</h4>
        {memory.shortTerm.length === 0 ? (
          <p className="text-xs italic text-[var(--color-text-faint)]">No recent observations.</p>
        ) : (
          <ul>
            {memory.shortTerm.map((m) => (
              <MemoryRow key={m.id} entry={m} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Long-term</h4>
        {memory.longTerm.length === 0 ? (
          <p className="text-xs italic text-[var(--color-text-faint)]">Nothing archived yet.</p>
        ) : (
          <ul>
            {memory.longTerm.map((m) => (
              <MemoryRow key={m.id} entry={m} dim />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Relationships</h4>
        {relationships.length === 0 ? (
          <p className="text-xs italic text-[var(--color-text-faint)]">No interactions recorded yet.</p>
        ) : (
          <ul>
            {relationships.map((r) => (
              <li key={r!.with} className="flex items-start justify-between gap-3 border-t border-[var(--color-hairline)] py-2.5 text-[13px] first:border-t-0 first:pt-0">
                <div>
                  <span style={{ color: agentRegistry[r!.with].accent }}>{agentRegistry[r!.with].name}</span>
                  <p className="font-mono text-[10px] text-[var(--color-text-faint)]">{r!.interactionCount} interactions</p>
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
