export function StatsPanel({ hits, faults, stepsTotal }) {
  const denom = stepsTotal || 1
  const hitRatio = hits / denom
  const faultRatio = faults / denom
  const pct = (x) => `${(x * 100).toFixed(1)}%`

  const stats = [
    { label: 'Page Faults', value: faults, color: 'var(--os-fault)', glow: 'rgba(248,81,73,0.2)' },
    { label: 'Page Hits', value: hits, color: 'var(--os-hit)', glow: 'rgba(63,185,80,0.2)' },
    { label: 'Hit Ratio', value: pct(hitRatio), color: 'var(--os-accent)', glow: 'rgba(88,166,255,0.2)' },
    { label: 'Fault Ratio', value: pct(faultRatio), color: '#a78bfa', glow: 'rgba(167,139,250,0.2)' },
  ]

  return (
    <section className="glass-card-solid p-3">
      <p className="os-section-title">metrics.performance</p>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg p-2 text-center"
            style={{
              background: `${s.glow}`,
              border: `1px solid ${s.color}33`,
            }}
          >
            <div
              className="font-mono text-xl font-semibold tabular-nums"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-[10px] text-[var(--os-text-dim)] mt-0.5 uppercase tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
