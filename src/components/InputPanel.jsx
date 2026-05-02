import { motion } from 'framer-motion'

const EXAMPLE_STRING = '7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1'

export function InputPanel({
  frameCount,
  referenceString,
  algorithm,
  onFrameCountChange,
  onReferenceStringChange,
  onAlgorithmChange,
  onRun,
  onLoadExample,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-solid p-3"
    >
      <p className="os-section-title">simulation.input</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: '90px 1fr 110px' }}>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--os-text-dim)] uppercase tracking-wider">Frames</span>
          <input
            type="number"
            min={1}
            max={16}
            value={frameCount}
            onChange={(e) => onFrameCountChange(Number(e.target.value))}
            className="os-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--os-text-dim)] uppercase tracking-wider">Reference String (comma-separated)</span>
          <input
            type="text"
            value={referenceString}
            onChange={(e) => onReferenceStringChange(e.target.value)}
            placeholder="e.g. 7,0,1,2,0,3..."
            className="os-input font-mono"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--os-text-dim)] uppercase tracking-wider">Algorithm</span>
          <select
            value={algorithm}
            onChange={(e) => onAlgorithmChange(e.target.value)}
            className="os-input"
          >
            <option value="fifo">FIFO</option>
            <option value="lru">LRU</option>
            <option value="optimal">Optimal</option>
          </select>
        </label>
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onRun} className="os-btn os-btn-primary">
          ▶ Run Simulation
        </button>
        <button
          type="button"
          onClick={() => onLoadExample(EXAMPLE_STRING)}
          className="os-btn"
        >
          Load Example
        </button>
      </div>
    </motion.section>
  )
}
