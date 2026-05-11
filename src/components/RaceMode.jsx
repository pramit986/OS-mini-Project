import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { runFifo, runLru, runOptimal } from '../algorithms/index.js'
import { parseReferenceString } from '../utils/parseReference.js'

const ALGO_META = [
  { key: 'fifo',    label: 'FIFO',    color: '#58a6ff', glow: 'rgba(88,166,255,0.2)'   },
  { key: 'lru',     label: 'LRU',     color: '#3fb950', glow: 'rgba(63,185,80,0.2)'    },
  { key: 'optimal', label: 'Optimal', color: '#a78bfa', glow: 'rgba(167,139,250,0.2)'  },
]

const PLAY_MS = 600

function FrameColumn({ algo, step, faultCount, isWinning, totalSteps, stepIndex }) {
  if (!step) return null
  const { frames, hit, fault, victimFrameIndex, reference } = step

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--os-card)',
        border: `1px solid ${isWinning ? algo.color : 'var(--os-border)'}`,
        borderRadius: 12,
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        flex: 1,
        boxShadow: isWinning ? `0 0 18px ${algo.glow}` : 'none',
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: algo.color, boxShadow: `0 0 6px ${algo.color}`,
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: algo.color, letterSpacing: '0.04em' }}>
            {algo.label}
          </span>
          {isWinning && (
            <span style={{
              fontSize: '0.55rem', background: algo.color + '22',
              color: algo.color, border: `1px solid ${algo.color}55`,
              borderRadius: 4, padding: '1px 5px', fontWeight: 600,
            }}>
              WINNING
            </span>
          )}
        </div>
        <span style={{
          fontSize: '0.65rem', color: fault ? 'var(--os-fault)' : 'var(--os-hit)',
          fontWeight: 700, letterSpacing: '0.05em',
        }}>
          {fault ? '✗ FAULT' : '✓ HIT'}
        </span>
      </div>

      {/* Frames */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <AnimatePresence mode="popLayout">
          {frames.map((page, idx) => {
            const holdsRef = page === reference && page !== null
            const isVictim = !hit && victimFrameIndex === idx
            const isHit = hit && holdsRef

            let borderColor = 'var(--os-border2)'
            let textColor = 'var(--os-text-dim)'
            let bgColor = 'transparent'

            if (isHit) {
              borderColor = 'var(--os-hit)'
              textColor = 'var(--os-hit)'
              bgColor = 'rgba(63,185,80,0.08)'
            } else if (isVictim) {
              borderColor = 'var(--os-fault)'
              textColor = 'var(--os-fault)'
              bgColor = 'rgba(248,81,73,0.08)'
            } else if (holdsRef) {
              borderColor = algo.color
              textColor = algo.color
              bgColor = algo.glow
            }

            return (
              <motion.div
                key={`f-${idx}`}
                layout
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                style={{
                  minWidth: 44, minHeight: 52,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: `2px solid ${borderColor}`,
                  background: bgColor, position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '0.55rem', color: 'var(--os-dim)', position: 'absolute', top: 3, left: 5 }}>
                  f{idx}
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: page === null ? 'var(--os-dim)' : textColor }}>
                  {page === null ? '∅' : page}
                </span>
                {isHit && <span style={{ fontSize: '0.45rem', color: 'var(--os-hit)', fontWeight: 700, position: 'absolute', top: 3, right: 4 }}>HIT</span>}
                {isVictim && <span style={{ fontSize: '0.45rem', color: 'var(--os-fault)', fontWeight: 700, position: 'absolute', top: 3, right: 4 }}>OUT</span>}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Fault counter */}
      <div style={{
        marginTop: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--os-border)', paddingTop: 8,
      }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--os-text-dim)' }}>Page Faults</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: algo.color, fontFamily: 'inherit' }}>
          {faultCount}
        </span>
      </div>
    </motion.div>
  )
}

