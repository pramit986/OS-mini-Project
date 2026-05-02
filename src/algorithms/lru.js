/**
 * LRU: evict the page that has not been used for the longest time.
 * Uses a stack (front = LRU, back = MRU).
 *
 * @param {number[]} referenceString
 * @param {number} frameCount
 * @returns {import('./types.js').SimulationStep[]}
 */
export function runLru(referenceString, frameCount) {
  const refs = referenceString
  const steps = []
  let frames = Array.from({ length: frameCount }, () => null)
  /** LRU → MRU */
  let lruStack = []

  const touch = (page) => {
    const idx = lruStack.indexOf(page)
    if (idx !== -1) lruStack.splice(idx, 1)
    lruStack.push(page)
  }

  for (let i = 0; i < refs.length; i++) {
    const page = refs[i]
    const hit = frames.includes(page)
    let victimFrameIndex = null
    let victimPage = null
    const nextFrames = [...frames]

    if (hit) {
      touch(page)
    } else {
      const emptyIdx = nextFrames.indexOf(null)
      if (emptyIdx !== -1) {
        nextFrames[emptyIdx] = page
        touch(page)
      } else {
        victimPage = lruStack.shift()
        victimFrameIndex = nextFrames.indexOf(victimPage)
        nextFrames[victimFrameIndex] = page
        touch(page)
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
