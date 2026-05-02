import { useMemo } from 'react'

function frameStateStr(frames) {
  return frames.map((p) => (p === null ? '-' : String(p))).join(' | ')
}

export function ExecutionTable({ steps, activeStepIndex }) {
  const rows = useMemo(() => {
    if (!steps?.length) return []
    return steps.map((s, i) => ({
      key: i,
      step: i + 1,
      page: s.reference,
      frames: frameStateStr(s.frames),
      result: s.hit ? 'HIT' : 'FAULT',
      isActive: i === activeStepIndex,
    }))
  }, [steps, activeStepIndex])

  return (
    <section className="glass-card-solid p-3 flex flex-col h-full overflow-hidden">
      <p className="os-section-title">execution.trace</p>
      <div className="flex-1 min-h-0 overflow-auto rounded border border-[var(--os-border)]">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-[var(--os-card)]">
            <tr className="border-b border-[var(--os-border2)]">
              <th className="px-2 py-1.5 font-normal text-[10px] uppercase tracking-wider text-[var(--os-text-dim)]">Step</th>
              <th className="px-2 py-1.5 font-normal text-[10px] uppercase tracking-wider text-[var(--os-text-dim)]">Page</th>
              <th className="px-2 py-1.5 font-normal text-[10px] uppercase tracking-wider text-[var(--os-text-dim)]">Frame State</th>
              <th className="px-2 py-1.5 font-normal text-[10px] uppercase tracking-wider text-[var(--os-text-dim)]">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.key}
                className={`border-b border-[var(--os-border)]/40 transition ${
                  r.isActive
                    ? 'bg-[var(--os-accent)]/8'
                    : 'hover:bg-[var(--os-bg)]'
                }`}
              >
                <td className="px-2 py-1 font-mono text-[var(--os-text-dim)]">{r.step}</td>
                <td className="px-2 py-1 font-mono font-semibold text-[var(--os-accent)]">{r.page}</td>
                <td className="px-2 py-1 font-mono text-[var(--os-text)]">{r.frames}</td>
                <td className="px-2 py-1">
                  <span className={r.result === 'HIT' ? 'badge-hit' : 'badge-fault'}>
                    {r.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
