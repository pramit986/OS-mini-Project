/**
 * Optimal (Belady): replace the page whose next use is farthest in the future.
 *
 * @param {number[]} referenceString
 * @param {number} frameCount
 * @returns {import('./types.js').SimulationStep[]}
 */
export function runOptimal(referenceString, frameCount) {
  const refs = referenceString
  const steps = []
  let frames = Array.from({ length: frameCount }, () => null)

  const nextUseAfter = (fromExclusive, page) => {
    for (let j = fromExclusive + 1; j < refs.length; j++) {
      if (refs[j] === page) return j
    }
    return Infinity
  }

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
      } else {
        let bestIdx = 0
        let bestDist = -1
        for (let f = 0; f < frameCount; f++) {
          const p = nextFrames[f]
          const dist = nextUseAfter(i, p)
          if (dist > bestDist) {
            bestDist = dist
            bestIdx = f
          }
        }
        victimFrameIndex = bestIdx
        victimPage = nextFrames[bestIdx]
        nextFrames[victimFrameIndex] = page
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
