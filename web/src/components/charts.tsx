/** Lightweight dependency-free SVG charts (bar + donut). */

export const CHART_PALETTE = [
  '#2d8c8c',
  '#e0913a',
  '#7b6ef6',
  '#3f9d5a',
  '#d5588a',
  '#4a9ede',
  '#c94f4f',
  '#8a8f2f',
  '#5b8def',
  '#c07ad6',
]

export function paletteColor(i: number): string {
  return CHART_PALETTE[i % CHART_PALETTE.length]!
}

export type BarSeries = { name: string; value: number; color: string }
export type BarDatum = { label: string; series: BarSeries[] }

type BarProps = {
  data: BarDatum[]
  height?: number
  formatValue?: (n: number) => string
  emptyText?: string
}

/** Grouped vertical bar chart. Handles one or more series per label. */
export function SimpleBarChart({
  data,
  height = 180,
  formatValue = (n) => String(n),
  emptyText = 'Chưa có dữ liệu',
}: BarProps) {
  const max = Math.max(1, ...data.flatMap((d) => d.series.map((s) => s.value)))
  const hasData = data.some((d) => d.series.some((s) => s.value > 0))
  if (!hasData) return <p className="muted chart-empty">{emptyText}</p>

  const legend = new Map<string, string>()
  for (const d of data) for (const s of d.series) legend.set(s.name, s.color)

  return (
    <div className="svg-chart">
      <div className="bar-chart" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="bar-group">
            <div className="bar-cols">
              {d.series.map((s) => (
                <div
                  key={s.name}
                  className="bar-col"
                  style={{
                    height: `${(s.value / max) * 100}%`,
                    background: s.color,
                  }}
                  title={`${s.name}: ${formatValue(s.value)}`}
                >
                  <span className="bar-tip">{formatValue(s.value)}</span>
                </div>
              ))}
            </div>
            <span className="bar-label">{d.label}</span>
          </div>
        ))}
      </div>
      {legend.size > 1 ? (
        <div className="chart-legend">
          {[...legend.entries()].map(([name, color]) => (
            <span key={name} className="legend-item">
              <span className="legend-swatch" style={{ background: color }} />
              {name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export type PieSlice = { label: string; value: number; color: string }

type PieProps = {
  data: PieSlice[]
  size?: number
  formatValue?: (n: number) => string
  emptyText?: string
}

/** Donut chart with legend. */
export function PieChart({
  data,
  size = 168,
  formatValue = (n) => String(n),
  emptyText = 'Chưa có dữ liệu',
}: PieProps) {
  const total = data.reduce((a, s) => a + s.value, 0)
  if (total <= 0) return <p className="muted chart-empty">{emptyText}</p>

  const radius = size / 2
  const inner = radius * 0.58
  const cx = radius
  const cy = radius
  let angle = -Math.PI / 2
  const arcs = data.map((s) => {
    const frac = s.value / total
    const start = angle
    const end = angle + frac * Math.PI * 2
    angle = end
    const large = end - start > Math.PI ? 1 : 0
    const x1 = cx + radius * Math.cos(start)
    const y1 = cy + radius * Math.sin(start)
    const x2 = cx + radius * Math.cos(end)
    const y2 = cy + radius * Math.sin(end)
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`
    return { path, color: s.color }
  })

  return (
    <div className="svg-chart pie-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} />
        ))}
        <circle cx={cx} cy={cy} r={inner} fill="var(--card)" />
      </svg>
      <div className="chart-legend chart-legend--pie">
        {data.map((s) => (
          <span key={s.label} className="legend-item">
            <span className="legend-swatch" style={{ background: s.color }} />
            <span className="legend-name">{s.label}</span>
            <span className="legend-value">{formatValue(s.value)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
