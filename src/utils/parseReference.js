/**
 * Parse comma/semicolon/whitespace separated reference string into positive integers.
 * @param {string} raw
 * @returns {number[]}
 */
export function parseReferenceString(raw) {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n >= 0)
}
