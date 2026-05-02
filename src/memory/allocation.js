/**
 * Fixed partitions: memory divided into equal-sized partitions.
 * Returns allocation + per-partition internal fragmentation.
 *
 * @param {number} totalMemory
 * @param {number} partitionSize
 * @param {{ id: string; size: number }[]} processes
 */
export function fixedPartitionAllocate(totalMemory, partitionSize, processes) {
  const numParts = Math.floor(totalMemory / partitionSize)
  /** @type {{ processId: string | null; processSize: number; internalFrag: number }[]} */
  const partitions = Array.from({ length: numParts }, () => ({
    processId: null,
    processSize: 0,
    internalFrag: 0,
  }))
  const queue = [...processes]
  const log = []

  let slot = 0
  while (slot < numParts && queue.length > 0) {
    const p = queue.shift()
    if (p.size <= partitionSize) {
      partitions[slot].processId = p.id
      partitions[slot].processSize = p.size
      partitions[slot].internalFrag = partitionSize - p.size
      log.push(`Partition ${slot}: ${p.id} (${p.size} / ${partitionSize})`)
      slot += 1
    } else {
      log.push(`Skipped ${p.id}: size ${p.size} > partition ${partitionSize}`)
    }
  }

  const usedPartitions = partitions.filter((x) => x.processId !== null).length
  const totalInternalFrag = partitions.reduce((s, x) => s + x.internalFrag, 0)

  return {
    partitionSize,
    numPartitions: numParts,
    partitions,
    totalInternalFrag,
    wastedSlots: numParts - usedPartitions,
    log,
  }
}

/**
 * Dynamic partitions — first fit with variable block list.
 * Blocks: { id, start, size, free }
 *
 * @param {number} totalMemory
 * @param {{ id: string; size: number }[]} requestsInOrder
 */
export function dynamicFirstFit(totalMemory, requestsInOrder) {
  /** @type {{ id: string; start: number; size: number; free: boolean }[]} */
  let blocks = [{ id: 'hole-0', start: 0, size: totalMemory, free: true }]
  const log = []

  const mergeAdjacent = () => {
    blocks.sort((a, b) => a.start - b.start)
    const out = []
    for (const b of blocks) {
      const last = out[out.length - 1]
      if (last && last.free && b.free && last.start + last.size === b.start) {
        last.size += b.size
      } else {
        out.push({ ...b })
      }
    }
    blocks = out
  }

  for (const req of requestsInOrder) {
    let placed = false
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      if (b.free && b.size >= req.size) {
        const remainder = b.size - req.size
        const alloc = {
          id: req.id,
          start: b.start,
          size: req.size,
          free: false,
        }
        if (remainder === 0) {
          blocks[i] = alloc
        } else {
          blocks[i] = alloc
          blocks.splice(i + 1, 0, {
            id: `hole-${b.start + req.size}`,
            start: b.start + req.size,
            size: remainder,
            free: true,
          })
        }
        log.push(`Allocated ${req.id} at ${alloc.start}–${alloc.start + alloc.size}`)
        placed = true
        mergeAdjacent()
        break
      }
    }
    if (!placed) log.push(`FAILED ${req.id}: no hole ≥ ${req.size}`)
  }

  const freeBlocks = blocks.filter((b) => b.free)
  const externalFrag = freeBlocks.reduce((s, b) => s + b.size, 0)
  const largestHole = freeBlocks.reduce((m, b) => Math.max(m, b.size), 0)

  return {
    blocks,
    externalFrag,
    largestHole,
    log,
  }
}
