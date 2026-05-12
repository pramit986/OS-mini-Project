import { useState } from 'react'
import { runFifo, runLru, runOptimal } from '../algorithms/index.js'
import { motion, AnimatePresence } from 'framer-motion'

function getFaults(steps) {
  return steps.filter(s => s.fault).length
}

function analyzeReferenceString(refs, currentFrameCount) {
  const uniquePages = [...new Set(refs)].length
  const total = refs.length

  // Compute fault table for frames 1..min(8, uniquePages)
  const table = []
  for (let f = 1; f <= Math.min(8, uniquePages); f++) {
    table.push({
      frames: f,
      fifo: getFaults(runFifo(refs, f)),
      lru: getFaults(runLru(refs, f)),
      optimal: getFaults(runOptimal(refs, f)),
    })
  }

  // Find where LRU faults drop and diminishing returns kick in
  // Find optimal frame count using elbow/slope detection
  // Strategy: find where adding one more frame saves less than 1 fault
  // AND the absolute fault rate is acceptable (< 50%)
  let recommendedFrames = 1

  // First find the maximum improvement per step
  const improvements = []
  for (let i = 1; i < table.length; i++) {
    improvements.push({
      frames: table[i].frames,
      gain: table[i - 1].lru - table[i].lru
    })
  }

  // Find the elbow — where gain drops to 0 or 1 consistently
  let elbowFound = false
  for (let i = 0; i < improvements.length; i++) {
    const curr = improvements[i]
    const next = improvements[i + 1]
    recommendedFrames = curr.frames

    // Stop if this step gave 0 gain AND next step also gives 0-1 gain
    if (curr.gain <= 1 && (!next || next.gain <= 1)) {
      elbowFound = true
      break
    }
  }

  // If no elbow found, recommend the last frame size computed
  if (!elbowFound) {
    recommendedFrames = table[table.length - 1].frames
  }

  // Never recommend less than 2
  recommendedFrames = Math.max(2, recommendedFrames)

  // Working set: rough estimate — pages in a sliding window of size total/4
  const windowSize = Math.max(4, Math.floor(total / 4))
  let maxWindow = 0
  for (let i = 0; i <= refs.length - windowSize; i++) {
    const window = new Set(refs.slice(i, i + windowSize)).size
    if (window > maxWindow) maxWindow = window
  }
  const workingSetSize = maxWindow

  // Belady's anomaly check — does FIFO get worse with more frames?
  let beladysRisk = false
  for (let i = 1; i < table.length; i++) {
    if (table[i].fifo > table[i - 1].fifo) { beladysRisk = true; break }
  }

  // Confidence
  const recRow = table.find(r => r.frames === recommendedFrames)
  const lruFaultRate = recRow ? recRow.lru / total : 1
  const confidence = lruFaultRate < 0.3 ? 'High' : lruFaultRate < 0.55 ? 'Medium' : 'Low'

  // Reasoning
  const recFifo = recRow?.fifo ?? '-'
  const recLru  = recRow?.lru  ?? '-'
  const recOpt  = recRow?.optimal ?? '-'

  let reasoning = `With ${recommendedFrames} frames, LRU produces ${recLru} faults out of ${total} references — `
  if (lruFaultRate < 0.35) {
    reasoning += `a strong hit ratio indicating good locality in this reference string. `
  } else {
    reasoning += `a reasonable balance between memory usage and performance. `
  }
  reasoning += `The working set of this string is approximately ${workingSetSize} unique pages per window. `
  reasoning += recommendedFrames < workingSetSize
    ? `Adding more frames beyond ${recommendedFrames} gives diminishing returns since most locality is already captured.`
    : `This covers the full working set, so additional frames would show minimal improvement.`

  // Tradeoffs
  const tradeoffs = [-1, 0, 1].map(delta => {
    const f = recommendedFrames + delta
    const row = table.find(r => r.frames === f)
    if (!row) return null
    let verdict = ''
    if (delta === -1) verdict = `${row.lru} LRU faults — too many misses, working set not fully covered.`
    if (delta === 0)  verdict = `${row.lru} LRU faults — optimal balance of memory use and hit rate.`
    if (delta === 1)  verdict = `${row.lru} LRU faults — marginal gain of ${recLru - row.lru} fewer faults, extra frame may not be worth it.`
    return { frames: f, verdict }
  }).filter(Boolean)

  return {
    recommendedFrames,
    confidence,
    reasoning,
    workingSetSize,
    beladysRisk,
    beladysExplanation: beladysRisk
      ? 'FIFO showed more faults with more frames at some point — avoid FIFO on this string if minimizing faults is critical.'
      : '',
    tradeoffs,
    table,
  }
}

