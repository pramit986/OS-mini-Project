import { runFifo } from './fifo.js'
import { runLru } from './lru.js'
import { runOptimal } from './optimal.js'

export { runFifo, runLru, runOptimal }

/** @typedef {import('./types.js').SimulationStep} SimulationStep */

/**
 * @param {'fifo'|'lru'|'optimal'} algorithm
 * @param {number[]} referenceString
 * @param {number} frameCount
 * @returns {SimulationStep[]}
 */
export function runSimulation(algorithm, referenceString, frameCount) {
  switch (algorithm) {
    case 'fifo':
      return runFifo(referenceString, frameCount)
    case 'lru':
      return runLru(referenceString, frameCount)
    case 'optimal':
      return runOptimal(referenceString, frameCount)
    default:
      return runFifo(referenceString, frameCount)
  }
}

/**
 * Fault counts for bar chart (FIFO vs LRU vs Optimal).
 * @param {number[]} referenceString
 * @param {number} frameCount
 */
export function compareAlgorithmsFaults(referenceString, frameCount) {
  const fifo = runFifo(referenceString, frameCount)
  const lru = runLru(referenceString, frameCount)
  const optimal = runOptimal(referenceString, frameCount)
  return {
    fifo: fifo.filter((s) => s.fault).length,
    lru: lru.filter((s) => s.fault).length,
    optimal: optimal.filter((s) => s.fault).length,
  }
}
