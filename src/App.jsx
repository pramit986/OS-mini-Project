import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InputPanel } from './components/InputPanel.jsx'
import { FrameDisplay } from './components/FrameDisplay.jsx'
import { PageTable } from './components/PageTable.jsx'
import { StatsPanel } from './components/StatsPanel.jsx'
import { SimulationControls } from './components/SimulationControls.jsx'
import { ChartView } from './components/ChartView.jsx'
import { ExecutionTable } from './components/ExecutionTable.jsx'
import { TerminalLog } from './components/TerminalLog.jsx'
import { MemoryAllocation } from './components/MemoryAllocation.jsx'
import { MultiLevelPaging } from './components/MultiLevelPaging.jsx'
import { LogicalPagesStrip } from './components/LogicalPagesStrip.jsx'
import { runSimulation, compareAlgorithmsFaults } from './algorithms/index.js'
import { parseReferenceString } from './utils/parseReference.js'
import { StepNarration } from './components/StepNarration.jsx'
import { RaceMode } from './components/RaceMode.jsx'
import { AIAdvisor } from './components/AIAdvisor.jsx'
import { LandingPage } from './components/LandingPage.jsx'

const PLAY_MS = 520

function buildTraceLines(steps, currentStepIndex, algorithm, frameCount, refLen) {
  if (!steps.length) return []
  const head = [
    `kernel: simulator.start algo=${algorithm.toUpperCase()} frames=${frameCount} references=${refLen}`,
  ]
  const body = []
  for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
    const s = steps[i]
    const fs = s.frames.map((p) => (p === null ? '∅' : p)).join('|')
    body.push(
      `[${String(i + 1).padStart(3, '0')}] demand_ref page=${s.reference} → ${s.hit ? 'PAGE_HIT' : 'PAGE_FAULT'} | RAM=[${fs}]`,
    )
  }
  return [...head, ...body]
}

const TABS = [
  { id: 'simulator', label: ' Simulator' },
  { id: 'trace', label: ' Execution Trace' },
  { id: 'memory', label: ' Memory' },
  { id: 'race', label: '🏁 Race Mode' },
]

