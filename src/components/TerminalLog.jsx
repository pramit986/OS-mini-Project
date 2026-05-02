import { useEffect, useRef } from 'react'

export function TerminalLog({ lines }) {
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <section className="glass-card-solid p-3 flex flex-col h-full overflow-hidden">
      <p className="os-section-title">trace.log</p>
      <div className="flex-1 min-h-0 overflow-y-auto rounded border border-[var(--os-border)] bg-[var(--os-bg)] p-2 font-mono text-[10px] leading-relaxed">
        {lines.length === 0 ? (
          <span className="text-[var(--os-dim)]">
            // Run a simulation to append kernel-style trace lines.
          </span>
        ) : (
          lines.map((line, i) => (
            <div key={`${i}-${line.slice(0, 12)}`} className="whitespace-pre-wrap">
              <span className="text-[var(--os-dim)]">[{String(i + 1).padStart(3, '0')}]</span>{' '}
              <span className="text-[var(--os-text)]">{line}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  )
}
