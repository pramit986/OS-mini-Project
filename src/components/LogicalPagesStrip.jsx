import { motion } from 'framer-motion'

/** Tiny visualization of logical address space as numbered pages. */
export function LogicalPagesStrip({ uniquePages, activePage }) {
  const sorted = [...uniquePages].sort((a, b) => a - b)
  return (
    <section className="glass-card-solid p-3">
      <p className="os-section-title">logical.pages (address space)</p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {sorted.map((p) => (
          <motion.span
            key={p}
            layout
            className={`rounded border px-2 py-0.5 font-mono text-[11px] transition ${
              p === activePage
                ? 'border-[var(--os-accent)] bg-[var(--os-accent)]/12 text-[var(--os-accent)] shadow-[0_0_6px_rgba(88,166,255,0.3)]'
                : 'border-[var(--os-border2)] bg-[var(--os-bg)] text-[var(--os-text-dim)]'
            }`}
          >
            p{p}
          </motion.span>
        ))}
      </div>
    </section>
  )
}
