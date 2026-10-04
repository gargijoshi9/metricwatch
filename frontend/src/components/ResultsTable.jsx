import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Search,
} from 'lucide-react'
import SeverityBadge from './SeverityBadge'

function Change({ value }) {
  const up = value > 0
  const down = value < 0
  const color = down
    ? 'text-red-600 dark:text-red-400'
    : up
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-zinc-500 dark:text-zinc-400'
  const Icon = down ? ArrowDownRight : ArrowUpRight
  const sign = up ? '+' : down ? '−' : ''

  return (
    <span className={`inline-flex items-center justify-end gap-1 tabular-nums font-mono font-medium ${color}`}>
      {(up || down) && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {sign}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

const TH = 'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'

export default function ResultsTable({
  results = [],
  emptyMessage = 'No metrics match the current filter.',
  onInspectMetric = null,
}) {
  const [filterSeverity, setFilterSeverity] = useState('all') // 'all' | 'high' | 'medium' | 'low'
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchSeverity = filterSeverity === 'all' || r.severity === filterSeverity
      const matchSearch =
        searchQuery === '' ||
        r.metric.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.explanation?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchSeverity && matchSearch
    })
  }, [results, filterSeverity, searchQuery])

  const counts = useMemo(() => {
    return {
      all: results.length,
      high: results.filter((r) => r.severity === 'high').length,
      medium: results.filter((r) => r.severity === 'medium').length,
      low: results.filter((r) => r.severity === 'low').length,
    }
  }, [results])

  return (
    <div>
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterSeverity('all')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filterSeverity === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            All Metrics ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('high')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filterSeverity === 'high'
                ? 'bg-red-600 text-white'
                : 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
            }`}
          >
            <span>Critical High</span>
            <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] font-bold">
              {counts.high}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('medium')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filterSeverity === 'medium'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40'
            }`}
          >
            <span>Medium</span>
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold">
              {counts.medium}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('low')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filterSeverity === 'low'
                ? 'bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Normal ({counts.low})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search metric name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* Table */}
      {filteredResults.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th scope="col" className={TH}>
                  Metric Name
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Current Value
                </th>
                <th scope="col" className={`${TH} hidden text-right sm:table-cell`}>
                  Baseline
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Change
                </th>
                <th scope="col" className={TH}>
                  Severity
                </th>
                <th scope="col" className={`${TH} hidden lg:table-cell`}>
                  Root Cause Explanation
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {filteredResults.map((row) => {
                const isHigh = row.severity === 'high'
                const isMed = row.severity === 'medium'

                return (
                  <tr
                    key={row.metric}
                    className={`transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
                      isHigh
                        ? 'bg-red-50/30 dark:bg-red-950/10'
                        : isMed
                        ? 'bg-amber-50/20 dark:bg-amber-950/10'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {row.metric}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 lg:hidden">
                        {row.explanation}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right align-top font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {row.value}
                    </td>

                    <td className="hidden px-4 py-3.5 text-right align-top font-mono text-xs text-zinc-500 dark:text-zinc-400 sm:table-cell">
                      {row.baseline || '—'}
                    </td>

                    <td className="px-4 py-3.5 text-right align-top">
                      <Change value={row.change} />
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <SeverityBadge severity={row.severity} />
                    </td>

                    <td className="hidden px-4 py-3.5 align-top text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 lg:table-cell">
                      {row.explanation}
                    </td>

                    <td className="px-4 py-3.5 text-right align-top">
                      {onInspectMetric && (
                        <button
                          type="button"
                          onClick={() => onInspectMetric(row.key || row.metric)}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                          title={`Inspect ${row.metric} in raw file`}
                        >
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">Inspect</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

