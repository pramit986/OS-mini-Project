import { useState } from 'react'
import { runFifo, runLru, runOptimal } from '../algorithms/index.js'
import { motion, AnimatePresence } from 'framer-motion'

function getFaults(steps) {
  return steps.filter(s => s.fault).length
}

async function analyzeReferenceString(refs, currentFrameCount) {
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

  // Working set: rough estimate — pages in a sliding window of size total/4
  const windowSize = Math.max(4, Math.floor(total / 4))
  let maxWindow = 0
  for (let i = 0; i <= refs.length - windowSize; i++) {
    const window = new Set(refs.slice(i, i + windowSize)).size
    if (window > maxWindow) maxWindow = window
  }
  const workingSetSize = maxWindow

  // Find optimal frame count using elbow/slope detection (Heuristic Baseline)
  let recommendedFrames = 1
  const improvements = []
  for (let i = 1; i < table.length; i++) {
    improvements.push({
      frames: table[i].frames,
      gain: table[i - 1].lru - table[i].lru
    })
  }

  let elbowFound = false
  for (let i = 0; i < improvements.length; i++) {
    const curr = improvements[i]
    const next = improvements[i + 1]
    recommendedFrames = curr.frames
    if (curr.gain <= 1 && (!next || next.gain <= 1)) {
      elbowFound = true
      break
    }
  }

  if (!elbowFound) recommendedFrames = table[table.length - 1].frames
  recommendedFrames = Math.max(2, recommendedFrames)

  let beladysRisk = false
  for (let i = 1; i < table.length; i++) {
    if (table[i].fifo > table[i - 1].fifo) { beladysRisk = true; break }
  }

  const recRow = table.find(r => r.frames === recommendedFrames)
  const lruFaultRate = recRow ? recRow.lru / total : 1
  const confidence = lruFaultRate < 0.3 ? 'High' : lruFaultRate < 0.55 ? 'Medium' : 'Low'

  const recLru = recRow?.lru ?? '-'
  let reasoning = `With ${recommendedFrames} frames, LRU produces ${recLru} faults out of ${total} references — `
  if (lruFaultRate < 0.35) reasoning += `a strong hit ratio indicating good locality in this reference string. `
  else reasoning += `a reasonable balance between memory usage and performance. `
  reasoning += `The working set of this string is approximately ${workingSetSize} unique pages per window. `
  reasoning += recommendedFrames < workingSetSize
    ? `Adding more frames beyond ${recommendedFrames} gives diminishing returns since most locality is already captured.`
    : `This covers the full working set, so additional frames would show minimal improvement.`

  const tradeoffs = [-1, 0, 1].map(delta => {
    const f = recommendedFrames + delta
    const row = table.find(r => r.frames === f)
    if (!row) return null
    let verdict = ''
    if (delta === -1) verdict = `${row.lru} LRU faults — too many misses, working set not fully covered.`
    if (delta === 0) verdict = `${row.lru} LRU faults — optimal balance of memory use and hit rate.`
    if (delta === 1) verdict = `${row.lru} LRU faults — marginal gain of ${recLru - row.lru} fewer faults, extra frame may not be worth it.`
    return { frames: f, verdict }
  }).filter(Boolean)

  const fallbackResult = {
    recommendedFrames,
    confidence,
    reasoning,
    workingSetSize,
    beladysRisk,
    beladysExplanation: beladysRisk ? 'FIFO showed more faults with more frames at some point — avoid FIFO on this string if minimizing faults is critical.' : '',
    tradeoffs,
    table,
  }

  // Optimize with LLM API Call
  try {
    const API_KEY = "sk_en23s40r_XsfTt5S6YH1PrOn37G2TNvxf"
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "sarvam-30b",
        messages: [
          {
            role: "system",
            content: `You are an AI OS Memory Management Advisor. Analyze the page fault table for a reference string.
Return a valid JSON object ONLY, with NO markdown formatting or backticks. Format:
{
  "recommendedFrames": number (optimal frames using elbow/diminishing returns, max 8),
  "confidence": "High", "Medium", or "Low",
  "reasoning": "A concise, expert 2-sentence analysis of the string's locality and why this frame count is best.",
  "beladysRisk": boolean (true if FIFO shows Belady's anomaly in the table, false otherwise),
  "beladysExplanation": "Brief explanation if beladysRisk is true, else empty string",
  "tradeoffs": [
    { "frames": recommendedFrames - 1, "verdict": "short impact" },
    { "frames": recommendedFrames, "verdict": "short impact" },
    { "frames": recommendedFrames + 1, "verdict": "short impact" }
  ]
}`
          },
          {
            role: "user",
            content: `Total references: ${total}
Unique pages: ${uniquePages}
Working set size estimate: ${workingSetSize}

Fault Table (frames, fifo faults, lru faults, optimal faults):
${JSON.stringify(table, null, 2)}`
          }
        ],
        temperature: 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      let content = data.choices[0].message.content.trim();
      if (content.startsWith("```json")) {
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();
      } else if (content.startsWith("```")) {
        content = content.replace(/```/g, "").trim();
      }
      
      const llmResult = JSON.parse(content);
      const validTradeoffs = (llmResult.tradeoffs || []).filter(t => t && t.frames >= 1 && t.frames <= 8);

      return {
        recommendedFrames: llmResult.recommendedFrames || fallbackResult.recommendedFrames,
        confidence: llmResult.confidence || fallbackResult.confidence,
        reasoning: llmResult.reasoning || fallbackResult.reasoning,
        workingSetSize,
        beladysRisk: llmResult.beladysRisk !== undefined ? llmResult.beladysRisk : fallbackResult.beladysRisk,
        beladysExplanation: llmResult.beladysExplanation || fallbackResult.beladysExplanation,
        tradeoffs: validTradeoffs.length > 0 ? validTradeoffs : fallbackResult.tradeoffs,
        table,
        isLLM: true
      };
    } else {
      const errText = await response.text();
      console.warn("LLM API failed:", response.status, errText);
      return { ...fallbackResult, errorMsg: `API Failed (${response.status}): ${errText.substring(0, 80)}` };
    }
  } catch (err) {
    console.error("LLM API Error:", err);
    return { ...fallbackResult, errorMsg: `API Request Error: ${err.message}` };
  }
}

export function AIAdvisor({ referenceString, frameCount }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const analyze = async () => {
    if (!referenceString?.length) return
    setLoading(true)
    setOpen(true)
    setResult(null)
    
    // Fetch insights using LLM
    const r = await analyzeReferenceString(referenceString, frameCount)
    setResult(r)
    setLoading(false)
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
                    color: confidenceColor[result.confidence] || 'var(--os-text)',
                    background: (confidenceColor[result.confidence] || 'var(--os-text)') + '22',
                    border: `1px solid ${(confidenceColor[result.confidence] || 'var(--os-text)')}55`,
                    borderRadius: 4, padding: '1px 7px',
                  }}>
                    {result.confidence}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--os-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 6 }}>Working Set</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--os-accent)' }}>
                    ~{result.workingSetSize} pages
                  </span>
                  {result.isLLM && (
                    <span style={{ fontSize: '0.5rem', color: '#a78bfa', border: '1px solid #a78bfa', borderRadius: 4, padding: '1px 4px', marginLeft: 'auto' }}>
                      ✨ AI Powered
                    </span>
                  )}
                </div>
                {result.errorMsg && (
                  <div style={{
                    fontSize: '0.55rem', color: 'var(--os-fault)', background: 'rgba(248,81,73,0.1)',
                    border: '1px solid rgba(248,81,73,0.3)', borderRadius: 4, padding: '4px 8px', marginTop: 4, marginBottom: 2
                  }}>
                    <strong>Fallback Active:</strong> {result.errorMsg}
                  </div>
                )}
                <p style={{ fontSize: '0.68rem', color: 'var(--os-text)', margin: 0, lineHeight: 1.6 }}>
                  {result.reasoning}
                </p>
              </div>
            </div>

            {/* Belady's warning */}
            {result.beladysRisk && result.beladysExplanation && (
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