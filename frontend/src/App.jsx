import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  Eye,
  Moon,
  Sparkles,
  Sun,
  UploadCloud,
} from 'lucide-react'
import LandingPage from './components/LandingPage'
import UploadPage from './components/UploadPage'
import ResultsDashboard from './components/ResultsDashboard'
import FileAnomalyModal from './components/FileAnomalyModal'
import { history as mockHistory } from './data/mockData'
import {
  SAMPLE_CSV_RAW,
  analyzeData,
  parseCSV,
} from './utils/csvAnalyzer'
import './App.css'

const THEME_KEY = 'metricwatch-theme'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage unavailable
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [currentPage, setCurrentPage] = useState('landing') // 'landing' | 'upload' | 'results'
  const [file, setFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [fileMeta, setFileMeta] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('idle') // 'idle' | 'analyzing' | 'done'
  const [analysisProgress, setAnalysisProgress] = useState({ step: 0, percent: 0 })
  const [sensitivity, setSensitivity] = useState(2.0)
  const [analysisData, setAnalysisData] = useState(() => {
    // Pre-calculate sample business data so results are available immediately on load or demo
    try {
      const { headers, rows } = parseCSV(SAMPLE_CSV_RAW)
      return analyzeData(rows, headers, 2.0)
    } catch {
      return null
    }
  })
  const [fileName, setFileName] = useState('sample_business_data.csv')

  // Modal inspection state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalFocusedMetric, setModalFocusedMetric] = useState(null)

  const progressTimerRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    return () => clearInterval(progressTimerRef.current)
  }, [])

  // Action: Load Built-in Sample Business Data
  function handleLoadSampleData() {
    try {
      const { headers, rows } = parseCSV(SAMPLE_CSV_RAW)
      const analyzed = analyzeData(rows, headers, sensitivity)
      const blob = new Blob([SAMPLE_CSV_RAW], { type: 'text/csv' })
      const sampleFile = new File([blob], 'sample_business_data.csv', { type: 'text/csv' })

      setFile(sampleFile)
      setFileContent(SAMPLE_CSV_RAW)
      setFileName('sample_business_data.csv')
      setFileMeta({
        rows: rows.length,
        columns: headers.length,
        columnList: headers,
      })
      setAnalysisData(analyzed)
      setAnalysisStatus('done')
      setCurrentPage('results')
    } catch (err) {
      console.error('Failed to load sample data:', err)
    }
  }

  // Action: User Selects File
  function handleFileSelect(selectedFile) {
    setFile(selectedFile)
    setFileName(selectedFile.name)
    setAnalysisStatus('idle')

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setFileContent(text)
      try {
        const { headers, rows } = parseCSV(text)
        setFileMeta({
          rows: rows.length,
          columns: headers.length,
          columnList: headers,
        })
      } catch (err) {
        console.error('Error parsing file preview:', err)
      }
    }
    reader.readAsText(selectedFile)
  }

  // Action: User Clears File
  function handleFileClear() {
    setFile(null)
    setFileContent('')
    setFileMeta(null)
    setAnalysisStatus('idle')
  }

  // Action: Trigger Analysis with animated multi-step progress
  function handleRunAnalysis() {
    if (!fileContent && !file) {
      handleLoadSampleData()
      return
    }

    setAnalysisStatus('analyzing')
    setAnalysisProgress({ step: 0, percent: 15 })

    let currentStep = 0
    let currentPct = 15

    progressTimerRef.current = setInterval(() => {
      currentPct += 18
      if (currentPct > 35 && currentStep === 0) currentStep = 1
      if (currentPct > 65 && currentStep === 1) currentStep = 2
      if (currentPct > 85 && currentStep === 2) currentStep = 3

      if (currentPct >= 100) {
        clearInterval(progressTimerRef.current)
        setAnalysisProgress({ step: 3, percent: 100 })

        try {
          const rawToParse = fileContent || SAMPLE_CSV_RAW
          const { headers, rows } = parseCSV(rawToParse)
          const analyzed = analyzeData(rows, headers, sensitivity)
          setAnalysisData(analyzed)
          setAnalysisStatus('done')
          setTimeout(() => {
            setCurrentPage('results')
          }, 300)
        } catch (err) {
          console.error('Analysis error:', err)
          setAnalysisStatus('idle')
        }
      } else {
        setAnalysisProgress({ step: currentStep, percent: Math.min(96, currentPct) })
      }
    }, 280)
  }

  // Open File Modal focused on specific metric
  function handleInspectMetric(metricKey) {
    setModalFocusedMetric(metricKey)
    setIsModalOpen(true)
  }

  // Open File Modal generally
  function handleOpenInspectModal() {
    setModalFocusedMetric(null)
    setIsModalOpen(true)
  }

  const hasAnalysis = Boolean(analysisData)

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 transition-colors antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setCurrentPage('landing')}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  MetricWatch
                </span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Business Anomaly &amp; AI Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setCurrentPage('landing')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                currentPage === 'landing'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('upload')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                currentPage === 'upload'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload &amp; Analyze</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('results')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                currentPage === 'results'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Audit Results</span>
              {hasAnalysis && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            {hasAnalysis && (
              <button
                type="button"
                onClick={handleOpenInspectModal}
                className="hidden items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1.5 font-medium text-red-700 transition-all hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 sm:flex"
                title="Inspect in raw file pop-up"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>File Anomaly Pop-up</span>
              </button>
            )}
          </nav>

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content Body */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigateToUpload={() => setCurrentPage('upload')}
            onLoadDemoData={handleLoadSampleData}
          />
        )}

        {currentPage === 'upload' && (
          <UploadPage
            file={file}
            fileMeta={fileMeta}
            status={analysisStatus}
            analysisProgress={analysisProgress}
            onFileSelect={handleFileSelect}
            onFileClear={handleFileClear}
            onAnalyze={handleRunAnalysis}
            onLoadSampleData={handleLoadSampleData}
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
          />
        )}

        {currentPage === 'results' && (
          <ResultsDashboard
            analysisData={analysisData}
            fileName={fileName}
            onInspectFile={handleOpenInspectModal}
            onInspectMetric={handleInspectMetric}
            onNavigateToUpload={() => setCurrentPage('upload')}
            historyList={mockHistory}
          />
        )}
      </main>

      {/* Anomaly File Inspection Modal Pop-up */}
      <FileAnomalyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysisData={analysisData}
        fileName={fileName}
        initialFocusedMetric={modalFocusedMetric}
      />
    </div>
  )
}

