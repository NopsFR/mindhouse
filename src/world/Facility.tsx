import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { agentRegistry, agentIds } from '../agents/registry'
import { Doorway } from '../components/Doorway'
import { ActivityFeed } from '../components/ActivityFeed'

const ORDER: (keyof typeof agentRegistry)[] = ['mancy', 'null', 'jarvis', 'atlas', 'orbit']

/**
 * The facility overview — a corridor, not a dashboard grid. Doorways sit on
 * a shared floor line; walking toward one (clicking it) is what opens the
 * room. The only permanent chrome is the title and a closed-by-default
 * activity strip, matching the interaction language inside each room.
 */
export function Facility() {
  const onlineCount = agentIds.length
  const [activityOpen, setActivityOpen] = useState(false)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 flex flex-col">
      <header className="px-8 pt-7 pb-2">
        <h1 className="font-display text-lg tracking-[0.06em]">MINDHOUSE</h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">{onlineCount} systems online</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0 overflow-y-auto px-6 py-8 md:flex-row md:gap-0 md:overflow-visible md:px-0">
        {ORDER.map((id) => (
          <div key={id} className="w-full md:w-auto md:border-l md:border-[var(--color-hairline)] md:first:border-l-0">
            <Doorway agentId={id} size={id === 'jarvis' ? 'lg' : 'md'} />
          </div>
        ))}
      </div>

      {/* Shared floor line beneath the doorways, reinforcing the elevation/cross-section read */}
      <div className="hidden h-px bg-[var(--color-hairline)] md:block" />

      <div className="flex items-center justify-center border-t border-[var(--color-hairline)] py-3 md:border-t-0">
        <button
          onClick={() => setActivityOpen((v) => !v)}
          className="font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
          style={{ color: activityOpen ? 'var(--color-jarvis)' : 'var(--color-text-faint)' }}
        >
          Facility activity
        </button>
      </div>

      <AnimatePresence>
        {activityOpen && (
          <>
            <motion.button
              aria-label="Close activity"
              onClick={() => setActivityOpen(false)}
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
              className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto border-t border-[var(--color-hairline)] px-8 pt-6 pb-8"
              style={{ background: 'rgba(8,9,11,0.92)', backdropFilter: 'blur(16px)' }}
            >
              <h4 className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Facility activity</h4>
              <ActivityFeed limit={20} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
