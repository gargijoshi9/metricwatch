import { AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react'

function MiniSparkline({ data = [], isAnomaly = false }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 100
  const height = 28

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const strokeColor = isAnomaly ? '#ef4444' : '#3b82f6'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-24 overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* End point dot */}
      {data.length > 0 && (
        <circle
          cx={(width).toFixed(1)}
          cy={(height - ((data[data.length - 1] - min) / range) * (height - 6) - 3).toFixed(1)}
          r="3"
          fill={strokeColor}
        />
      )}
    </svg>
  )
}

export default function MetricKPIs({ results = [], onInspectMetric }) {
  // Take top 4 most critical or important metrics
  const displayMetrics = results.slice(0, 4)

  if (displayMetrics.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {displayMetrics.map((item) => {
        const isHigh = item.severity === 'high'
        const isMed = item.severity === 'medium'
        const isDown = item.change < 0
        const Icon = isDown ? ArrowDownRight : ArrowUpRight

        return (
          <div
            key={item.metric}
            className={`relative flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
              isHigh
                ? 'border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20'
                : isMed
                ? 'border-amber-200 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/15'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  {item.metric}
                </span>
                {isHigh ? (
                  <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Critical
                  </span>
                ) : isMed ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Warning
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Normal
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                  {item.value}
                </div>
                <div
                  className={`flex items-center font-mono text-xs font-semibold ${
                    isDown
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {isDown ? '−' : '+'}
                  {Math.abs(item.change)}%
                </div>
              </div>

              {item.baseline && (
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  Baseline: <span className="font-mono text-zinc-600 dark:text-zinc-400">{item.baseline}</span>
                </p>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <MiniSparkline data={item.sparkline} isAnomaly={isHigh || isMed} />
              {onInspectMetric && (
                <button
                  type="button"
                  onClick={() => onInspectMetric(item.key || item.metric)}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                >
                  Locate in File →
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
