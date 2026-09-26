import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'

const STATUS_LABEL: Record<string, string> = { queued: 'Queued', active: 'Active', done: 'Done', failed: 'Failed' }

export function TaskList({ agentId }: { agentId: AgentId }) {
  const tasks = useFacilityStore((s) => s.memories[agentId].tasks)
  const accent = agentRegistry[agentId].accent

  if (tasks.length === 0) {
    return <p className="text-xs italic text-[var(--color-text-faint)]">No tasks queued this session.</p>
  }

  return (
    <ul>
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 border-t border-[var(--color-hairline)] py-2.5 first:border-t-0 first:pt-0">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background: t.status === 'active' ? accent : t.status === 'done' ? 'var(--color-text-faint)' : t.status === 'failed' ? '#b4443c' : 'transparent',
              border: t.status === 'queued' ? '1px solid var(--color-text-faint)' : 'none',
            }}
          />
          <span className="flex-1 text-[13px] text-[var(--color-text)]">{t.title}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">{STATUS_LABEL[t.status]}</span>
        </li>
      ))}
    </ul>
  )
}
