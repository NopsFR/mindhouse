import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomReadout } from '../components/RoomReadout'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.null.accent

const SEVERITY_X: Record<string, number> = { high: 520, medium: 340, low: 160 }

export function NullVisual() {
  const runtime = useFacilityStore((s) => s.runtimes.null)
  const shortTerm = useFacilityStore((s) => s.memories.null.shortTerm)
  const active = runtime.state !== 'idle'

  const nodes = shortTerm.slice(0, 5).map((m, i) => ({
    id: m.id,
    label: m.content,
    x: 140 + ((i * 97) % 460),
    y: 90 + ((i * 61) % 220),
  }))

  return (
    <div className="relative h-full w-full overflow-hidden p-10">
      {/* Investigation board — a severity axis with linked findings, not terminal rain. */}
      <svg viewBox="0 0 640 380" className="h-full w-full max-w-3xl mx-auto opacity-90">
        <line x1="60" y1="330" x2="600" y2="330" stroke="var(--color-border-strong)" strokeWidth="1" />
        {['low', 'medium', 'high'].map((s) => (
          <g key={s}>
            <line x1={SEVERITY_X[s]} y1="30" x2={SEVERITY_X[s]} y2="330" stroke="var(--color-hairline)" strokeWidth="1" strokeDasharray="2 6" />
            <text x={SEVERITY_X[s]} y="350" textAnchor="middle" fill="var(--color-text-faint)" fontSize="10" letterSpacing="1" fontFamily="var(--font-mono)">
              {s.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Pins on the board, not nodes on a network — no connecting lines between findings. */}
        {nodes.map((n, i) => (
          <g key={n.id}>
            <line x1={n.x} y1={n.y} x2={n.x} y2="330" stroke={ACCENT} strokeOpacity="0.15" strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r={active && i === 0 ? 7 : 5} fill={ACCENT} opacity={i === 0 ? 0.95 : 0.5 - i * 0.06}>
              {active && i === 0 && <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />}
            </circle>
          </g>
        ))}
      </svg>

      <RoomReadout
        accent={ACCENT}
        label="Active investigation"
        items={nodes.slice(0, 3).map((n) => n.label)}
        emptyText="No open threads."
        active={active}
        corner="top-right"
      />
    </div>
  )
}

export function NullRoom() {
  return <RoomShell agentId="null" visual={<NullVisual />} />
}
