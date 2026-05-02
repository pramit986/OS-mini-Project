/**
 * Page table derived from current frame contents (valid entries only).
 */
export function PageTable({ frames }) {
  const rows = []
  frames.forEach((page, frameIdx) => {
    if (page !== null) {
      rows.push({ logicalPage: page, frame: frameIdx, valid: true })
    }
  })
  rows.sort((a, b) => a.logicalPage - b.logicalPage)

  return (
    <section className="glass-card-solid p-3 flex flex-col gap-2 h-full">
      <p className="os-section-title">page.table (logical → physical)</p>
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--os-border2)]">
              <th className="py-1.5 pr-4 font-normal text-[var(--os-text-dim)] text-[10px] uppercase tracking-wider">Logical</th>
              <th className="py-1.5 pr-4 font-normal text-[var(--os-text-dim)] text-[10px] uppercase tracking-wider">Frame</th>
              <th className="py-1.5 font-normal text-[var(--os-text-dim)] text-[10px] uppercase tracking-wider">Valid</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-3 text-[var(--os-dim)] text-[11px]">
                  No resident pages — memory empty.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={`${r.logicalPage}-${r.frame}`}
                  className="border-b border-[var(--os-border)]/50 transition hover:bg-[var(--os-bg)]"
                >
                  <td className="py-1.5 font-mono text-[var(--os-text)]">{r.logicalPage}</td>
                  <td className="py-1.5 font-mono text-[var(--os-accent)]">{r.frame}</td>
                  <td className="py-1.5">
                    <span className="badge-hit">1</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
