import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { BrainMeter } from '../components/BrainMeter'
import { StatusTag } from '../components/StatusTag'
import { MemoryPanel } from '../components/MemoryPanel'
import { TaskList } from '../components/TaskList'
import { ChatDock } from '../components/ChatDock'
import { ActivityFeed } from '../components/ActivityFeed'

type Tab = 'overview' | 'memory' | 'tasks' | 'chat'

interface RoomShellProps {
  agentId: AgentId
  visual: ReactNode
}

export function RoomShell({ agentId, visual }: RoomShellProps) {
  const def = agentRegistry[agentId]
  const runtime = useFacilityStore((s) => s.runtimes[agentId])
  const goTo = useFacilityStore((s) => s.goTo)
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full w-full flex-col"
      style={{
        background: `radial-gradient(ellipse 120% 80% at 50% -10%, ${def.accent}12, transparent 60%), var(--color-bg)`,
      }}
    >
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-8 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => goTo('facility')}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft size={13} /> Facility
          </button>
          <div>
            <h1 className="font-display text-2xl tracking-wide" style={{ color: def.accent }}>
              {def.name}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">{def.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <BrainMeter tier={def.brain.tier} accent={def.accent} />
          <StatusTag state={runtime.state} accent={def.accent} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-visible">
        <div className="relative h-[45vh] shrink-0 overflow-hidden md:h-auto md:flex-1">
          {visual}
          {runtime.activity && (
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border px-4 py-1.5 text-[11px]"
              style={{ borderColor: `${def.accent}44`, background: 'rgba(5,5,6,0.75)', color: def.accent, backdropFilter: 'blur(6px)' }}
            >
              {runtime.activity}
            </div>
          )}
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t border-[var(--color-border)] bg-[var(--color-panel)]/50 md:w-[360px] md:border-t-0 md:border-l">
          <nav className="flex border-b border-[var(--color-border)]">
            {(['overview', 'memory', 'tasks', 'chat'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-3 text-[10px] uppercase tracking-[0.12em] transition-colors"
                style={{
                  color: tab === t ? def.accent : 'var(--color-text-faint)',
                  borderBottom: tab === t ? `2px solid ${def.accent}` : '2px solid transparent',
                }}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {tab === 'overview' && (
              <div className="flex flex-col gap-5">
                <p className="text-[13px] leading-relaxed text-[var(--color-text-dim)]">{def.tagline}</p>
                <section>
                  <h4 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Responsibilities</h4>
                  <ul className="flex flex-col gap-1.5">
                    {def.responsibilities.map((r) => (
                      <li key={r} className="text-[13px] text-[var(--color-text)]">&middot; {r}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Capabilities</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {def.brain.capabilities.map((c) => (
                      <span key={c} className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-dim)]">
                        {c}
                      </span>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Recent traffic</h4>
                  <ActivityFeed limit={5} filterAgent={agentId} />
                </section>
              </div>
            )}
            {tab === 'memory' && <MemoryPanel agentId={agentId} />}
            {tab === 'tasks' && <TaskList agentId={agentId} />}
            {tab === 'chat' && <ChatDock agentId={agentId} />}
          </div>
        </aside>
      </div>
    </motion.div>
  )
}
