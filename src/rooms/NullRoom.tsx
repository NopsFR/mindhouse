import { motion } from 'motion/react'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.null.accent

const SEVERITY_X: Record<string, number> = { high: 520, medium: 340, low: 160 }

function NullVisual() {
  const runtime = useFacilityStore((s) => s.runtimes.null)
  const shortTerm = useFacilityStore((s) => s.memories.null.shortTerm)
  const active = runtime.state !== 'idle'

  const nodes = shortTerm.slice(0, 5).map((m, i) => ({
    id: m.id,
    label: m.content.split(' — ')[0],
    x: 140 + ((i * 97) % 460),
    y: 90 + ((i * 61) % 220),
  }))

  return (
    <div className="relative h-full w-full overflow-hidden p-10">
      {/* Investigation board — an oscilloscope-like severity axis, not terminal rain. */}
      <svg viewBox="0 0 640 380" className="h-full w-full max-w-3xl mx-auto opacity-90">
        <line x1="60" y1="330" x2="600" y2="330" stroke="var(--color-border-strong)" strokeWidth="1" />
        {['low', 'medium', 'high'].map((s) => (
          <g key={s}>
            <line x1={SEVERITY_X[s]} y1="30" x2={SEVERITY_X[s]} y2="330" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 6" />
            <text x={SEVERITY_X[s]} y="350" textAnchor="middle" fill="var(--color-text-faint)" fontSize="10" letterSpacing="1">
              {s.toUpperCase()}
            </text>
          </g>
        ))}

        {nodes.map((n, i) => (
          <g key={n.id}>
            {i > 0 && (
              <line
                x1={nodes[i - 1].x}
                y1={nodes[i - 1].y}
                x2={n.x}
                y2={n.y}
                stroke={ACCENT}
                strokeOpacity="0.25"
                strokeWidth="1"
              />
            )}
            <circle cx={n.x} cy={n.y} r={active && i === 0 ? 7 : 5} fill={ACCENT} opacity={i === 0 ? 0.95 : 0.5 - i * 0.06}>
              {active && i === 0 && <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />}
            </circle>
          </g>
        ))}
      </svg>

      <motion.div
        animate={{ opacity: active ? 1 : 0.6 }}
        className="pointer-events-none absolute top-8 right-8 max-w-xs rounded-md border px-4 py-3"
        style={{ borderColor: `${ACCENT}33`, background: 'rgba(5,5,6,0.55)' }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
          Active investigation board
        </p>
        {nodes.length === 0 ? (
          <p className="mt-1.5 text-[12px] italic text-[var(--color-text-faint)]">No open threads.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {nodes.slice(0, 3).map((n) => (
              <li key={n.id} className="text-[12px] text-[var(--color-text-dim)]">
                {n.label}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}

export function NullRoom() {
  return <RoomShell agentId="null" visual={<NullVisual />} />
}
