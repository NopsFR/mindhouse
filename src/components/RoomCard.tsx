import type { AgentId } from '../agents/types'
import { agentRegistry } from '../agents/registry'
import { useFacilityStore } from '../state/store'
import { BrainMeter } from './BrainMeter'
import { StatusTag } from './StatusTag'

export function RoomCard({ agentId, size = 'md' }: { agentId: AgentId; size?: 'sm' | 'md' | 'lg' }) {
  const def = agentRegistry[agentId]
  const runtime = useFacilityStore((s) => s.runtimes[agentId])
  const goTo = useFacilityStore((s) => s.goTo)
  const active = runtime.state !== 'idle'

  const pad = size === 'lg' ? 'p-6' : size === 'sm' ? 'p-3.5' : 'p-4.5'

  return (
    <button
      onClick={() => goTo(agentId)}
      className={`group relative flex w-full flex-col gap-3 rounded-lg border text-left transition-all duration-300 ${pad}`}
      style={{
        borderColor: active ? `${def.accent}55` : 'var(--color-border)',
        background: active ? `${def.accent}0c` : 'var(--color-panel)',
      }}
    >
      {/* corner brackets — architectural, not a glow card */}
      <span className="absolute left-2 top-2 h-2 w-2 border-l border-t opacity-40" style={{ borderColor: def.accent }} />
      <span className="absolute right-2 bottom-2 h-2 w-2 border-r border-b opacity-40" style={{ borderColor: def.accent }} />

      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-display ${size === 'lg' ? 'text-3xl' : 'text-xl'} tracking-wide`} style={{ color: def.accent }}>
            {def.name}
          </h3>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">{def.role}</p>
        </div>
        <StatusTag state={runtime.state} accent={def.accent} />
      </div>

      {size !== 'sm' && <p className="text-[12px] leading-snug text-[var(--color-text-dim)]">{def.tagline}</p>}

      <div className="mt-auto flex items-center justify-between">
        <BrainMeter tier={def.brain.tier} accent={def.accent} size="sm" />
        {runtime.activity && (
          <span className="truncate text-[11px] italic text-[var(--color-text-faint)]" style={{ maxWidth: '55%' }}>
            {runtime.activity}
          </span>
        )}
      </div>
    </button>
  )
}
