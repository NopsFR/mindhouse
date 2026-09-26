import type { AgentBrain } from '../agents/types'
import { BrainMeter } from './BrainMeter'

const PROVIDER_LABEL: Record<AgentBrain['provider'], string> = {
  mock: 'Simulation',
  local: 'Local',
  cloud: 'Cloud',
}

/** The detailed brain readout used in a room header — tier plus what's actually configured, never invented. */
export function BrainReadout({ brain, accent }: { brain: AgentBrain; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrainMeter tier={brain.tier} accent={accent} />
      <span className="font-mono text-[10px] text-[var(--color-text-faint)]">
        {PROVIDER_LABEL[brain.provider]} &middot; {brain.model}
      </span>
    </div>
  )
}
