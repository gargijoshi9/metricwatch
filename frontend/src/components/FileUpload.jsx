import { useRef, useState } from 'react'
import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react'

const ACCEPTED = /\.(csv|xlsx)$/i

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Dropzone + selected-file state.
 * meta:         { rows, columns } — mock metadata until the backend parses files
 * status:       'idle' | 'analyzing' | 'done'
 * onFileChange: (file | null) => void   called on select, replace and remove
 * onAnalyze:    (file) => void
 */
export default function FileUpload({ meta, status, onFileChange, onAnalyze }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const analyzing = status === 'analyzing'

  function select(candidate) {
    if (!candidate) return
    if (!ACCEPTED.test(candidate.name)) {
      setError('Unsupported file type. Please upload a .csv or .xlsx file.')
      return
    }
    setError('')
    setFile(candidate)
    onFileChange(candidate)
  }

  function remove() {
    setFile(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    onFileChange(null)
  }

  function openPicker() {
    inputRef.current?.click()
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    select(e.dataTransfer.files?.[0])
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          select(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {file ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {file.name}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {meta.rows.toLocaleString('en-IN')} rows · {meta.columns} columns ·{' '}
                {formatSize(file.size)}
              </p>
              <div className="mt-1.5 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={analyzing}
                  className="text-zinc-600 underline-offset-2 hover:underline disabled:opacity-50 dark:text-zinc-400"
                >
                  Change file
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={analyzing}
                  className="text-zinc-600 underline-offset-2 hover:underline disabled:opacity-50 dark:text-zinc-400"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAnalyze(file)}
            disabled={analyzing}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-400"
          >
            {analyzing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {analyzing ? 'Analyzing…' : status === 'done' ? 'Analyze Again' : 'Analyze Data'}
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Upload your business data
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            MetricWatch compares each metric with its recent baseline and flags unusual movement.
          </p>

          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPicker()
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
            className={`mt-4 flex cursor-pointer flex-col items-center rounded-md border border-dashed px-4 py-10 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400 ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10'
                : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/40'
            }`}
          >
            <UploadCloud
              className="h-6 w-6 text-zinc-400 dark:text-zinc-500"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Drag &amp; drop your CSV or Excel file here
              <br />
              or{' '}
              <span className="font-medium text-blue-600 dark:text-blue-400">browse files</span>
            </p>
            <span className="mt-3 rounded border border-zinc-200 px-2 py-0.5 text-[11px] font-medium tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              CSV, XLSX
            </span>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  )
}
