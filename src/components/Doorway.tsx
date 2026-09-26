import { motion } from 'motion/react'
import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { DoorwayPreview } from './DoorwayPreview'
import { StatusTag } from './StatusTag'

interface DoorwayProps {
  agentId: AgentId
  size?: 'lg' | 'md'
}

/**
 * An opening into a room, not a card. No fill, no drop shadow — a frame
 * (left, right, top; the bottom is open, like a threshold) with a live
 * glimpse of the room behind it. The name sits at the threshold like a
 * plaque, not centered like a card title.
 */
export function Doorway({ agentId, size = 'md' }: DoorwayProps) {
  const def = agentRegistry[agentId]
  const runtime = useFacilityStore((s) => s.runtimes[agentId])
  const goTo = useFacilityStore((s) => s.goTo)
  const active = runtime.state !== 'idle'

  const height = size === 'lg' ? 340 : 280

  return (
    <motion.button
      layoutId={`doorway-${agentId}`}
      onClick={() => goTo(agentId)}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className={`group relative flex w-full shrink-0 flex-col justify-end overflow-hidden text-left ${size === 'lg' ? 'md:w-[260px]' : 'md:w-[210px]'}`}
      style={{
        height,
        borderLeft: `1px solid ${active ? `${def.accent}55` : 'var(--color-hairline)'}`,
        borderRight: `1px solid ${active ? `${def.accent}55` : 'var(--color-hairline)'}`,
        borderTop: `1px solid ${active ? `${def.accent}55` : 'var(--color-hairline)'}`,
        transition: 'border-color 0.6s ease',
      }}
    >
      <motion.div
        variants={{ rest: { scale: 1, opacity: active ? 0.85 : 0.55 }, hover: { scale: 1.06, opacity: 1 } }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <DoorwayPreview agentId={agentId} accent={def.accent} active={active} />
      </motion.div>

      {/* Depth: a floor-ward gradient so the plaque stays legible without a boxed background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28" style={{ background: 'linear-gradient(to top, rgba(5,5,6,0.92), transparent)' }} />

      <div className="relative flex flex-col gap-1 px-4 pb-4">
        <h3 className="font-display text-xl tracking-wide" style={{ color: def.accent }}>
          {def.name}
        </h3>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">{def.role}</p>
        <StatusTag state={runtime.state} accent={def.accent} />
      </div>
    </motion.button>
  )
}
