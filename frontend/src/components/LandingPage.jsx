import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Database,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  LineChart,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  UploadCloud,
  Zap,
} from 'lucide-react'

export default function LandingPage({ onNavigateToUpload, onLoadDemoData }) {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-blue-50/60 via-white to-white px-6 py-14 shadow-sm dark:border-zinc-800 dark:from-zinc-900/60 dark:via-zinc-900 dark:to-zinc-900 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Autonomous Metric Anomaly Intelligence 2.0</span>
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl sm:leading-tight">
            Spot Business Anomalies Before They Impact Your Bottom Line
          </h1>

          <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Upload your sales, traffic, and conversion metrics. MetricWatch computes statistical
            baselines, diagnoses root causes with AI, and{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              pinpoints the exact anomalous rows and cells inside your raw file
            </span>
            .
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              <UploadCloud className="h-4 w-4" />
              Upload Metrics File
            </button>
            <button
              type="button"
              onClick={onLoadDemoData}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Try Sample Business Data
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Zero config needed
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              CSV &amp; Excel supported
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Instant in-file visualizer
            </span>
          </div>
        </div>

        {/* Interactive Live Preview Teaser Card */}
        <div className="mt-12 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                live_audit_preview: sample_business_data.csv
              </span>
            </div>
            <span className="rounded bg-red-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-700 dark:bg-red-950/80 dark:text-red-300">
              CRITICAL ANOMALY ON ROW 10
            </span>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3.5 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Revenue Collapse</span>
                <span className="font-semibold text-red-600 dark:text-red-400">−37.5%</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">₹65,000</span>
                <span className="text-xs text-zinc-400 line-through">₹104,000 baseline</span>
              </div>
              <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">
                Row 10 (2026-09-10) · Z-Score: −4.8σ
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3.5 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Conversion Rate</span>
                <span className="font-semibold text-red-600 dark:text-red-400">−47.5%</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">1.05%</span>
                <span className="text-xs text-zinc-400 line-through">2.00% baseline</span>
              </div>
              <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">
                Row 10 (2026-09-10) · Funnel friction alert
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Visitor Traffic</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+20.0%</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">6,200</span>
                <span className="text-xs text-zinc-400">5,100 baseline</span>
              </div>
              <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
                Traffic intact: suggests checkout gateway bug
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Engineered for Modern Data &amp; Operations Teams
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Everything you need to audit metric volatility, isolate regressions, and resolve incidents.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <LineChart className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Statistical Baseline Engine
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Automatically calculates rolling means, standard deviations, and dynamic tolerance
              bands without tedious manual threshold tuning.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              AI Root-Cause Diagnosis
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Correlates multiple indicators together (e.g. traffic vs conversion vs refund surges)
              to synthesize human-readable executive briefings with prescriptive remediation steps.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              In-File Anomaly Locator
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Don't guess where the error happened. Open an interactive spreadsheet pop-up with the
              exact offending rows and data cells highlighted in red with one click.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Three Steps to Total Metric Clarity
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              1
            </div>
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Upload Your File
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Drag and drop any business CSV or Excel file containing date timestamps and numeric
              columns like revenue, visits, or signups.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              2
            </div>
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Automated Baseline Analysis
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              The detection engine instantly maps deviations, filters noise, and computes Z-scores
              across all columns simultaneously.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              3
            </div>
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              AI Synthesis &amp; File Inspection
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Read the AI narrative report, verify key signals, and pop open the spreadsheet viewer
              to inspect highlighted anomaly cells.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get Started Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  )
}
