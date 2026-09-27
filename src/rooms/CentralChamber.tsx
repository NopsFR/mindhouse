import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { agentRegistry, specialistIds } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { AUTONOMY_LABELS, type AutonomyLevel } from '../devtools/types'
import { BrainReadout } from '../components/BrainReadout'
import { StatusTag } from '../components/StatusTag'
import { ChatDock } from '../components/ChatDock'
import { MemoryPanel } from '../components/MemoryPanel'
import { TaskList } from '../components/TaskList'
import { ToolActivityList } from '../components/ToolActivityList'

const ACCENT = agentRegistry.jarvis.accent

/**
 * A single calm light source, not a network diagram. Jarvis's presence in
 * the room is this — one considered object, breathing slowly — rather than
 * a constellation of nodes standing in for "the other agents".
 */
function AmbientCore({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
      <motion.div
        animate={{ opacity: active ? [0.5, 0.75, 0.5] : 0.4, scale: active ? [1, 1.03, 1] : 1 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-[-10%] h-[70vh] w-[60vw] max-w-[900px] rounded-full"
        style={{ background: `radial-gradient(ellipse at 50% 30%, ${ACCENT}22 0%, ${ACCENT}08 35%, transparent 70%)`, filter: 'blur(20px)' }}
      />
    </div>
  )
}

function LocalModelControl() {
  const status = useFacilityStore((s) => s.localModelStatus)
  const brain = useFacilityStore((s) => s.brains.jarvis)
  const connectLocalModel = useFacilityStore((s) => s.connectLocalModel)

  if (status === 'connected') {
    return <span className="font-mono text-[10px]" style={{ color: ACCENT }}>local · {brain.model}</span>
  }
  return (
    <button
      onClick={() => void connectLocalModel()}
      disabled={status === 'connecting'}
      className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
    >
      {status === 'connecting' ? 'checking localhost:11434…' : status === 'unavailable' ? 'no local model found — retry' : 'connect local model'}
    </button>
  )
}

/** Real, not decorative: only rendered when the local dev-tools server actually responded. */
function AutonomyControl() {
  const available = useFacilityStore((s) => s.devToolsAvailable)
  const workspaceRoot = useFacilityStore((s) => s.workspaceRoot)
  const level = useFacilityStore((s) => s.autonomyLevel)
  const setAutonomyLevel = useFacilityStore((s) => s.setAutonomyLevel)

  if (!available) {
    return <span className="font-mono text-[10px] text-[var(--color-text-faint)]">dev tools: not running (start with npm run dev)</span>
  }

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-faint)]">
      <span title={workspaceRoot ?? undefined}>workspace ready ·</span>
      {([0, 1, 2] as AutonomyLevel[]).map((l) => (
        <button
          key={l}
          onClick={() => setAutonomyLevel(l)}
          className="uppercase tracking-[0.06em] transition-colors"
          style={{ color: level === l ? ACCENT : 'var(--color-text-faint)' }}
        >
          {AUTONOMY_LABELS[l]}
        </button>
      ))}
    </div>
  )
}

type Panel = 'memory' | 'tasks' | 'tools' | null

export function CentralChamber() {
  const runtime = useFacilityStore((s) => s.runtimes.jarvis)
  const runtimes = useFacilityStore((s) => s.runtimes)
  const brain = useFacilityStore((s) => s.brains.jarvis)
  const goTo = useFacilityStore((s) => s.goTo)
  const [panel, setPanel] = useState<Panel>(null)
  const active = runtime.state !== 'idle'

  return (
    <motion.div
      layoutId="doorway-jarvis"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3 } }}
      className="absolute inset-0 flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      <AmbientCore active={active} />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-baseline gap-3 sm:gap-4">
          <button onClick={() => goTo('facility')} className="text-[11px] tracking-[0.04em] text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]">
            &larr; Facility
          </button>
          <h1 className="font-display text-xl tracking-wide sm:text-2xl" style={{ color: ACCENT }}>
            Jarvis
          </h1>
          <p className="hidden text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] sm:inline">Central Intelligence</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <BrainReadout brain={brain} accent={ACCENT} />
          <StatusTag state={runtime.state} accent={ACCENT} />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-6 pb-4">
        <ChatDock agentId="jarvis" />
      </div>

      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-[var(--color-hairline)] px-6 py-3">
        <LocalModelControl />
        <AutonomyControl />
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
          {specialistIds.map((id) => (
            <span key={id} style={{ color: runtimes[id].state !== 'idle' ? agentRegistry[id].accent : undefined }}>
              {agentRegistry[id].name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-5">
          {(['memory', 'tasks', 'tools'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPanel((cur) => (cur === p ? null : p))}
              className="text-[10px] uppercase tracking-[0.16em] transition-colors"
              style={{ color: panel === p ? ACCENT : 'var(--color-text-faint)' }}
            >
              {p}
            </button>
          ))}
        </div>
      </footer>

      <AnimatePresence>
        {panel && (
          <>
            <motion.button
              aria-label="Close panel"
              onClick={() => setPanel(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 cursor-default bg-black/40 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 z-20 max-h-[65%] overflow-y-auto border-t border-[var(--color-hairline)] px-8 pt-6 pb-8"
              style={{ background: 'rgba(8,9,11,0.92)', backdropFilter: 'blur(16px)' }}
            >
              {panel === 'memory' && <MemoryPanel agentId="jarvis" />}
              {panel === 'tasks' && <TaskList agentId="jarvis" />}
              {panel === 'tools' && <ToolActivityList agentId="jarvis" />}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
