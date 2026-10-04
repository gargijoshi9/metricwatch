const STYLES = {
  low: {
    label: 'LOW',
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  medium: {
    label: 'MEDIUM',
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  high: {
    label: 'HIGH',
    badge:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400',
    dot: 'bg-red-500',
  },
}

export default function SeverityBadge({ severity }) {
  const style = STYLES[String(severity).toLowerCase()]
  if (!style) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold leading-4 tracking-wide ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  )
}
