import { motion } from 'motion/react'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.atlas.accent

function AtlasVisual() {
  const runtime = useFacilityStore((s) => s.runtimes.atlas)
  const shortTerm = useFacilityStore((s) => s.memories.atlas.shortTerm)
  const active = runtime.state !== 'idle'

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <motion.svg
        viewBox="0 0 400 400"
        className="h-[420px] w-[420px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="200" cy="200" r="150" fill="none" stroke={ACCENT} strokeOpacity="0.35" strokeWidth="1.5" />
        {[130, 95, 55].map((ry) => (
          <ellipse key={ry} cx="200" cy="200" rx="150" ry={ry} fill="none" stroke={ACCENT} strokeOpacity="0.22" strokeWidth="1" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={i}
            x1="200"
            y1="50"
            x2="200"
            y2="350"
            stroke={ACCENT}
            strokeOpacity="0.14"
            strokeWidth="1"
            transform={`rotate(${i * 30} 200 200)`}
          />
        ))}
      </motion.svg>

      {/* Event markers stay screen-fixed while the globe rotates beneath them */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[420px] w-[420px]">
          {[
            { top: '22%', left: '30%' },
            { top: '65%', left: '68%' },
            { top: '40%', left: '78%' },
          ].map((pos, i) => (
            <span
              key={i}
              className={active ? 'animate-pulse-soft' : ''}
              style={{ position: 'absolute', top: pos.top, left: pos.left, width: 6, height: 6, borderRadius: '50%', background: ACCENT, opacity: active ? 0.9 : 0.4 }}
            />
          ))}
        </div>
      </div>

      <motion.div
        animate={{ opacity: active ? 1 : 0.6 }}
        className="pointer-events-none absolute bottom-20 left-8 max-w-xs rounded-md border px-4 py-3"
        style={{ borderColor: `${ACCENT}33`, background: 'rgba(5,5,6,0.55)' }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
          Global picture
        </p>
        {shortTerm.length === 0 ? (
          <p className="mt-1.5 text-[12px] italic text-[var(--color-text-faint)]">No events tracked yet.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {shortTerm.slice(0, 3).map((m) => (
              <li key={m.id} className="text-[12px] text-[var(--color-text-dim)]">
                {m.content.split(' — ')[0]}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}

export function AtlasRoom() {
  return <RoomShell agentId="atlas" visual={<AtlasVisual />} />
}
