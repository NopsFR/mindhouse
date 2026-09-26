interface BrainMeterProps {
  tier: number
  accent: string
  size?: 'sm' | 'md'
}

/** Capability indicator. Five architectural ticks, not a cartoonish "IQ" gauge. */
export function BrainMeter({ tier, accent, size = 'md' }: BrainMeterProps) {
  const height = size === 'sm' ? 10 : 14
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-[3px]" aria-label={`Brain tier ${tier} of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const active = i < tier
          const barHeight = height * (0.45 + (i / 4) * 0.55)
          return (
            <span
              key={i}
              style={{
                height: barHeight,
                width: size === 'sm' ? 3 : 4,
                background: active ? accent : 'var(--color-border-strong)',
                opacity: active ? 1 : 0.5,
              }}
              className="rounded-[1px] transition-colors duration-500"
            />
          )
        })}
      </div>
      <span className="text-[10px] tracking-[0.14em] uppercase text-[var(--color-text-faint)]">
        Tier {tier}
      </span>
    </div>
  )
}
