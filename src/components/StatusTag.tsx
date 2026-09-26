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

interface StatusTagProps {
  state: AgentState
  accent: string
}

export function StatusTag({ state, accent }: StatusTagProps) {
  const active = state !== 'idle'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] uppercase"
      style={{
        borderColor: active ? `${accent}55` : 'var(--color-border)',
        color: active ? accent : 'var(--color-text-faint)',
        background: active ? `${accent}14` : 'transparent',
      }}
    >
      <span
        className={active ? 'animate-pulse-soft' : ''}
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: active ? accent : 'var(--color-text-faint)',
          display: 'inline-block',
        }}
      />
      {LABEL[state]}
    </span>
  )
}
