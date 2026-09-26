import { motion } from 'motion/react'

interface RoomReadoutProps {
  accent: string
  label: string
  items: string[]
  emptyText: string
  active: boolean
  corner: 'top-left' | 'top-right' | 'bottom-left'
}

const POSITION: Record<RoomReadoutProps['corner'], string> = {
  'top-left': 'top-8 left-8 items-start text-left',
  'top-right': 'top-8 right-8 items-end text-right',
  'bottom-left': 'bottom-24 left-8 items-start text-left',
}

/**
 * Information as it exists inside a room, not a floating card. No border,
 * no filled background — just a soft scrim so text stays legible over the
 * room's own visual, and typographic weight to carry the hierarchy.
 */
export function RoomReadout({ accent, label, items, emptyText, active, corner }: RoomReadoutProps) {
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.65 }}
      className={`pointer-events-none absolute flex max-w-[15rem] flex-col gap-1.5 ${POSITION[corner]}`}
      style={{
        WebkitMaskImage: corner === 'top-right' ? 'linear-gradient(to left, black 60%, transparent 100%)' : undefined,
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: accent }}>
        {label}
      </p>
      {items.length === 0 ? (
        <p className="text-[12px] italic text-[var(--color-text-faint)]">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((text, i) => (
            <li key={i} className="text-[12px] leading-snug text-[var(--color-text-dim)]">
              {text}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
