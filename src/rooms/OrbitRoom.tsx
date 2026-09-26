import { useMemo } from 'react'
import { motion } from 'motion/react'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomShell } from './RoomShell'

const ACCENT = agentRegistry.orbit.accent

function useStarField(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.4 + 0.4,
        delay: Math.random() * 4,
      })),
    [count],
  )
}

function OrbitVisual() {
  const runtime = useFacilityStore((s) => s.runtimes.orbit)
  const shortTerm = useFacilityStore((s) => s.memories.orbit.shortTerm)
  const active = runtime.state !== 'idle'
  const stars = useStarField(80)

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'radial-gradient(ellipse at 70% 30%, #0d0f1a 0%, #050506 70%)' }}>
      <svg className="absolute inset-0 h-full w-full">
        {stars.map((s) => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#e9e7e0" opacity={0.5}>
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${4 + s.delay}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg viewBox="0 0 300 300" className="h-72 w-72" animate={{ rotate: 360 }} transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}>
          <circle cx="150" cy="150" r="36" fill={ACCENT} opacity="0.85" />
          <circle cx="150" cy="150" r="90" fill="none" stroke={ACCENT} strokeOpacity="0.3" strokeWidth="1" />
          <circle cx="150" cy="150" r="130" fill="none" stroke={ACCENT} strokeOpacity="0.16" strokeWidth="1" />
          <circle cx="240" cy="150" r={active ? 5 : 3.5} fill={ACCENT} />
        </motion.svg>
      </div>

      <motion.div
        animate={{ opacity: active ? 1 : 0.6 }}
        className="pointer-events-none absolute top-8 left-8 max-w-xs rounded-md border px-4 py-3"
        style={{ borderColor: `${ACCENT}33`, background: 'rgba(5,5,6,0.55)' }}
      >
        <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
          Observatory log
        </p>
        {shortTerm.length === 0 ? (
          <p className="mt-1.5 text-[12px] italic text-[var(--color-text-faint)]">Sky is quiet — nothing logged yet.</p>
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

export function OrbitRoom() {
  return <RoomShell agentId="orbit" visual={<OrbitVisual />} />
}
