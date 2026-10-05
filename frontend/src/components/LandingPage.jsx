import {
  Activity,
  ArrowRight,
  Brain,
  FileSpreadsheet,
  LineChart,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Zap,
} from 'lucide-react'

export default function LandingPage({ onNavigateToUpload, onLoadDemoData }) {
  return (
    <div className="space-y-20 pb-16 pt-2">
      {/* ==================================================== */}
      {/* HERO SECTION                                         */}
      {/* ==================================================== */}
      <section className="relative text-center">
        {/* Ambient radial blur behind hero (dark-mode tailored electric blue) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px] dark:bg-blue-500/20"
        />

        <div className="mx-auto max-w-4xl px-2">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/80 px-3.5 py-1 text-xs font-medium text-blue-700 shadow-sm backdrop-blur-sm dark:border-blue-500/25 dark:bg-[#111318]/90 dark:text-blue-400">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Autonomous Metric Anomaly Intelligence
            </span>
          </div>

          {/* Large Headline */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl sm:leading-[1.12] dark:text-white">
            Spot{' '}
            <span className="text-blue-600 dark:text-blue-400">
              Business Anomalies
            </span>
            <br />
            Before They Impact Your Bottom Line
          </h1>

          {/* Supporting Text */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            Upload your business data and let MetricWatch detect unusual metric behavior,
            identify relationships between signals, and turn raw anomalies into actionable business insights.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            {/* Primary Button */}
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-600/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
            >
              <UploadCloud className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              <span>Upload Metrics File</span>
            </button>

            {/* Secondary Button */}
            <button
              type="button"
              onClick={onLoadDemoData}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-medium text-zinc-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-50 dark:border-[#252A33] dark:bg-[#111318] dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-[#15171C] dark:hover:text-white sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <span>Try Sample Business Data</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
              CSV &amp; Excel supported
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
              Automated anomaly detection
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
              AI-powered insights
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* PRODUCT PREVIEW                                      */}
        {/* ==================================================== */}
        <div className="relative mx-auto mt-12 max-w-5xl">
          {/* Subtle glow behind preview card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-b from-blue-500/15 via-sky-500/10 to-transparent blur-xl opacity-70 dark:opacity-40"
          />

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-2xl dark:border-[#252A33] dark:bg-[#111318]">
            {/* Window Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/90 bg-zinc-50/90 px-4 py-2.5 dark:border-[#252A33] dark:bg-[#15171C]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  MetricWatch Analysis Preview
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AUDIT ENGINE ACTIVE
                </span>
                <span className="hidden font-mono text-[10px] text-zinc-400 sm:inline">
                  sample_business_data.csv
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {/* Metrics Header Grid (4 KPI Cards) */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Revenue */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-[#252A33] dark:bg-[#15171C]">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Revenue</span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +8.4%
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    ₹3.82M
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    vs. 30d rolling baseline
                  </div>
                </div>

                {/* Orders */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-[#252A33] dark:bg-[#15171C]">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Orders</span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +4.2%
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    7,421
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    7,120 expected mean
                  </div>
                </div>

                {/* Traffic */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-[#252A33] dark:bg-[#15171C]">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Traffic</span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +12.1%
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    218K
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Stable incoming sessions
                  </div>
                </div>

                {/* Refunds */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-[#252A33] dark:bg-[#15171C]">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Refunds</span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <TrendingDown className="h-3 w-3" />
                      -2.3%
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    6,421
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Within standard band
                  </div>
                </div>
              </div>

              {/* Main Content: Chart (Left) + Signals (Right) */}
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {/* Revenue Trend Visualizer (2 Columns) */}
                <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-[#252A33] dark:bg-[#15171C]/80 lg:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Revenue Trend
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Rolling 3σ statistical baseline corridor vs. recorded telemetry
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-3 rounded-full bg-blue-500" />
                        Recorded Line
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-3 border-b-2 border-dashed border-sky-400" />
                        Expected Baseline
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Anomaly Outlier
                      </span>
                    </div>
                  </div>

                  {/* High Fidelity SVG Sparkline / Baseline Chart */}
                  <div className="relative mt-4 h-48 w-full overflow-hidden rounded-lg bg-white/70 p-2 dark:bg-[#111318]/90">
                    <svg
                      viewBox="0 0 540 160"
                      className="h-full w-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        {/* Shaded corridor fill */}
                        <linearGradient id="corridorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.04" />
                        </linearGradient>

                        {/* Line gradient */}
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="75%" stopColor="#38BDF8" />
                          <stop offset="100%" stopColor="#EF4444" />
                        </linearGradient>

                        {/* Glow under trend line */}
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1="35" x2="540" y2="35" stroke="currentColor" className="text-zinc-200 dark:text-[#252A33]" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="540" y2="75" stroke="currentColor" className="text-zinc-200 dark:text-[#252A33]" strokeDasharray="3 3" />
                      <line x1="0" y1="115" x2="540" y2="115" stroke="currentColor" className="text-zinc-200 dark:text-[#252A33]" strokeDasharray="3 3" />

                      {/* Statistical Baseline Corridor (Upper and Lower bounds) */}
                      <path
                        d="M 10,48 C 80,45 160,50 240,46 C 320,44 400,48 460,46 L 530,48 L 530,86 C 460,84 400,88 320,84 C 240,86 160,82 80,85 L 10,86 Z"
                        fill="url(#corridorGradient)"
                      />
                      {/* Upper Baseline Limit */}
                      <path
                        d="M 10,48 C 80,45 160,50 240,46 C 320,44 400,48 460,46 L 530,48"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.45"
                      />
                      {/* Lower Baseline Limit */}
                      <path
                        d="M 10,86 C 80,85 160,82 240,86 C 320,84 400,88 460,84 L 530,86"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.45"
                      />

                      {/* Rolling Mean Baseline */}
                      <path
                        d="M 10,67 C 80,65 160,66 240,66 C 320,64 400,66 460,65 L 530,67"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="1.2"
                        strokeDasharray="2 3"
                        opacity="0.6"
                      />

                      {/* Area Under Historical Telemetry */}
                      <path
                        d="M 15,66 C 65,63 105,73 150,60 C 195,48 230,70 275,64 C 320,58 360,52 405,62 C 450,56 470,55 510,134 L 510,150 L 15,150 Z"
                        fill="url(#areaGradient)"
                      />

                      {/* Actual Metric Telemetry Curve */}
                      <path
                        d="M 15,66 C 65,63 105,73 150,60 C 195,48 230,70 275,64 C 320,58 360,52 405,62 C 450,56 470,55 510,134"
                        fill="none"
                        stroke="url(#trendGradient)"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Stable telemetry data points */}
                      <circle cx="15" cy="66" r="3" fill="#3B82F6" />
                      <circle cx="150" cy="60" r="3" fill="#3B82F6" />
                      <circle cx="275" cy="64" r="3" fill="#3B82F6" />
                      <circle cx="405" cy="62" r="3" fill="#38BDF8" />

                      {/* Critical Anomaly Breach Indicator (Row 10 Dip) */}
                      <circle
                        cx="510"
                        cy="134"
                        r="10"
                        fill="#EF4444"
                        opacity="0.35"
                        className="animate-ping"
                      />
                      <circle
                        cx="510"
                        cy="134"
                        r="5"
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />

                      {/* Floating Anomaly Annotation Box */}
                      <g transform="translate(320, 110)">
                        <rect
                          width="180"
                          height="28"
                          rx="6"
                          className="fill-zinc-900/90 stroke-red-500/80 dark:fill-[#08090B]/95"
                          strokeWidth="1"
                        />
                        <text
                          x="90"
                          y="18"
                          textAnchor="middle"
                          className="fill-red-400 font-mono text-[10px] font-semibold"
                        >
                          CRITICAL DIP: -37.5% (₹65,000)
                        </text>
                      </g>
                    </svg>

                    {/* Timeline date labels */}
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                      <span>Sep 01</span>
                      <span>Sep 03</span>
                      <span>Sep 05</span>
                      <span>Sep 07</span>
                      <span>Sep 09</span>
                      <span className="font-semibold text-red-500">Sep 10 (Breach)</span>
                    </div>
                  </div>
                </div>

                {/* Detected Signals Panel (1 Column) */}
                <div className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-[#252A33] dark:bg-[#15171C]/80">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5 dark:border-[#252A33]">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Detected Signals
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      3 Active
                    </span>
                  </div>

                  {/* Signal Items List */}
                  <div className="mt-3 space-y-2.5">
                    {/* Signal 1: High Revenue Anomaly */}
                    <div className="rounded-lg border border-red-200/90 bg-white p-3 shadow-xs dark:border-red-900/40 dark:bg-[#111318]">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-950/80 dark:text-red-400">
                          HIGH
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Revenue anomaly
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                        Revenue dropped <span className="font-semibold text-red-600 dark:text-red-400">37.5%</span> below baseline
                      </p>
                      <div className="mt-1 font-mono text-[10px] text-zinc-400">
                        Row 10 · 2026-09-10 · Z-Score: -4.8σ
                      </div>
                    </div>

                    {/* Signal 2: High Conversion Anomaly */}
                    <div className="rounded-lg border border-red-200/90 bg-white p-3 shadow-xs dark:border-red-900/40 dark:bg-[#111318]">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-950/80 dark:text-red-400">
                          HIGH
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Conversion anomaly
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                        Conversion fell <span className="font-semibold text-red-600 dark:text-red-400">47.5%</span>
                      </p>
                      <div className="mt-1 font-mono text-[10px] text-zinc-400">
                        Row 10 · Funnel friction detected
                      </div>
                    </div>

                    {/* Signal 3: Info Traffic Remains Stable */}
                    <div className="rounded-lg border border-sky-200/90 bg-white p-3 shadow-xs dark:border-sky-900/40 dark:bg-[#111318]">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-700 dark:bg-sky-950/80 dark:text-sky-300">
                          INFO
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Traffic remains stable
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                        Possible checkout/funnel issue
                      </p>
                      <div className="mt-1 font-mono text-[10px] text-zinc-400">
                        6,200 visits (+20.0% traffic intact)
                      </div>
                    </div>
                  </div>

                  {/* Interactive Trigger CTA inside preview */}
                  <div className="mt-auto pt-3">
                    <button
                      type="button"
                      onClick={onLoadDemoData}
                      className="group flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                    >
                      <span>Explore this live dataset in Audit View</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* FEATURE SECTION                                      */}
      {/* ==================================================== */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Everything You Need to Understand Your Business Metrics
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
            MetricWatch turns raw business data into explainable signals, anomaly detection, and actionable intelligence.
          </p>
        </div>

        {/* 3 Feature Cards in a row */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Card 1: Statistical Baseline Detection */}
          <div className="group rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 dark:border-[#252A33] dark:bg-[#111318] dark:hover:border-blue-500/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:border-blue-500/20 dark:bg-[#15171C] dark:text-blue-400 dark:group-hover:border-blue-500/40">
              <LineChart className="h-5 w-5" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Statistical Baseline Detection
            </h3>

            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Automatically learns normal metric behavior using rolling baselines, deviations, and statistical thresholds.
            </p>

            <div className="mt-5 flex items-center gap-1.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">
              <span>Rolling Z-Scores</span>
              <span>·</span>
              <span>Dynamic Tolerance Bands</span>
            </div>
          </div>

          {/* Card 2: AI Root-Cause Intelligence */}
          <div className="group rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 dark:border-[#252A33] dark:bg-[#111318] dark:hover:border-blue-500/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100 dark:border-sky-500/20 dark:bg-[#15171C] dark:text-sky-400 dark:group-hover:border-sky-500/40">
              <Brain className="h-5 w-5" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              AI Root-Cause Intelligence
            </h3>

            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Connects related metric changes and converts complex anomaly signals into clear, human-readable explanations.
            </p>

            <div className="mt-5 flex items-center gap-1.5 font-mono text-[11px] text-sky-600 dark:text-sky-400">
              <span>Cross-Metric Correlation</span>
              <span>·</span>
              <span>Plain Business Language</span>
            </div>
          </div>

          {/* Card 3: Exact Anomaly Localization */}
          <div className="group rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 dark:border-[#252A33] dark:bg-[#111318] dark:hover:border-blue-500/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-[#15171C] dark:text-emerald-400 dark:group-hover:border-emerald-500/40">
              <Search className="h-5 w-5" />
            </div>

            <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Exact Anomaly Localization
            </h3>

            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Identify the exact dates, rows, metrics, and cells responsible for unusual business behavior.
            </p>

            <div className="mt-5 flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              <span>Cell-Level Precision</span>
              <span>·</span>
              <span>Interactive File Pop-Up</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* HOW IT WORKS                                         */}
      {/* ==================================================== */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            From Raw Data to Business Insight
          </h2>
          <p className="mx-auto mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Three simple steps to transform spreadsheet metrics into verified operational intelligence.
          </p>
        </div>

        <div className="relative">
          {/* Subtle connecting line for desktop */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-16 right-16 hidden -translate-y-1/2 border-t border-dashed border-zinc-300 dark:border-[#252A33] lg:block"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Step 01 */}
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#252A33] dark:bg-[#111318]">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-blue-50 font-mono text-xs font-bold text-blue-600 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400">
                  01
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">
                  <UploadCloud className="h-3.5 w-3.5 text-blue-500" />
                  UPLOAD
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Upload your CSV or Excel business data.
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Drop in sales, traffic, conversion, or operational datasets. Zero complex schema configuration required.
              </p>
            </div>

            {/* Step 02 */}
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#252A33] dark:bg-[#111318]">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-blue-50 font-mono text-xs font-bold text-blue-600 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400">
                  02
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                  ANALYZE
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                MetricWatch cleans the dataset, establishes statistical baselines, and detects unusual behavior.
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Calculates rolling means, standard deviations, and dynamic tolerance corridors across all metrics simultaneously.
              </p>
            </div>

            {/* Step 03 */}
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#252A33] dark:bg-[#111318]">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-blue-50 font-mono text-xs font-bold text-blue-600 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400">
                  03
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  UNDERSTAND
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                AI connects the signals and explains what happened in plain business language.
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Delivers an executive diagnostic synthesis and highlights exact anomalous rows directly in the file viewer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* FINAL CTA                                            */}
      {/* ==================================================== */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-lg dark:border-[#252A33] dark:bg-[#111318] sm:px-12 sm:py-16">
        {/* Subtle bottom glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 left-1/2 -z-10 h-48 w-[480px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[90px] dark:bg-blue-500/20"
        />

        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Stop Monitoring Spreadsheets. Start Monitoring Business Health.
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
            Let MetricWatch automatically surface the signals that deserve your attention.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-600/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span>Analyze Your First Dataset</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
