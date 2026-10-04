import { useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck2,
  FileSpreadsheet,
  HelpCircle,
  Loader2,
  Sliders,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { SAMPLE_CSV_RAW } from '../utils/csvAnalyzer'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ANALYSIS_STEPS = [
  'Parsing CSV schema and validating data records…',
  'Calculating rolling historical baselines & variance…',
  'Evaluating Z-scores and detecting outlier anomalies…',
  'Synthesizing AI root-cause executive diagnostic narrative…',
]

export default function UploadPage({
  file,
  fileMeta,
  status,
  analysisProgress,
  onFileSelect,
  onFileClear,
  onAnalyze,
  onLoadSampleData,
  sensitivity,
  setSensitivity,
}) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const isAnalyzing = status === 'analyzing'

  function handleFile(candidate) {
    if (!candidate) return
    if (!candidate.name.match(/\.(csv|xlsx|txt)$/i)) {
      setError('Please upload a valid .csv or .xlsx file.')
      return
    }
    setError('')
    onFileSelect(candidate)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Upload Metric Dataset
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Import your business telemetry, revenue figures, or e-commerce performance records.
        </p>
      </div>

      {/* Main Upload Box */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.txt"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        {file ? (
          <div className="space-y-6">
            {/* File info card */}
            <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{file.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{formatSize(file.size)}</span>
                    <span>•</span>
                    <span>{fileMeta ? `${fileMeta.rows} rows` : 'Loaded'}</span>
                    <span>•</span>
                    <span>{fileMeta ? `${fileMeta.columns} columns` : 'Ready'}</span>
                  </div>
                  {fileMeta?.columnList && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {fileMeta.columnList.slice(0, 6).map((col) => (
                        <span
                          key={col}
                          className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {col}
                        </span>
                      ))}
                      {fileMeta.columnList.length > 6 && (
                        <span className="text-[10px] text-zinc-400">
                          +{fileMeta.columnList.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={onFileClear}
                  disabled={isAnalyzing}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Analysis Configuration */}
            <div className="rounded-lg border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Detection Sensitivity</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Controls the statistical threshold (Z-score) used to flag anomalous metric movements.
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { id: 'relaxed', label: 'Relaxed (3.0σ)', desc: 'Only extreme outliers', val: 3.0 },
                  { id: 'standard', label: 'Balanced (2.0σ)', desc: 'Standard business audit', val: 2.0 },
                  { id: 'strict', label: 'Strict (1.5σ)', desc: 'Early warning signals', val: 1.5 },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSensitivity(tier.val)}
                    disabled={isAnalyzing}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      sensitivity === tier.val
                        ? 'border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-500/10'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {tier.label}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {tier.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Analysis Progress / Action */}
            {isAnalyzing ? (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="flex items-center justify-between text-xs font-medium text-blue-900 dark:text-blue-200">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    {ANALYSIS_STEPS[Math.min(analysisProgress.step, ANALYSIS_STEPS.length - 1)]}
                  </span>
                  <span>{analysisProgress.percent}%</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/60 dark:bg-blue-900/60">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                    style={{ width: `${analysisProgress.percent}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAnalyze}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                <Sparkles className="h-4 w-4" />
                Run Anomaly Detection &amp; AI Analysis
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false)
              }}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10'
                  : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50/70 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Drag and drop your file here, or{' '}
                <span className="text-blue-600 dark:text-blue-400">browse files</span>
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Supports CSV or XLSX up to 25MB with date &amp; metric columns.
              </p>
            </div>

            {/* Quick Sample Button */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    No dataset on hand?
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Use our verified <code className="font-mono text-zinc-700 dark:text-zinc-300">sample_business_data.csv</code> (contains revenue, conversion &amp; refund anomalies).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLoadSampleData}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                <span>Load Sample Data</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Recommended Format Guideline */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Recommended CSV Schema
        </h4>
        <div className="mt-3 overflow-x-auto">
          <pre className="rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-300 dark:bg-zinc-950">
            <code>{`date,revenue,orders,traffic,conversion_rate,refunds
2026-09-08,99000,99,5000,1.98,6
2026-09-09,106000,106,5300,2.00,5
2026-09-10,65000,65,6200,1.05,15   <-- Anomaly row highlighted automatically!`}</code>
          </pre>
        </div>
      </section>
    </div>
  )
}
