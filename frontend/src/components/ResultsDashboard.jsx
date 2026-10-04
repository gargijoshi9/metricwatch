import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react'
import AIResponseCard from './AIResponseCard'
import MetricKPIs from './MetricKPIs'
import ResultsTable from './ResultsTable'

export default function ResultsDashboard({
  analysisData,
  fileName,
  onInspectFile,
  onInspectMetric,
  onNavigateToUpload,
  historyList = [],
}) {
  const [activeTab, setActiveTab] = useState('current') // 'current' | 'history'
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(historyList[0]?.id)

  if (!analysisData) return null

  const { results, summary, meta, flaggedRows } = analysisData
  const criticalCount = results.filter((r) => r.severity === 'high').length
  const warningCount = results.filter((r) => r.severity === 'medium').length

  const currentSnapshot = historyList.find((h) => h.id === selectedSnapshotId) || historyList[0]
  const displayedResults = activeTab === 'current' ? results : currentSnapshot?.results || results

  return (
    <div className="space-y-6">
      {/* Top Banner / Dataset Breadcrumb */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{fileName}</h2>
              {criticalCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/80 dark:text-red-300">
                  <AlertCircle className="h-3 w-3" />
                  {criticalCount} Critical {criticalCount === 1 ? 'Anomaly' : 'Anomalies'}
                </span>
              ) : warningCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  {warningCount} Warnings
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <CheckCircle className="h-3 w-3" />
                  All Metrics Stable
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Audit Date: <span className="font-medium text-zinc-700 dark:text-zinc-300">{summary.generatedAt}</span> · {meta?.totalRows || 0} rows analyzed · {meta?.metricsCount || results.length} business metrics tracked
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Upload New File
          </button>

          <button
            type="button"
            onClick={onInspectFile}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            <Eye className="h-3.5 w-3.5" />
            Inspect File Anomaly ({flaggedRows?.length || 0} flagged)
          </button>
        </div>
      </div>

      {/* AI Root-Cause Diagnostic Card */}
      <AIResponseCard summary={summary} onInspectFile={onInspectFile} />

      {/* KPI Cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Metric Telemetry Overview
          </h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Showing latest deviation vs baseline
          </span>
        </div>
        <MetricKPIs results={results} onInspectMetric={onInspectMetric} />
      </div>

      {/* Tabbed Results Section: Current Analysis vs Historical Runs */}
      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Results view"
            className="inline-flex self-start rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'current'}
              onClick={() => setActiveTab('current')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'current'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Current Audit Results ({results.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Past Snapshots ({historyList.length})
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {activeTab === 'current' ? fileName : currentSnapshot?.file || 'Historical run'}
            </span>
          </div>
        </div>

        {/* History snapshots picker */}
        {activeTab === 'history' && historyList.length > 0 && (
          <div className="grid gap-2 border-b border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 sm:grid-cols-3">
            {historyList.map((snap) => {
              const snapAnomalies = snap.results.filter((r) => r.severity !== 'low').length
              return (
                <button
                  key={snap.id}
                  type="button"
                  onClick={() => setSelectedSnapshotId(snap.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedSnapshotId === snap.id
                      ? 'border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-500/10'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {snap.date}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">{snap.file}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {snapAnomalies > 0 ? (
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {snapAnomalies} anomalies detected
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">All metrics stable</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Detailed Results Table */}
        <ResultsTable
          results={displayedResults}
          onInspectMetric={onInspectMetric}
        />
      </section>
    </div>
  )
}
