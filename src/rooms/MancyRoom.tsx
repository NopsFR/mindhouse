import { motion } from 'motion/react'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.mancy.accent

function MancyVisual() {
  const runtime = useFacilityStore((s) => s.runtimes.mancy)
  const shortTerm = useFacilityStore((s) => s.memories.mancy.shortTerm)
  const active = runtime.state !== 'idle'

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-10">
      <svg viewBox="0 0 640 420" className="h-full w-full max-w-3xl opacity-90">
        <defs>
          <linearGradient id="mancyRiver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.55" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Abstract Manchester street grid */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={40 + i * 68} y1="20" x2={40 + i * 68} y2="400" stroke="var(--color-border)" strokeWidth="1" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="20" y1={40 + i * 58} x2="620" y2={40 + i * 58} stroke="var(--color-border)" strokeWidth="1" />
        ))}

        {/* Abstract river network — Irwell / Irk / Medlock, stylized */}
        <path
          d="M 30 320 C 150 280, 200 340, 300 260 S 480 180, 610 210"
          fill="none"
          stroke="url(#mancyRiver)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M 260 40 C 240 120, 320 160, 300 260" fill="none" stroke="url(#mancyRiver)" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

        {/* Incident / transport markers */}
        {[
          { x: 300, y: 260, label: 'Piccadilly' },
          { x: 150, y: 200, label: 'Salford' },
          { x: 470, y: 160, label: 'Ancoats' },
        ].map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r={active ? 7 : 5} fill={ACCENT} opacity={active ? 0.9 : 0.5}>
              {active && <animate attributeName="r" values="5;9;5" dur="2.4s" repeatCount="indefinite" />}
            </circle>
            <text x={p.x + 12} y={p.y + 4} fill="var(--color-text-faint)" fontSize="11" fontFamily="var(--font-ui)">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <motion.div
        animate={{ opacity: active ? 1 : 0.6 }}
        className="pointer-events-none absolute top-8 left-8 max-w-xs rounded-md border px-4 py-3"
        style={{ borderColor: `${ACCENT}33`, background: 'rgba(5,5,6,0.55)' }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
          Local timeline
        </p>
        {shortTerm.length === 0 ? (
          <p className="mt-1.5 text-[12px] italic text-[var(--color-text-faint)]">No signals logged yet.</p>
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

export function MancyRoom() {
  return <RoomShell agentId="mancy" visual={<MancyVisual />} />
}
