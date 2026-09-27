import type { AgentId } from '../agents/types'
import { useFacilityStore } from '../state/store'

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m`
}

/** The real tool-call log — every row is an actual request/response, never a fabricated animation. */
export function ToolActivityList({ agentId }: { agentId: AgentId }) {
  const activity = useFacilityStore((s) => s.toolActivity[agentId])
  const devToolsAvailable = useFacilityStore((s) => s.devToolsAvailable)

  if (activity.length === 0) {
    return (
      <p className="text-xs italic text-[var(--color-text-faint)]">
        {devToolsAvailable ? 'No tool calls yet this session.' : 'Local dev tools are not running — start with `npm run dev` to enable real tool calls.'}
      </p>
    )
  }

  return (
    <ul>
      {activity.map((r) => (
        <li key={r.id} className="border-t border-[var(--color-hairline)] py-2.5 first:border-t-0 first:pt-0">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em]">
            <span style={{ color: r.ok ? 'var(--color-text-dim)' : '#b4443c' }}>{r.tool}</span>
            <span className="ml-auto text-[var(--color-text-faint)]">{timeAgo(r.timestamp)} ago</span>
          </div>
          {Object.keys(r.args).length > 0 && (
            <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-faint)]">{JSON.stringify(r.args)}</p>
          )}
          <p className="mt-1 text-[13px] leading-snug text-[var(--color-text)]">{r.output.length > 240 ? `${r.output.slice(0, 240)}…` : r.output}</p>
        </li>
      ))}
    </ul>
  )
}
