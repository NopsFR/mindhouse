import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { BrainReadout } from '../components/BrainReadout'
import { StatusTag } from '../components/StatusTag'
import { MemoryPanel } from '../components/MemoryPanel'
import { TaskList } from '../components/TaskList'
import { ChatDock } from '../components/ChatDock'
import { ActivityFeed } from '../components/ActivityFeed'
import { ToolActivityList } from '../components/ToolActivityList'

type Panel = 'memory' | 'tasks' | 'tools' | 'chat' | null

interface RoomShellProps {
  agentId: AgentId
  visual: ReactNode
}

/**
 * The room chrome. Deliberately thin: the visual environment is the room,
 * not this frame. Detail (memory, tasks, chat) lives behind a bottom drawer
 * that's closed by default, so the environment — not a sidebar — is what
 * the eye lands on. Hierarchy: environment, then agent, then activity,
 * then information, then controls.
 */
export function RoomShell({ agentId, visual }: RoomShellProps) {
  const def = agentRegistry[agentId]
  const runtime = useFacilityStore((s) => s.runtimes[agentId])
  const brain = useFacilityStore((s) => s.brains[agentId])
  const goTo = useFacilityStore((s) => s.goTo)
  const [panel, setPanel] = useState<Panel>(null)

  function toggle(p: Exclude<Panel, null>) {
    setPanel((current) => (current === p ? null : p))
  }

  return (
    <motion.div
      layoutId={`doorway-${agentId}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3 } }}
      className="absolute inset-0 flex flex-col"
      style={{ background: `radial-gradient(ellipse 120% 80% at 50% -10%, ${def.accent}10, transparent 60%), var(--color-bg)` }}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-baseline gap-3 sm:gap-4">
          <button
            onClick={() => goTo('facility')}
            className="text-[11px] tracking-[0.04em] text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
          >
            &larr; Facility
          </button>
          <h1 className="font-display text-xl tracking-wide sm:text-2xl" style={{ color: def.accent }}>
            {def.name}
          </h1>
          <p className="hidden text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] sm:inline">{def.role}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <BrainReadout brain={brain} accent={def.accent} />
          <StatusTag state={runtime.state} accent={def.accent} />
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {visual}
        {runtime.activity && (
          <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 font-mono text-[11px]" style={{ color: def.accent }}>
            {runtime.activity}
          </div>
        )}
      </div>

      {/* Collapsed strip — the only permanent chrome besides the header */}
      <div className="flex items-center justify-center gap-8 border-t border-[var(--color-hairline)] py-3">
        {(['memory', 'tasks', 'tools', 'chat'] as const).map((p) => (
          <button
            key={p}
            onClick={() => toggle(p)}
            className="text-[10px] uppercase tracking-[0.16em] transition-colors"
            style={{ color: panel === p ? def.accent : 'var(--color-text-faint)' }}
          >
            {p}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {panel && (
          <>
            <motion.button
              aria-label="Close panel"
              onClick={() => setPanel(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 max-h-[65%] overflow-y-auto border-t border-[var(--color-hairline)] px-8 pt-6 pb-8"
              style={{ background: 'rgba(8,9,11,0.92)', backdropFilter: 'blur(16px)' }}
            >
              {panel === 'memory' && <MemoryPanel agentId={agentId} />}
              {panel === 'tasks' && <TaskList agentId={agentId} />}
              {panel === 'tools' && <ToolActivityList agentId={agentId} />}
              {panel === 'chat' && (
                <div className="h-[50vh] max-h-[420px]">
                  <ChatDock agentId={agentId} />
                </div>
              )}
              {panel !== 'chat' && (
                <div className="mt-6 border-t border-[var(--color-hairline)] pt-4">
                  <h4 className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Recent traffic</h4>
                  <ActivityFeed limit={4} filterAgent={agentId} />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
