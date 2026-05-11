import { motion, AnimatePresence } from 'framer-motion'

/**
 * Visualize physical frames; highlights hit/fault and active frame.
 */
export function FrameDisplay({
  frames,
  referencePage,
  hit,
  victimFrameIndex,
  labels = true,
}) {
  return (
    <section className="glass-card-solid p-3 flex flex-col gap-2 h-full">
      <p className="os-section-title">physical.frames</p>
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {frames.map((page, idx) => {
            const holdsRef = page === referencePage && page !== null
            const hitHighlight = hit && holdsRef
            const faultAtVictim =
              !hit &&
              (victimFrameIndex === idx ||
                (victimFrameIndex === null && holdsRef))

            let borderCls = 'border-[var(--os-border2)]'
            let glowCls = ''
            if (hitHighlight) {
              borderCls = 'border-[var(--os-hit)]'
              glowCls = 'frame-hit-glow'
            } else if (faultAtVictim) {
              borderCls = 'border-[var(--os-fault)]'
              glowCls = 'frame-fault-glow'
            } else if (holdsRef) {
              borderCls = 'border-[var(--os-accent)]'
              glowCls = 'frame-active-glow'
            }

            return (
              <motion.div
                key={`frame-${idx}`}
                layout
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className={`relative flex min-h-[72px] min-w-[60px] flex-col items-center justify-center rounded-lg border-2 bg-[var(--os-bg)] px-3 py-2 transition-colors duration-300 ${borderCls} ${glowCls}`}
              >
                {labels && (
                  <span className="absolute left-1.5 top-1 text-[9px] text-[var(--os-dim)]">f{idx}</span>
                )}
                <span
                  className={`font-mono text-2xl font-semibold ${
                    page === null
                      ? 'text-[var(--os-dim)]'
                      : hitHighlight
                      ? 'text-[var(--os-hit)]'
                      : faultAtVictim
                      ? 'text-[var(--os-fault)]'
                      : 'text-[var(--os-text)]'
                  }`}
                >
                  {page === null ? '∅' : page}
                </span>
                {hitHighlight && (
                  <span className="absolute right-1 top-1 text-[8px] text-[var(--os-hit)] font-bold">HIT</span>
                )}
                {faultAtVictim && (
                  <span className="absolute right-1 top-1 text-[8px] text-[var(--os-fault)] font-bold">MISS</span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <p className="text-[10px] text-[var(--os-text-dim)] leading-relaxed">
        Demand paging — faults load pages from backing store on demand.
      </p>
    </section>
  )
}