export default function App() {
  const [frameCount, setFrameCount] = useState(3)
  const [referenceString, setReferenceString] = useState(
    '7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1',
  )
  const [algorithm, setAlgorithm] = useState('fifo')
  const [steps, setSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('simulator')
  const [showSimulation, setShowSimulation] = useState(false)

  const refsParsed = useMemo(() => parseReferenceString(referenceString), [referenceString])
  const uniquePages = useMemo(() => [...new Set(refsParsed)], [refsParsed])

  const run = useCallback(() => {
    setError('')
    const refs = parseReferenceString(referenceString)
    if (refs.length === 0) {
      setError('Enter at least one non-negative page number in the reference string.')
      setSteps([])
      return
    }
    if (frameCount < 1 || frameCount > 16) {
      setError('Frame count must be between 1 and 16.')
      return
    }
    const nextSteps = runSimulation(algorithm, refs, frameCount)
    setSteps(nextSteps)
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }, [algorithm, frameCount, referenceString])

  const currentStep = steps[currentStepIndex] ?? null

  const cumulative = useMemo(() => {
    if (!steps.length) return { hits: 0, faults: 0 }
    let hits = 0
    let faults = 0
    const upto = Math.min(currentStepIndex, steps.length - 1)
    for (let i = 0; i <= upto; i++) {
      if (steps[i].hit) hits += 1
      else faults += 1
    }
    return { hits, faults }
  }, [steps, currentStepIndex])

  const chartFaults = useMemo(() => {
    if (!refsParsed.length || frameCount < 1) return { fifo: 0, lru: 0, optimal: 0 }
    return compareAlgorithmsFaults(refsParsed, frameCount)
  }, [refsParsed, frameCount])

  const logLines = useMemo(
    () => buildTraceLines(steps, currentStepIndex, algorithm, frameCount, refsParsed.length),
    [steps, currentStepIndex, algorithm, frameCount, refsParsed.length],
  )

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return undefined
    const id = setInterval(() => {
      setCurrentStepIndex((idx) => {
        if (idx >= steps.length - 1) {
          setIsPlaying(false)
          return idx
        }
        return idx + 1
      })
    }, PLAY_MS)
    return () => clearInterval(id)
  }, [isPlaying, steps])

  const handleReset = () => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }

  const handleNext = () => {
    setCurrentStepIndex((i) => Math.min(i + 1, Math.max(steps.length - 1, 0)))
  }

  const hasSimulation = steps.length > 0
  const refActive = currentStep?.reference ?? refsParsed[0]

  // Progress percentage
  const progressPct = hasSimulation ? ((currentStepIndex + 1) / steps.length) * 100 : 0

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--os-bg)',
      }}
    >
      <AnimatePresence mode="wait">
        {!showSimulation ? (
          <LandingPage key="landing" onStart={() => setShowSimulation(true)} />
        ) : (
          <motion.div
            key="simulation-core"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden' }}
          >
            {/* ── Navbar ── */}
            <header
        style={{
          height: 'var(--nav-h)',
          flexShrink: 0,
          borderBottom: '1px solid var(--os-border)',
          background: 'rgba(6,10,15,0.9)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 10,
        }}
      >
        {/* Left: branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="MemOS Logo" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '-0.01em',
              }}
              className="gradient-text"
            >
              MemOS
            </span>
            <span style={{ color: 'var(--os-dim)', fontSize: '0.7rem' }}>
              Virtual Memory &amp; Page Replacement Simulator
            </span>
          </div>
        </div>

        {/* Right: color legend */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem', color: 'var(--os-fault)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--os-fault)', display: 'inline-block', boxShadow: '0 0 6px var(--os-fault)' }} />
            FAULT
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem', color: 'var(--os-hit)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--os-hit)', display: 'inline-block', boxShadow: '0 0 6px var(--os-hit)' }} />
            HIT
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem', color: 'var(--os-accent)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--os-accent)', display: 'inline-block', boxShadow: '0 0 6px var(--os-accent)' }} />
            ACCENT
          </span>
          <span style={{ color: 'var(--os-dim)', fontSize: '0.6rem', fontFamily: 'inherit' }}>
            OS Lab · Memory Management
          </span>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav
        style={{
          height: 'var(--tab-h)',
          flexShrink: 0,
          borderBottom: '1px solid var(--os-border)',
          background: 'rgba(11,17,26,0.95)',
          display: 'flex',
          alignItems: 'stretch',
          padding: '0 16px',
          gap: '4px',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              position: 'relative',
              padding: '0 16px',
              fontSize: '0.72rem',
              fontFamily: 'inherit',
              fontWeight: 500,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--os-accent)' : 'var(--os-text-dim)',
              transition: 'color 0.15s',
              letterSpacing: '0.02em',
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, var(--os-accent), #a78bfa)',
                  borderRadius: '2px 2px 0 0',
                  boxShadow: '0 0 10px rgba(88,166,255,0.6)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}

        {/* Step progress bar (right side) */}
        {hasSimulation && (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingRight: '4px',
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--os-text-dim)', whiteSpace: 'nowrap' }}>
              step {currentStepIndex + 1} / {steps.length}
            </span>
            <div
              style={{
                width: 120,
                height: 4,
                background: 'var(--os-border)',
                borderRadius: 9999,
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--os-accent), #a78bfa)',
                  borderRadius: 9999,
                  boxShadow: '0 0 8px rgba(88,166,255,0.5)',
                }}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              />
            </div>
          </div>
        )}
      </nav>

      {/* ── Content area ── */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: '10px 14px',
        }}
      >
        <AnimatePresence mode="wait">
          {/* ═══ TAB: Simulator ═══ */}
          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingBottom: '12px',
              }}
            >
              {/* Row 1: Input + Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'start' }}>
                <InputPanel
                  frameCount={frameCount}
                  referenceString={referenceString}
                  algorithm={algorithm}
                  onFrameCountChange={setFrameCount}
                  onReferenceStringChange={setReferenceString}
                  onAlgorithmChange={setAlgorithm}
                  onRun={run}
                  onLoadExample={(ex) => setReferenceString(ex)}
                />
                <SimulationControls
                  onPlay={() => hasSimulation && setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onNext={handleNext}
                  onReset={handleReset}
                  isPlaying={isPlaying}
                  canStep={hasSimulation && currentStepIndex < steps.length - 1}
                  disabled={!hasSimulation}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="badge-fault" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  ⚠ {error}
                </div>
              )}

              {/* Row 2: Middle panels */}
              {hasSimulation && currentStep ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', minHeight: 260 }}>
                  <FrameDisplay
                    frames={currentStep.frames}
                    referencePage={currentStep.reference}
                    hit={currentStep.hit}
                    victimFrameIndex={currentStep.victimFrameIndex}
                  />
                  <PageTable frames={currentStep.frames} />
                  <ChartView
                    fifoFaults={chartFaults.fifo}
                    lruFaults={chartFaults.lru}
                    optimalFaults={chartFaults.optimal}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    border: '1px dashed var(--os-border2)',
                    color: 'var(--os-text-dim)',
                    fontSize: '0.8rem',
                    background: 'rgba(17,24,39,0.4)',
                    minHeight: 200,
                  }}
                >
                  Configure inputs above, then press{' '}
                  <span style={{ color: 'var(--os-accent)', margin: '0 4px' }}>▶ Run Simulation</span>{' '}
                  to start.
                </div>
              )}

              {/* Row 3: Narration + Stats + reference string */}
              {hasSimulation && currentStep && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <StepNarration
                    step={currentStep}
                    algorithm={algorithm}
                    stepIndex={currentStepIndex}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'start' }}>
                    <StatsPanel
                      hits={cumulative.hits}
                      faults={cumulative.faults}
                      stepsTotal={currentStepIndex + 1}
                    />
                    {/* Reference string progress */}
                    <section
                      className="glass-card-solid"
                      style={{ padding: '10px 12px', maxWidth: 420, minWidth: 280 }}
                    >
                      <p className="os-section-title" style={{ marginBottom: 6 }}>reference.string</p>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 4,
                          maxHeight: 60,
                          overflowY: 'auto',
                        }}
                      >
                        {refsParsed.map((p, i) => (
                          <span
                            key={`${i}-${p}`}
                            style={{
                              fontFamily: 'inherit',
                              fontSize: '0.7rem',
                              padding: '1px 6px',
                              borderRadius: 4,
                              border: '1px solid',
                              transition: 'all 0.12s',
                              ...(i === currentStepIndex
                                ? {
                                  background: 'rgba(88,166,255,0.18)',
                                  borderColor: 'var(--os-accent)',
                                  color: 'var(--os-accent)',
                                }
                                : i < currentStepIndex
                                  ? { background: 'transparent', borderColor: 'var(--os-dim)', color: 'var(--os-dim)' }
                                  : { background: 'transparent', borderColor: 'var(--os-border2)', color: 'var(--os-text-dim)' }),
                            }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* Row 4: AI Advisor */}
              {hasSimulation && currentStep && (
                <AIAdvisor
                  referenceString={refsParsed}
                  frameCount={frameCount}
                />
              )}

            </motion.div>
          )}

          {/* ═══ TAB: Execution Trace ═══ */}
          {activeTab === 'trace' && (
            <motion.div
              key="trace"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              style={{
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                gap: '8px',
              }}
            >
              {/* Logical pages strip */}
              <LogicalPagesStrip uniquePages={uniquePages} activePage={refActive} />

              {/* Trace + log side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '8px', minHeight: 0, height: '100%' }}>
                <ExecutionTable steps={steps} activeStepIndex={currentStepIndex} />
                <TerminalLog lines={logLines} />
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: Memory ═══ */}
          {activeTab === 'memory' && (
            <motion.div
              key="memory"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              style={{
                height: '100%',
                display: 'grid',
                gridTemplateRows: '1fr auto',
                gap: '8px',
              }}
            >
              <MemoryAllocation />
              <MultiLevelPaging />
            </motion.div>
          )}

          {/* ═══ TAB: Race Mode ═══ */}
          {activeTab === 'race' && (
            <motion.div
              key="race"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              style={{ height: '100%' }}
            >
              <RaceMode />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
