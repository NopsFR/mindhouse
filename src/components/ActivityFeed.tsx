import { AnimatePresence, motion } from 'motion/react'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'

interface ActivityFeedProps {
  limit?: number
  filterAgent?: string
}

/** The visible trace of the message bus — the facility's nervous system made legible, not a chat log. */
export function ActivityFeed({ limit = 12, filterAgent }: ActivityFeedProps) {
  const messages = useFacilityStore((s) => s.messages)
  const shown = (filterAgent ? messages.filter((m) => m.from === filterAgent || m.to === filterAgent) : messages).slice(0, limit)

  if (shown.length === 0) {
    return <p className="text-xs italic text-[var(--color-text-faint)]">No traffic yet. The facility is quiet.</p>
  }

  return (
    <ul>
      <AnimatePresence initial={false}>
        {shown.map((m) => {
          const from = agentRegistry[m.from]
          const to = agentRegistry[m.to]
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="border-t border-[var(--color-hairline)] py-2.5 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
                <span style={{ color: from.accent }}>{from.name}</span>
                <span>&rarr;</span>
                <span style={{ color: to.accent }}>{to.name}</span>
                <span className="normal-case tracking-normal opacity-70">{m.type}</span>
                {typeof m.confidence === 'number' && <span className="ml-auto">{m.confidence.toFixed(2)}</span>}
              </div>
              <p className="mt-1 text-[13px] leading-snug text-[var(--color-text)]">{m.content}</p>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