export function RaceMode() {
  const [frameCount, setFrameCount] = useState(3)
  const [referenceString, setReferenceString] = useState('7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1')
  const [allSteps, setAllSteps] = useState(null) // { fifo, lru, optimal }
  const [stepIndex, setStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(() => {
    setError('')
    const refs = parseReferenceString(referenceString)
    if (refs.length === 0) {
      setError('Enter at least one page number.')
      return
    }
    if (frameCount < 1 || frameCount > 16) {
      setError('Frame count must be between 1 and 16.')
      return
    }
    setAllSteps({
      fifo: runFifo(refs, frameCount),
      lru: runLru(refs, frameCount),
      optimal: runOptimal(refs, frameCount),
    })
    setStepIndex(0)
    setIsPlaying(false)
  }, [referenceString, frameCount])

  useEffect(() => {
    if (!isPlaying || !allSteps) return
    const id = setInterval(() => {
      setStepIndex((i) => {
        if (i >= allSteps.fifo.length - 1) { setIsPlaying(false); return i }
        return i + 1
      })
    }, PLAY_MS)
    return () => clearInterval(id)
  }, [isPlaying, allSteps])

  const hasRace = !!allSteps
  const totalSteps = allSteps?.fifo.length ?? 0

  // Cumulative faults up to current step
  const faultCounts = useMemo(() => {
    if (!allSteps) return { fifo: 0, lru: 0, optimal: 0 }
    const count = (steps) => steps.slice(0, stepIndex + 1).filter(s => s.fault).length
    return { fifo: count(allSteps.fifo), lru: count(allSteps.lru), optimal: count(allSteps.optimal) }
  }, [allSteps, stepIndex])

  const minFaults = hasRace ? Math.min(faultCounts.fifo, faultCounts.lru, faultCounts.optimal) : 0

  // Current page being referenced
  const currentPage = allSteps?.fifo[stepIndex]?.reference

  // Reference string parsed
  const refsParsed = useMemo(() => parseReferenceString(referenceString), [referenceString])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Input row */}
      <section className="glass-card-solid p-3">
        <p className="os-section-title">race.input</p>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 120px', gap: 8, marginBottom: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Frames</span>
            <input
              type="number" min={1} max={16} value={frameCount}
              onChange={e => setFrameCount(Number(e.target.value))}
              className="os-input"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reference String</span>
            <input
              type="text" value={referenceString}
              onChange={e => setReferenceString(e.target.value)}
              placeholder="e.g. 7,0,1,2,0,3..."
              className="os-input font-mono"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Algorithms</span>
            <div className="os-input" style={{ color: 'var(--os-text-dim)', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}>
              FIFO · LRU · Optimal
            </div>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={run} className="os-btn os-btn-primary">▶ Start Race</button>
          {hasRace && (
            <>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="os-btn"
                disabled={stepIndex >= totalSteps - 1 && !isPlaying}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={() => setStepIndex(i => Math.min(i + 1, totalSteps - 1))}
                className="os-btn"
                disabled={isPlaying || stepIndex >= totalSteps - 1}
              >
                ⏭ Next
              </button>
              <button
                onClick={() => { setStepIndex(0); setIsPlaying(false) }}
                className="os-btn"
              >
                ↺ Reset
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--os-text-dim)' }}>
                step {stepIndex + 1} / {totalSteps}
                {currentPage !== undefined && (
                  <span style={{ color: 'var(--os-accent)', marginLeft: 8 }}>
                    referencing page <strong>{currentPage}</strong>
                  </span>
                )}
              </span>
            </>
          )}
        </div>
        {error && <p style={{ color: 'var(--os-fault)', fontSize: '0.72rem', marginTop: 6 }}>⚠ {error}</p>}
      </section>

      {/* Race columns */}
      {hasRace ? (
        <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>
          {ALGO_META.map(algo => (
            <FrameColumn
              key={algo.key}
              algo={algo}
              step={allSteps[algo.key][stepIndex]}
              faultCount={faultCounts[algo.key]}
              isWinning={faultCounts[algo.key] === minFaults}
              totalSteps={totalSteps}
              stepIndex={stepIndex}
            />
          ))}
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed var(--os-border2)', borderRadius: 10,
          color: 'var(--os-text-dim)', fontSize: '0.8rem',
          background: 'rgba(17,24,39,0.4)', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: '1.4rem' }}>🏁</div>
          <div>Press <span style={{ color: 'var(--os-accent)' }}>▶ Start Race</span> to run all 3 algorithms side by side</div>
        </div>
      )}

      {/* Reference string tracker */}
      {hasRace && (
        <section className="glass-card-solid" style={{ padding: '8px 12px' }}>
          <p className="os-section-title" style={{ marginBottom: 5 }}>reference.string</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 48, overflowY: 'auto' }}>
            {refsParsed.map((p, i) => (
              <span
                key={`${i}-${p}`}
                style={{
                  fontFamily: 'inherit', fontSize: '0.68rem',
                  padding: '1px 6px', borderRadius: 4, border: '1px solid',
                  transition: 'all 0.12s',
                  ...(i === stepIndex
                    ? { background: 'rgba(88,166,255,0.18)', borderColor: 'var(--os-accent)', color: 'var(--os-accent)' }
                    : i < stepIndex
                      ? { background: 'transparent', borderColor: 'var(--os-dim)', color: 'var(--os-dim)' }
                      : { background: 'transparent', borderColor: 'var(--os-border2)', color: 'var(--os-text-dim)' }),
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}