export function AIAdvisor({ referenceString, frameCount }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const analyze = () => {
    if (!referenceString?.length) return
    setLoading(true)
    setOpen(true)
    setResult(null)
    // Small timeout so the loading state is visible
    setTimeout(() => {
      const r = analyzeReferenceString(referenceString, frameCount)
      setResult(r)
      setLoading(false)
    }, 600)
  }

  const confidenceColor = {
    High: 'var(--os-hit)',
    Medium: '#f0a500',
    Low: 'var(--os-fault)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Trigger button */}
      <button
        onClick={analyze}
        disabled={loading || !referenceString?.length}
        style={{
          background: loading
            ? 'rgba(167,139,250,0.08)'
            : 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(88,166,255,0.08))',
          border: '1px solid rgba(167,139,250,0.4)',
          borderRadius: 8,
          color: loading ? 'var(--os-text-dim)' : '#a78bfa',
          fontSize: '0.72rem',
          fontFamily: 'inherit',
          fontWeight: 600,
          padding: '7px 16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          transition: 'all 0.2s',
          letterSpacing: '0.02em',
          width: 'fit-content',
        }}
      >
        <span>✦</span>
        {loading ? 'Analyzing reference string...' : 'AI Frame Advisor'}
        {loading && (
          <span style={{
            width: 10, height: 10,
            border: '2px solid #a78bfa44',
            borderTop: '2px solid #a78bfa',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }} />
        )}
      </button>

      {/* Result panel */}
      <AnimatePresence>
        {open && result && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'var(--os-card)',
              border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
              {/* Recommended frames badge */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: 10, padding: '10px 20px', minWidth: 90,
              }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Recommended
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1.1 }}>
                  {result.recommendedFrames}
                </span>
                <span style={{ fontSize: '0.55rem', color: 'var(--os-text-dim)' }}>frames</span>
              </div>

              {/* Confidence + working set + reasoning */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confidence</span>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700,
                    color: confidenceColor[result.confidence],
                    background: confidenceColor[result.confidence] + '22',
                    border: `1px solid ${confidenceColor[result.confidence]}55`,
                    borderRadius: 4, padding: '1px 7px',
                  }}>
                    {result.confidence}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 6 }}>Working Set</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--os-accent)' }}>
                    ~{result.workingSetSize} pages
                  </span>
                </div>
                <p style={{ fontSize: '0.68rem', color: 'var(--os-text)', margin: 0, lineHeight: 1.6 }}>
                  {result.reasoning}
                </p>
              </div>
            </div>

            {/* Belady's warning */}
            {result.beladysRisk && (
              <div style={{
                background: 'rgba(248,81,73,0.08)',
                border: '1px solid rgba(248,81,73,0.3)',
                borderLeft: '3px solid var(--os-fault)',
                borderRadius: 6, padding: '7px 12px',
                fontSize: '0.67rem', color: 'var(--os-fault)', lineHeight: 1.5,
              }}>
                ⚠ <strong>Belady's Anomaly Detected:</strong> {result.beladysExplanation}
              </div>
            )}

            {/* Tradeoff rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Frame Size Tradeoffs
              </span>
              {result.tradeoffs.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: t.frames === result.recommendedFrames ? 'rgba(167,139,250,0.07)' : 'transparent',
                  border: t.frames === result.recommendedFrames ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
                  borderRadius: 6, padding: '5px 10px',
                }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, minWidth: 22, textAlign: 'center',
                    color: t.frames === result.recommendedFrames ? '#a78bfa' : 'var(--os-text-dim)',
                  }}>
                    {t.frames}
                  </span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--os-dim)', minWidth: 46 }}>
                    {t.frames === result.recommendedFrames ? '← optimal' : 'frames'}
                  </span>
                  <span style={{ fontSize: '0.67rem', color: 'var(--os-text-dim)', lineHeight: 1.4 }}>
                    {t.verdict}
                  </span>
                </div>
              ))}
            </div>

            {/* Fault table across all frame sizes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Full Fault Table
              </span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {result.table.map(row => (
                  <div key={row.frames} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: row.frames === result.recommendedFrames ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                    border: row.frames === result.recommendedFrames ? '1px solid rgba(167,139,250,0.35)' : '1px solid var(--os-border)',
                    borderRadius: 7, padding: '6px 10px', minWidth: 52,
                  }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--os-dim)' }}>f={row.frames}</span>
                    <span style={{ fontSize: '0.62rem', color: '#58a6ff' }}>F:{row.fifo}</span>
                    <span style={{ fontSize: '0.62rem', color: '#3fb950' }}>L:{row.lru}</span>
                    <span style={{ fontSize: '0.62rem', color: '#a78bfa' }}>O:{row.optimal}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}