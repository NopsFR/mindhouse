import { motion } from 'motion/react'
import { agentRegistry, specialistIds } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.jarvis.accent

function JarvisVisual() {
  const runtime = useFacilityStore((s) => s.runtimes.jarvis)
  const runtimes = useFacilityStore((s) => s.runtimes)
  const active = runtime.state !== 'idle'

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <svg viewBox="0 0 600 600" className="h-[520px] w-[520px]">
        {/* Connections out to each specialist, colored by that specialist's own state */}
        {specialistIds.map((id, i) => {
          const angle = (i / specialistIds.length) * Math.PI * 2 - Math.PI / 2
          const x = 300 + Math.cos(angle) * 220
          const y = 300 + Math.sin(angle) * 220
          const specDef = agentRegistry[id]
          const busy = runtimes[id].state !== 'idle'
          return (
            <g key={id}>
              <line x1="300" y1="300" x2={x} y2={y} stroke={specDef.accent} strokeOpacity={busy ? 0.55 : 0.15} strokeWidth={busy ? 2 : 1} />
              <circle cx={x} cy={y} r={busy ? 8 : 6} fill={specDef.accent} opacity={busy ? 0.95 : 0.45}>
                {busy && <animate attributeName="r" values="6;10;6" dur="1.8s" repeatCount="indefinite" />}
              </circle>
              <text x={x} y={y + 22} textAnchor="middle" fill="var(--color-text-faint)" fontSize="11" letterSpacing="1">
                {specDef.name.toUpperCase()}
              </text>
            </g>
          )
        })}

        {/* The core */}
        <circle cx="300" cy="300" r="90" fill="none" stroke={ACCENT} strokeOpacity="0.25" strokeWidth="1" />
        <motion.circle
          cx="300"
          cy="300"
          r="62"
          fill={`${ACCENT}18`}
          stroke={ACCENT}
          strokeWidth="1.5"
          animate={{ r: active ? [62, 70, 62] : 62, opacity: active ? [0.8, 1, 0.8] : 0.7 }}
          transition={{ duration: 2.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
        />
        <circle cx="300" cy="300" r="4" fill={ACCENT} />
      </svg>

      <div className="pointer-events-none absolute font-display text-sm tracking-[0.3em] text-[var(--color-text-faint)]" style={{ top: '50%', transform: 'translateY(60px)' }}>
        CENTRAL INTELLIGENCE
      </div>
    </div>
  )
}

export function CentralChamber() {
  const runtimes = useFacilityStore((s) => s.runtimes)
  return (
    <RoomShell
      agentId="jarvis"
      visual={
        <div className="relative h-full w-full">
          <JarvisVisual />
          <div className="absolute top-8 right-8 flex flex-col gap-2 rounded-md border border-[var(--color-border)] bg-[rgba(5,5,6,0.55)] px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">System status</p>
            {specialistIds.map((id) => {
              const def = agentRegistry[id]
              return (
                <div key={id} className="flex items-center justify-between gap-6 text-[12px]">
                  <span style={{ color: def.accent }}>{def.name}</span>
                  <span className="capitalize text-[var(--color-text-dim)]">{runtimes[id].state}</span>
                </div>
              )
            })}
          </div>
        </div>
      }
    />
  )
}
