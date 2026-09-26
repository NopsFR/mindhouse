import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'

export function TaskList({ agentId }: { agentId: AgentId }) {
  const tasks = useFacilityStore((s) => s.memories[agentId].tasks)
  const accent = agentRegistry[agentId].accent

  if (tasks.length === 0) {
    return <p className="text-xs italic text-[var(--color-text-faint)]">No tasks logged yet this session.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 rounded border border-[var(--color-border)] px-3 py-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: t.status === 'active' ? accent : t.status === 'done' ? 'var(--color-text-faint)' : 'transparent', border: t.status === 'pending' ? '1px solid var(--color-text-faint)' : 'none' }}
          />
          <span className="flex-1 text-[13px] text-[var(--color-text)]">{t.title}</span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">{t.status}</span>
        </li>
      ))}
    </ul>
  )
}
