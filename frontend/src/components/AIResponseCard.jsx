import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Brain,
  Check,
  Copy,
  FileSpreadsheet,
  ListTodo,
  Sparkles,
} from 'lucide-react'

const SIGNAL = {
  down: { Icon: ArrowDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' },
  up: { Icon: ArrowUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  flat: { Icon: ArrowRight, color: 'text-zinc-400 dark:text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' },
}

export default function AIResponseCard({ summary, onInspectFile }) {
  const [copied, setCopied] = useState(false)

  if (!summary) return null

  function handleCopy() {
    const textToCopy = `MetricWatch AI Synthesis (${summary.generatedAt}):\n\n${summary.narrative}\n\nKey Signals:\n${summary.signals
      ?.map((s) => `- ${s.metric}: ${s.change > 0 ? '+' : ''}${s.change}% (${s.direction})`)
      .join('\n')}\n\nRecommended Actions:\n${summary.recommendations
      ?.map((r) => `[${r.priority}] ${r.action}`)
      .join('\n')}`

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-blue-200/80 bg-gradient-to-b from-blue-50/30 via-white to-white shadow-sm dark:border-blue-900/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/60 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                AI Executive Root-Cause Diagnostic
              </h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                SYNTHESIZED
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Generated for snapshot: {summary.generatedAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title="Copy full synthesis"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Report</span>
              </>
            )}
          </button>

          {onInspectFile && (
            <button
              type="button"
              onClick={onInspectFile}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Inspect in File</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Narrative + Key Signals */}
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_18rem]">
        {/* Left: Narrative & Recommendations */}
        <div className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Hypothesis &amp; Correlation Analysis
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {summary.narrative}
            </p>
          </div>

          {summary.recommendations && summary.recommendations.length > 0 && (
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                <ListTodo className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Recommended Triage Actions
              </h4>
              <ul className="mt-3 space-y-2">
                {summary.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        rec.priority.startsWith('P0')
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                          : rec.priority.startsWith('P1')
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                          : 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <span className="leading-snug">{rec.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Key Signals */}
        <div className="rounded-lg border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/90">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Detected Key Signals
          </h3>
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {summary.signals?.map(({ metric, direction, change, severity }) => {
              const sig = SIGNAL[direction] ?? SIGNAL.flat
              const Icon = sig.Icon
              return (
                <li key={metric} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${sig.bg}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{metric}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold tabular-nums ${sig.color}`}>
                      {change > 0 ? '+' : ''}
                      {change.toFixed(1)}%
                    </span>
                    {severity && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          severity === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : severity === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {severity}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Signals are evaluated against historical 30-day baseline distributions.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
