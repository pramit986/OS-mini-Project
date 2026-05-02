/**
 * Decode virtual address for 2-level paging.
 * physicalBits optional for display only.
 *
 * @param {number} virtualAddress  non-negative integer
 * @param {number} offsetBits
 * @param {number} ptIndexBits  bits for inner page table index
 * @param {number} pdIndexBits  bits for page directory index
 */
export function decodeTwoLevelAddress(virtualAddress, offsetBits, ptIndexBits, pdIndexBits) {
  const mask = (bits) => (1 << bits) - 1
  const offset = virtualAddress & mask(offsetBits)
  const ptIndex = (virtualAddress >> offsetBits) & mask(ptIndexBits)
  const pdIndex = (virtualAddress >> (offsetBits + ptIndexBits)) & mask(pdIndexBits)
  const pageNumber = virtualAddress >> offsetBits

  return {
    virtualAddress,
    pageDirectoryIndex: pdIndex,
    pageTableIndex: ptIndex,
    offset,
    pageNumber,
    totalVirtualBits: offsetBits + ptIndexBits + pdIndexBits,
  }
}
