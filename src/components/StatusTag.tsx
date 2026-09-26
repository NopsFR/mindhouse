import type { AgentState } from '../agents/types'

const LABEL: Record<AgentState, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  researching: 'Researching',
  processing: 'Processing',
  communicating: 'Communicating',
  waiting: 'Waiting',
  reporting: 'Reporting',
}

/** A dot and a word — no pill, no border. Hierarchy comes from color and motion, not chrome. */
export function StatusTag({ state, accent }: { state: AgentState; accent: string }) {
  const active = state !== 'idle'
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.04em]" style={{ color: active ? accent : 'var(--color-text-faint)' }}>
      <span
        className={active ? 'animate-pulse-soft' : ''}
        style={{ width: 5, height: 5, borderRadius: '50%', background: active ? accent : 'var(--color-text-faint)', display: 'inline-block' }}
      />
      {LABEL[state]}
    </span>
  )
}
