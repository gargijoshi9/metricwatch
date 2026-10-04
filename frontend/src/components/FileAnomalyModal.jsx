import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Info,
  Maximize2,
  X,
} from 'lucide-react'

/**
 * FileAnomalyModal:
 * Displays a spreadsheet-style inspection popup of the uploaded file.
 * Clearly highlights the rows and cells where anomalies are detected with interactive inspection details.
 */
export default function FileAnomalyModal({
  isOpen,
  onClose,
  analysisData,
  fileName = 'sample_business_data.csv',
  initialFocusedMetric = null,
}) {
  const [filterMode, setFilterMode] = useState('flagged') // 'flagged' | 'all'
  const [selectedCol, setSelectedCol] = useState(initialFocusedMetric || 'all')
  const [selectedCell, setSelectedCell] = useState(null) // { rowIdx, col, issue }

  useEffect(() => {
    if (initialFocusedMetric) {
      setSelectedCol(initialFocusedMetric)
    }
  }, [initialFocusedMetric])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !analysisData) return null

  const { headers, rows, dateCol, cellAnomalies, flaggedRows, meta } = analysisData

  // Filter rows based on toggle
  const visibleRows = useMemo(() => {
    if (filterMode === 'all') return rows
    const flaggedIndices = new Set(flaggedRows.map((r) => r.rowIndex))
    return rows.filter((_, idx) => flaggedIndices.has(idx))
  }, [filterMode, rows, flaggedRows])

  // Export current annotated CSV
  function handleExport() {
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => r[h]).join(',')),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `annotated_${fileName}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="modal-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  File Anomaly Inspector
                </h3>
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
                  {flaggedRows.length} Anomaly {flaggedRows.length === 1 ? 'Row' : 'Rows'} Found
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Viewing <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{fileName}</span> · Highlighted cells represent deviations surpassing statistical threshold.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              title="Download CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/70 px-5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Filter View:</span>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => setFilterMode('flagged')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  filterMode === 'flagged'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                Only Anomalous Rows ({flaggedRows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                }`}
              >
                All Rows ({rows.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Column Focus:</span>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">All Columns</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Cell Deep Dive Notification Bar */}
        {selectedCell ? (
          <div className="flex items-start justify-between gap-3 border-b border-amber-200 bg-amber-50/80 px-5 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">
                  Row {selectedCell.rowIdx + 1} ({selectedCell.date}) · Metric: <span className="font-mono">{selectedCell.col}</span>
                </p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                  {selectedCell.issue.explanation}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                  <span>Observed: <strong className="text-zinc-900 dark:text-white">{selectedCell.issue.formattedValue}</strong></span>
                  <span>Baseline: <strong>{selectedCell.issue.formattedBaseline}</strong></span>
                  <span>Shift: <strong className={selectedCell.issue.change < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>{selectedCell.issue.change > 0 ? '+' : ''}{selectedCell.issue.change.toFixed(1)}%</strong></span>
                  <span>Deviation: <strong>{selectedCell.issue.zScore}σ ({selectedCell.issue.severity.toUpperCase()})</strong></span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-blue-50/50 px-5 py-2 text-xs text-blue-700 dark:border-zinc-800 dark:bg-blue-950/20 dark:text-blue-300">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Click any highlighted red/amber cell to view the exact deviation formula, baseline values, and root cause notes.</span>
          </div>
        )}

        {/* Spreadsheet Data Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full border-collapse font-mono text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
                <tr className="border-b border-zinc-200 text-left text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  <th className="w-14 px-3 py-2.5 text-center font-semibold text-zinc-400 dark:text-zinc-500">
                    #
                  </th>
                  {headers.map((h) => {
                    const isFocus = selectedCol === h
                    return (
                      <th
                        key={h}
                        className={`px-3.5 py-2.5 font-semibold transition-colors ${
                          isFocus
                            ? 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            : ''
                        }`}
                      >
                        {h}
                      </th>
                    )
                  })}
                  <th className="px-3.5 py-2.5 font-semibold text-zinc-500">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {visibleRows.map((row) => {
                  const actualRowIndex = row._rowIndex - 1
                  const isFlagged = flaggedRows.some((r) => r.rowIndex === actualRowIndex)
                  const rowMeta = flaggedRows.find((r) => r.rowIndex === actualRowIndex)

                  return (
                    <tr
                      key={actualRowIndex}
                      className={`transition-colors ${
                        isFlagged
                          ? 'bg-red-50/70 hover:bg-red-100/70 dark:bg-red-950/25 dark:hover:bg-red-950/40'
                          : 'bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* Row Index */}
                      <td className="px-3 py-2 text-center text-zinc-400 dark:text-zinc-500">
                        {actualRowIndex + 1}
                      </td>

                      {/* Columns */}
                      {headers.map((h) => {
                        const cellKey = `${actualRowIndex}_${h}`
                        const issue = cellAnomalies[cellKey]
                        const isCellSelected =
                          selectedCell?.rowIdx === actualRowIndex && selectedCell?.col === h

                        if (issue) {
                          const isHigh = issue.severity === 'high'
                          return (
                            <td
                              key={h}
                              onClick={() =>
                                setSelectedCell({
                                  rowIdx: actualRowIndex,
                                  col: h,
                                  date: row[dateCol],
                                  issue,
                                })
                              }
                              className={`cursor-pointer px-3.5 py-2 font-medium transition-all ${
                                isCellSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                              } ${
                                isHigh
                                  ? 'bg-red-200/80 text-red-900 hover:bg-red-300 dark:bg-red-900/60 dark:text-red-100 dark:hover:bg-red-900/80'
                                  : 'bg-amber-200/80 text-amber-900 hover:bg-amber-300 dark:bg-amber-900/50 dark:text-amber-100 dark:hover:bg-amber-900/70'
                              }`}
                              title={`Anomaly in ${h}: Click for details`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span>{row[h]}</span>
                                <span
                                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isHigh
                                      ? 'bg-red-600 text-white dark:bg-red-500'
                                      : 'bg-amber-600 text-white dark:bg-amber-500'
                                  }`}
                                >
                                  {issue.change < 0 ? '▼' : '▲'} {issue.severity}
                                </span>
                              </div>
                            </td>
                          )
                        }

                        return (
                          <td
                            key={h}
                            className={`px-3.5 py-2 text-zinc-800 dark:text-zinc-200 ${
                              selectedCol === h
                                ? 'bg-blue-50/30 dark:bg-blue-950/10 font-medium'
                                : ''
                            }`}
                          >
                            {row[h]}
                          </td>
                        )
                      })}

                      {/* Audit Status Badge */}
                      <td className="px-3.5 py-2">
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/60 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {rowMeta?.issues.length} {rowMeta?.issues.length === 1 ? 'alert' : 'alerts'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <div>
            Showing <strong className="text-zinc-900 dark:text-zinc-100">{visibleRows.length}</strong> of{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">{rows.length}</strong> total rows in file.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  )
}
