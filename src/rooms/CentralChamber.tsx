import { motion } from 'motion/react'
import { agentRegistry, specialistIds } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.jarvis.accent

export function JarvisVisual() {
  const runtime = useFacilityStore((s) => s.runtimes.jarvis)
  const runtimes = useFacilityStore((s) => s.runtimes)
  const active = runtime.state !== 'idle'

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <svg viewBox="0 0 600 600" className="h-full w-full max-h-[600px] max-w-[600px]">
        {/* Connections out to each specialist, colored by that specialist's own state */}
        {specialistIds.map((id, i) => {
          const angle = (i / specialistIds.length) * Math.PI * 2 - Math.PI / 2
          const x = 300 + Math.cos(angle) * 220
          const y = 300 + Math.sin(angle) * 220
          const specDef = agentRegistry[id]
          const busy = runtimes[id].state !== 'idle'
          return (
            <g key={id}>
              <line x1="300" y1="300" x2={x} y2={y} stroke={specDef.accent} strokeOpacity={busy ? 0.55 : 0.13} strokeWidth={busy ? 1.5 : 1} />
              <circle cx={x} cy={y} r={busy ? 7 : 5} fill={specDef.accent} opacity={busy ? 0.95 : 0.4}>
                {busy && <animate attributeName="r" values="5;9;5" dur="1.8s" repeatCount="indefinite" />}
              </circle>
              <text x={x} y={y + 22} textAnchor="middle" fill="var(--color-text-faint)" fontSize="10" letterSpacing="1.5" fontFamily="var(--font-mono)">
                {specDef.name.toUpperCase()}
              </text>
            </g>
          )
        })}

        {/* The core */}
        <circle cx="300" cy="300" r="90" fill="none" stroke={ACCENT} strokeOpacity="0.22" strokeWidth="1" />
        <motion.circle
          cx="300"
          cy="300"
          r="60"
          fill={`${ACCENT}16`}
          stroke={ACCENT}
          strokeWidth="1.5"
          animate={{ r: active ? [60, 68, 60] : 60, opacity: active ? [0.8, 1, 0.8] : 0.65 }}
          transition={{ duration: 2.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
        />
        <circle cx="300" cy="300" r="3.5" fill={ACCENT} />
      </svg>
    </div>
  )
}

function LocalModelControl() {
  const status = useFacilityStore((s) => s.localModelStatus)
  const brain = useFacilityStore((s) => s.brains.jarvis)
  const connectLocalModel = useFacilityStore((s) => s.connectLocalModel)

  return (
    <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--color-text-faint)]">
      {status === 'connected' ? (
        <span style={{ color: ACCENT }}>local · {brain.model}</span>
      ) : (
        <button onClick={() => void connectLocalModel()} disabled={status === 'connecting'} className="uppercase tracking-[0.08em] transition-colors hover:text-[var(--color-text)]">
          {status === 'connecting' ? 'checking localhost:11434…' : status === 'unavailable' ? 'no local model found — retry' : 'connect local model'}
        </button>
      )}
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

          <div className="pointer-events-none absolute top-8 right-8 flex flex-col items-end gap-2 text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">System status</p>
            {specialistIds.map((id) => {
              const def = agentRegistry[id]
              return (
                <div key={id} className="flex items-center gap-3 text-[12px]">
                  <span className="capitalize text-[var(--color-text-dim)]">{runtimes[id].state}</span>
                  <span style={{ color: def.accent }}>{def.name}</span>
                </div>
              )
            })}
          </div>

          <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2">
            <LocalModelControl />
          </div>
        </div>
      }
    />
  )
}
