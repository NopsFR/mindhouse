import { motion } from 'motion/react'
import { agentRegistry, specialistIds } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { RoomCard } from '../components/RoomCard'
import { ActivityFeed } from '../components/ActivityFeed'
import { BrainMeter } from '../components/BrainMeter'
import { StatusTag } from '../components/StatusTag'

const SIZE = 600
const CENTER = SIZE / 2
const RADIUS = 235

function RadialLayout() {
  const runtimes = useFacilityStore((s) => s.runtimes)
  const jarvis = agentRegistry.jarvis

  return (
    <div className="relative mx-auto hidden shrink-0 md:block" style={{ width: SIZE, height: SIZE }}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {specialistIds.map((id, i) => {
          const angle = (i / specialistIds.length) * Math.PI * 2 - Math.PI / 2
          const x = CENTER + Math.cos(angle) * RADIUS
          const y = CENTER + Math.sin(angle) * RADIUS
          const busy = runtimes[id].state !== 'idle'
          const accent = agentRegistry[id].accent
          return (
            <line
              key={id}
              x1="360"
              y1="360"
              x2={x}
              y2={y}
              stroke={accent}
              strokeOpacity={busy ? 0.5 : 0.14}
              strokeWidth={busy ? 2 : 1}
            />
          )
        })}
      </svg>

      {/* Central Jarvis tile */}
      <div
        className="absolute flex flex-col items-center justify-center gap-2 rounded-full border text-center"
        style={{
          width: 160,
          height: 160,
          left: CENTER - 80,
          top: CENTER - 80,
          borderColor: `${jarvis.accent}44`,
          background: `radial-gradient(circle at 50% 30%, ${jarvis.accent}1c, var(--color-panel))`,
        }}
      >
        <button onClick={() => useFacilityStore.getState().goTo('jarvis')} className="flex flex-col items-center gap-1.5 px-4">
          <h2 className="font-display text-2xl tracking-wide" style={{ color: jarvis.accent }}>
            Jarvis
          </h2>
          <StatusTag state={runtimes.jarvis.state} accent={jarvis.accent} />
          <BrainMeter tier={jarvis.brain.tier} accent={jarvis.accent} size="sm" />
        </button>
      </div>

      {specialistIds.map((id, i) => {
        const angle = (i / specialistIds.length) * Math.PI * 2 - Math.PI / 2
        const x = CENTER + Math.cos(angle) * RADIUS
        const y = CENTER + Math.sin(angle) * RADIUS
        return (
          <div key={id} className="absolute w-[190px]" style={{ left: x - 95, top: y - 62 }}>
            <RoomCard agentId={id} size="sm" />
          </div>
        )
      })}
    </div>
  )
}

function StackedLayout() {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <RoomCard agentId="jarvis" size="lg" />
      {specialistIds.map((id) => (
        <RoomCard key={id} agentId={id} />
      ))}
    </div>
  )
}

export function Building() {
  const runtimes = useFacilityStore((s) => s.runtimes)
  const onlineCount = Object.keys(runtimes).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="font-display text-xl tracking-[0.08em]">MINDHOUSE</h1>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">{onlineCount} systems online &middot; simulated intelligence facility</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-8 overflow-y-auto px-8 pb-8 md:overflow-hidden">
        <div className="flex flex-1 items-center justify-center overflow-y-auto">
          <RadialLayout />
          <StackedLayout />
        </div>

        <aside className="hidden w-[320px] shrink-0 flex-col gap-3 border-l border-[var(--color-border)] pl-8 lg:flex">
          <h4 className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">Facility activity</h4>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ActivityFeed limit={20} />
          </div>
        </aside>
      </div>
    </motion.div>
  )
}
