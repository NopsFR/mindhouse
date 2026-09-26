import { AnimatePresence, motion } from 'motion/react'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'

interface ActivityFeedProps {
  limit?: number
  filterAgent?: string
}

/** The visible trace of the message bus — the facility's nervous system made legible. */
export function ActivityFeed({ limit = 12, filterAgent }: ActivityFeedProps) {
  const messages = useFacilityStore((s) => s.messages)
  const shown = (filterAgent ? messages.filter((m) => m.from === filterAgent || m.to === filterAgent) : messages).slice(0, limit)

  if (shown.length === 0) {
    return <p className="text-xs text-[var(--color-text-faint)] italic">No traffic yet. The facility is quiet.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {shown.map((m) => {
          const from = agentRegistry[m.from]
          const to = agentRegistry[m.to]
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]/60 px-3 py-2"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                <span style={{ color: from.accent }}>{from.name}</span>
                <span>&rarr;</span>
                <span style={{ color: to.accent }}>{to.name}</span>
                {typeof m.confidence === 'number' && (
                  <span className="ml-auto normal-case tracking-normal text-[var(--color-text-faint)]">
                    conf. {m.confidence.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-snug text-[var(--color-text)]">{m.content}</p>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
