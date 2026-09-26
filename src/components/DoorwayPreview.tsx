import { motion } from 'motion/react'
import type { AgentId } from '../agents/types'

/**
 * A small, real glimpse of each room — driven by the same `active` state as
 * the full room, just rendered at doorway scale. Not the detailed board
 * (that lives in the room itself), but not decoration either: it dims and
 * brightens with the actual agent state.
 */
export function DoorwayPreview({ agentId, accent, active }: { agentId: AgentId; accent: string; active: boolean }) {
  switch (agentId) {
    case 'jarvis':
      // A single calm light, not a hub with nodes wired to it.
      return (
        <motion.div
          animate={{ opacity: active ? [0.55, 0.8, 0.55] : 0.45 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="h-full w-full"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${accent}30 0%, ${accent}0a 40%, transparent 70%)` }}
        />
      )
    case 'mancy':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full opacity-90">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={30 + i * 35} y1="20" x2={30 + i * 35} y2="180" stroke="var(--color-hairline)" strokeWidth="1" />
          ))}
          <path d="M 20 130 C 70 110, 100 150, 180 120" fill="none" stroke={accent} strokeOpacity={active ? 0.6 : 0.35} strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="140" r={active ? 5 : 4} fill={accent} opacity={active ? 0.9 : 0.5} />
        </svg>
      )
    case 'null':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full opacity-90">
          <line x1="20" y1="160" x2="180" y2="160" stroke="var(--color-border-strong)" strokeWidth="1" />
          {[60, 110, 150].map((x) => (
            <line key={x} x1={x} y1="30" x2={x} y2="160" stroke="var(--color-hairline)" strokeWidth="1" strokeDasharray="2 5" />
          ))}
          <circle cx="60" cy="120" r="4" fill={accent} opacity="0.6" />
          <circle cx="110" cy="90" r="4" fill={accent} opacity="0.7" />
          <circle cx="150" cy="60" r={active ? 6 : 4} fill={accent} opacity={active ? 0.95 : 0.7} />
        </svg>
      )
    case 'atlas':
      return (
        <motion.svg viewBox="0 0 200 200" className="h-full w-full" animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}>
          <circle cx="100" cy="100" r="65" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="1" />
          <ellipse cx="100" cy="100" rx="65" ry="35" fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="1" />
          <ellipse cx="100" cy="100" rx="65" ry="55" fill="none" stroke={accent} strokeOpacity="0.14" strokeWidth="1" />
          <circle cx="150" cy="90" r={active ? 4 : 3} fill={accent} opacity={active ? 0.9 : 0.5} />
        </motion.svg>
      )
    case 'orbit':
      return (
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={(i * 37) % 200} cy={(i * 53) % 200} r={0.8} fill="#e9e7e0" opacity={0.5} />
          ))}
          <circle cx="100" cy="100" r="16" fill={accent} opacity={active ? 0.9 : 0.6} />
          <circle cx="100" cy="100" r="40" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="1" />
        </svg>
      )
  }
}
