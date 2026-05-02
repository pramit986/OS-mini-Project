import { useMemo, useState } from 'react'
import { decodeTwoLevelAddress } from '../paging/multilevel.js'

export function MultiLevelPaging() {
  const [virtualAddress, setVirtualAddress] = useState(0x00401f6a)
  const [offsetBits, setOffsetBits] = useState(12)
  const [ptBits, setPtBits] = useState(10)
  const [pdBits, setPdBits] = useState(10)

  const decoded = useMemo(
    () => decodeTwoLevelAddress(virtualAddress >>> 0, offsetBits, ptBits, pdBits),
    [virtualAddress, offsetBits, ptBits, pdBits],
  )

  const bin = (n, bits) => (n >>> 0).toString(2).padStart(bits, '0')

  const inputCls = 'os-input w-16'
  const wideInputCls = 'os-input w-36'

  const rows = [
    { label: 'Page Directory Index', value: decoded.pageDirectoryIndex, bits: pdBits, color: '#a78bfa' },
    { label: 'Page Table Index', value: decoded.pageTableIndex, bits: ptBits, color: '#58A6FF' },
    { label: 'Offset', value: decoded.offset, bits: offsetBits, color: '#3fb950' },
    { label: 'Logical Page #', value: decoded.pageNumber, bits: null, color: '#f0ad4e' },
  ]

  return (
    <section className="glass-card-solid p-4 flex flex-col gap-3">
      <p className="os-section-title">paging.two_level (x86-style)</p>
      <p className="text-[10px] text-[var(--os-text-dim)]">
        Split virtual address into page directory index, page table index, and byte offset.
        Total interpreted bits: <span className="text-[var(--os-accent)]">{decoded.totalVirtualBits}</span> (PD {pdBits} + PT {ptBits} + off {offsetBits})
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-2 text-[var(--os-text-dim)]">
          Virtual Address
          <input
            type="number"
            min={0}
            className={wideInputCls}
            value={virtualAddress}
            onChange={(e) => setVirtualAddress(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 text-[var(--os-text-dim)]">
          Offset bits
          <input type="number" min={4} max={16} className={inputCls} value={offsetBits} onChange={(e) => setOffsetBits(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2 text-[var(--os-text-dim)]">
          PT bits
          <input type="number" min={4} max={14} className={inputCls} value={ptBits} onChange={(e) => setPtBits(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2 text-[var(--os-text-dim)]">
          PD bits
          <input type="number" min={4} max={14} className={inputCls} value={pdBits} onChange={(e) => setPdBits(Number(e.target.value))} />
        </label>
      </div>

      {/* Decode table */}
      <div className="overflow-x-auto rounded border border-[var(--os-border)] bg-[var(--os-bg)] p-3 font-mono text-xs">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--os-border2)]">
              <th className="py-1.5 pr-4 font-normal text-[10px] uppercase tracking-wider text-[var(--os-text-dim)]">Field</th>
              <th className="py-1.5 pr-4 font-normal text-[10px] uppercase tracking-wider text-[var(--os-text-dim)]">Decimal</th>
              <th className="py-1.5 font-normal text-[10px] uppercase tracking-wider text-[var(--os-text-dim)]">Binary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-[var(--os-border)]/40">
                <td className="py-1.5 pr-4 text-[var(--os-text-dim)]">{r.label}</td>
                <td className="py-1.5 pr-4 font-semibold" style={{ color: r.color }}>{r.value}</td>
                <td className="py-1.5 text-[var(--os-dim)]">
                  {r.bits !== null ? bin(r.value, r.bits) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual bit breakdown */}
      <div className="flex gap-1 font-mono text-[9px] overflow-hidden rounded-md">
        <div
          className="flex-shrink-0 rounded-l-md px-2 py-1.5 text-center"
          style={{ background: '#7c3aed33', color: '#a78bfa', border: '1px solid #7c3aed66', flexBasis: `${(pdBits / (pdBits + ptBits + offsetBits)) * 100}%` }}
        >
          PD [{pdBits}b]
        </div>
        <div
          className="flex-shrink-0 px-2 py-1.5 text-center"
          style={{ background: '#1d4ed833', color: '#58A6FF', border: '1px solid #1d4ed866', flexBasis: `${(ptBits / (pdBits + ptBits + offsetBits)) * 100}%` }}
        >
          PT [{ptBits}b]
        </div>
        <div
          className="flex-1 rounded-r-md px-2 py-1.5 text-center"
          style={{ background: '#16653433', color: '#3fb950', border: '1px solid #16653466' }}
        >
          Offset [{offsetBits}b]
        </div>
      </div>
    </section>
  )
}
