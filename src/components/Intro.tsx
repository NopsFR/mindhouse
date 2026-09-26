import { motion } from 'motion/react'
import { agentRegistry, agentIds } from '../agents/registry'
import { useFacilityStore } from '../state/store'

export function Intro() {
  const enter = useFacilityStore((s) => s.enter)
  const startSimulation = useFacilityStore((s) => s.startSimulation)

  function handleEnter() {
    startSimulation()
    enter()
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-10 text-center sm:gap-10"
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <h1 className="font-display text-4xl tracking-[0.08em] text-[var(--color-text)] sm:text-5xl md:text-6xl">MINDHOUSE</h1>
        <p className="mt-3 text-[12px] uppercase tracking-[0.22em] text-[var(--color-text-faint)]">
          {agentIds.length} systems online
        </p>
      </motion.div>

      <motion.ul
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
        className="flex flex-col gap-1.5"
      >
        {agentIds.map((id) => {
          const def = agentRegistry[id]
          return (
            <motion.li
              key={id}
              variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
              className="text-[13px] text-[var(--color-text-dim)]"
            >
              <span style={{ color: def.accent }}>{def.name}</span> — {def.role}
            </motion.li>
          )
        })}
      </motion.ul>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        onClick={handleEnter}
        className="rounded-full border border-[var(--color-border-strong)] px-7 py-2.5 text-[12px] uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors hover:border-[var(--color-jarvis)] hover:text-[var(--color-jarvis)]"
      >
        Enter the facility
      </motion.button>
    </motion.div>
  )
}
