import { motion } from 'motion/react'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomReadout } from '../components/RoomReadout'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.atlas.accent

export function AtlasVisual() {
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

      <RoomReadout
        accent={ACCENT}
        label="Global picture"
        items={shortTerm.slice(0, 3).map((m) => m.content)}
        emptyText="No events tracked yet."
        active={active}
        corner="bottom-left"
      />
    </div>
  )
}

export function AtlasRoom() {
  return <RoomShell agentId="atlas" visual={<AtlasVisual />} />
}
