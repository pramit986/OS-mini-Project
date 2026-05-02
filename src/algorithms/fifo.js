/**
 * FIFO page replacement: queue order of pages loaded into frames.
 * On fault with full memory, evict the oldest loaded page.
 *
 * @param {number[]} referenceString
 * @param {number} frameCount
 * @returns {import('./types.js').SimulationStep[]}
 */
export function runFifo(referenceString, frameCount) {
  const refs = referenceString
  const steps = []
  let frames = Array.from({ length: frameCount }, () => null)
  /** @type {number[]} order pages entered memory (FIFO queue) */
  const fifoQueue = []

  for (let i = 0; i < refs.length; i++) {
    const page = refs[i]
    const hit = frames.includes(page)
    let victimFrameIndex = null
    let victimPage = null
    const nextFrames = [...frames]

    if (!hit) {
      const emptyIdx = nextFrames.indexOf(null)
      if (emptyIdx !== -1) {
        nextFrames[emptyIdx] = page
        fifoQueue.push(page)
      } else {
        victimPage = fifoQueue.shift()
        victimFrameIndex = nextFrames.indexOf(victimPage)
        nextFrames[victimFrameIndex] = page
        fifoQueue.push(page)
      }
    }

    steps.push({
      stepIndex: i,
      reference: page,
      frames: nextFrames,
      hit,
      fault: !hit,
      victimFrameIndex,
      victimPage,
    })
    frames = nextFrames
  }

  return steps
}
