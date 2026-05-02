import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { fixedPartitionAllocate, dynamicFirstFit } from '../memory/allocation.js'

export function MemoryAllocation() {
  const [totalMem, setTotalMem] = useState(1024)
  const [partSize, setPartSize] = useState(256)
  const [procInput, setProcInput] = useState('P1:200,P2:150,P3:300,P4:100')
  const [dynamicInput, setDynamicInput] = useState('A:120,B:400,C:200')

  const processes = useMemo(() => {
    return procInput.split(',').map((s) => {
      const [id, sz] = s.split(':').map((x) => x.trim())
      return { id: id || '?', size: Number(sz) || 0 }
    })
  }, [procInput])

  const fixed = useMemo(
    () => fixedPartitionAllocate(totalMem, partSize, processes),
    [totalMem, partSize, processes],
  )

  const dynamicRequests = useMemo(() => {
    return dynamicInput.split(',').map((s) => {
      const [id, sz] = s.split(':').map((x) => x.trim())
      return { id: id || '?', size: Number(sz) || 0 }
    })
  }, [dynamicInput])

  const dynamic = useMemo(
    () => dynamicFirstFit(totalMem, dynamicRequests),
    [totalMem, dynamicRequests],
  )

  const scale = (size) => `${Math.max((size / totalMem) * 100, 2)}%`

  const inputCls = 'os-input w-20'

  return (
    <div className="grid gap-4 lg:grid-cols-2 h-full">
      {/* Fixed Partition */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-solid p-4 flex flex-col gap-3"
      >
        <p className="os-section-title">allocation.fixed_partition</p>

        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-2 text-[var(--os-text-dim)]">
            Total (KB)
            <input
              type="number"
              min={64}
              className={inputCls}
              value={totalMem}
              onChange={(e) => setTotalMem(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-[var(--os-text-dim)]">
            Partition (KB)
            <input
              type="number"
              min={32}
              className={inputCls}
              value={partSize}
              onChange={(e) => setPartSize(Number(e.target.value))}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs text-[var(--os-text-dim)]">
          Processes (id:size, comma-separated)
          <input
            className="os-input font-mono"
            value={procInput}
            onChange={(e) => setProcInput(e.target.value)}
          />
        </label>

        {/* Memory bar */}
        <div>
          <p className="text-[10px] text-[var(--os-text-dim)] mb-1">
            Orange = used · dark = internal fragmentation
          </p>
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-[var(--os-border2)]">
            {fixed.partitions.map((p, i) => {
              const usedFrac = p.processId ? Math.min(p.processSize / partSize, 1) : 0
              return (
                <div
                  key={i}
                  title={`partition ${i}${p.processId ? `: ${p.processId}` : ': free'}`}
                  style={{ width: scale(partSize) }}
                  className="relative flex border-r border-[var(--os-bg)] last:border-r-0"
                >
                  <div className="h-full bg-[#d97706]" style={{ width: `${usedFrac * 100}%` }} />
                  <div className="h-full flex-1 bg-[#1a2535]" />
                </div>
              )
            })}
          </div>
        </div>

        <ul className="text-[11px] text-[var(--os-text-dim)] space-y-0.5">
          <li>Partitions: <span className="text-[var(--os-accent)]">{fixed.numPartitions} × {fixed.partitionSize} units</span></li>
          <li>Internal fragmentation: <span className="text-[var(--os-fault)]">{fixed.totalInternalFrag} units</span></li>
        </ul>
      </motion.section>

      {/* Dynamic First Fit */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card-solid p-4 flex flex-col gap-3"
      >
        <p className="os-section-title">allocation.dynamic_first_fit</p>

        <label className="flex flex-col gap-1 text-xs text-[var(--os-text-dim)]">
          Requests in order (id:size)
          <input
            className="os-input font-mono"
            value={dynamicInput}
            onChange={(e) => setDynamicInput(e.target.value)}
          />
        </label>

        {/* Memory bar */}
        <div>
          <p className="text-[10px] text-[var(--os-text-dim)] mb-1">
            Blue = allocated · hatched = free hole (external fragmentation: {dynamic.externalFrag} units)
          </p>
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-[var(--os-border2)]">
            {dynamic.blocks.map((b) => (
              <div
                key={b.id}
                title={`${b.id} @ ${b.start}..${b.start + b.size}${b.free ? ' (free)' : ''}`}
                style={{ width: scale(b.size) }}
                className={`relative border-r border-[var(--os-bg)] last:border-r-0 ${
                  b.free
                    ? 'bg-[repeating-linear-gradient(45deg,#1a2535,#1a2535_5px,#243044_5px,#243044_10px)]'
                    : 'bg-[#1d4ed8]'
                }`}
              />
            ))}
          </div>
        </div>

        <ul className="text-[11px] text-[var(--os-text-dim)] space-y-0.5">
          <li>Largest free hole: <span className="text-[var(--os-accent)]">{dynamic.largestHole} units</span></li>
          <li>Total blocks: <span className="text-[var(--os-accent)]">{dynamic.blocks.length}</span></li>
        </ul>
      </motion.section>
    </div>
  )
}
