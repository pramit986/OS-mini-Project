import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const COLORS = {
  FIFO: '#58A6FF',
  LRU: '#3fb950',
  Optimal: '#a78bfa',
}

export function ChartView({ fifoFaults, lruFaults, optimalFaults }) {
  const data = [
    { name: 'FIFO', faults: fifoFaults },
    { name: 'LRU', faults: lruFaults },
    { name: 'Optimal', faults: optimalFaults },
  ]

  return (
    <section className="glass-card-solid p-3 flex flex-col gap-2 h-full">
      <p className="os-section-title">chart.compare (faults)</p>
      <p className="text-[10px] text-[var(--os-text-dim)]">
        Lower = better. Optimal is theoretical minimum.
      </p>
      <div className="flex-1 min-h-0" style={{ minHeight: '140px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="transparent"
              tick={{ fill: '#768390', fontSize: 10 }}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="transparent"
              tick={{ fill: '#768390', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#0d1117',
                border: '1px solid #1e2a3a',
                borderRadius: 8,
                fontFamily: 'inherit',
                fontSize: 11,
              }}
              labelStyle={{ color: '#cdd9e5' }}
              formatter={(value, name) => [value, 'page faults']}
            />
            <Bar dataKey="faults" radius={[5, 5, 0, 0]} maxBarSize={44}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
