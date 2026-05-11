import { motion, AnimatePresence } from 'framer-motion'

function getAlgorithmReason(algorithm, step, prevFrames) {
  if (step.hit) return null

  const { victimPage } = step

  if (!victimPage && victimPage !== 0) return null // no eviction (empty slot was used)

  if (algorithm === 'fifo') {
    return `Page ${victimPage} was evicted — it was the oldest page loaded into RAM (first in, first out).`
  }
  if (algorithm === 'lru') {
    return `Page ${victimPage} was evicted — it hadn't been used for the longest time (least recently used).`
  }
  if (algorithm === 'optimal') {
    return `Page ${victimPage} was evicted — it won't be needed again for the longest time in the future (optimal choice).`
  }
  return null
}

export function StepNarration({ step, algorithm, stepIndex }) {
  if (!step) return null

  const { reference, hit, fault, frames, victimPage, victimFrameIndex } = step

  const emptySlotUsed = fault && (victimPage === null || victimPage === undefined)

  let headline = ''
  let detail = ''
  let color = 'var(--os-accent)'

  if (hit) {
    headline = `Page ${reference} is already in RAM — Page Hit!`
    detail = `No eviction needed. The CPU can access page ${reference} directly from physical memory. This is the ideal case.`
    color = 'var(--os-hit)'
  } else if (emptySlotUsed) {
    headline = `Page ${reference} loaded into an empty frame — Page Fault (cold miss)`
    detail = `RAM had a free slot, so page ${reference} was loaded from disk without needing to evict anyone. This is a compulsory fault.`
    color = 'var(--os-fault)'
  } else {
    headline = `Page ${reference} not in RAM — Page Fault!`
    const reason = getAlgorithmReason(algorithm, step)
    detail = reason
      ? `Page ${reference} was loaded from disk. ${reason}`
      : `Page ${reference} was loaded from disk into frame ${victimFrameIndex}.`
    color = 'var(--os-fault)'
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`narration-${stepIndex}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--os-card)',
          border: `1px solid ${color}44`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>
            {headline}
          </span>
        </div>
        <p style={{ fontSize: '0.68rem', color: 'var(--os-text-dim)', margin: 0, paddingLeft: 15, lineHeight: 1.6 }}>
          {detail}
        </p>
      </motion.div>
    </AnimatePresence>
  )
}