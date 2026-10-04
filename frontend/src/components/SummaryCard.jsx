import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'

const SIGNAL = {
  down: { Icon: ArrowDown, color: 'text-red-600 dark:text-red-400' },
  up: { Icon: ArrowUp, color: 'text-emerald-600 dark:text-emerald-400' },
  flat: { Icon: ArrowRight, color: 'text-zinc-400 dark:text-zinc-500' },
}

/**
 * summary: { narrative, generatedAt?, signals: [{ metric, direction, change }] }
 * Pass the backend response straight in as the `summary` prop.
 */
export default function SummaryCard({ summary }) {
  if (!summary) return null

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-4 border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Business Summary
        </h2>
        {summary.generatedAt && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{summary.generatedAt}</span>
        )}
      </div>

      <div className="md:grid md:grid-cols-[1fr_16rem]">
        <p className="px-5 py-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
          {summary.narrative}
        </p>

        <div className="border-t border-zinc-200 px-5 py-5 dark:border-zinc-800 md:border-l md:border-t-0">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Key signals
          </h3>
          <ul className="mt-3 space-y-2.5">
            {summary.signals?.map(({ metric, direction, change }) => {
              const { Icon, color } = SIGNAL[direction] ?? SIGNAL.flat
              return (
                <li key={metric} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <Icon className={`h-3.5 w-3.5 ${color}`} aria-hidden="true" />
                    {metric}
                  </span>
                  <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                    {change.toFixed(1)}%
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
