import clsx from 'clsx'

interface Props {
  title: string
  value: string
  sub?: string
  change?: number   // positive = up, negative = down
  highlight?: boolean
  /** Short source credit shown as a faint footnote (e.g. "국토교통부") */
  source?: string
  /** Whether source is real data (green) or estimated (amber). Default true. */
  sourceReal?: boolean
}

export default function MetricCard({ title, value, sub, change, highlight, source, sourceReal = true }: Props) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-4 flex flex-col',
        highlight
          ? 'bg-blue-900/30 border-blue-600/50'
          : 'bg-slate-800 border-slate-700',
      )}
    >
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
      {sub && <p className="text-sm text-slate-400 mt-0.5">{sub}</p>}
      {change !== undefined && (
        <p className={clsx('text-sm font-medium mt-0.5', change >= 0 ? 'text-rose-400' : 'text-emerald-400')}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% (전년 동기 대비)
        </p>
      )}
      {source && (
        <p className={clsx('text-[10px] mt-auto pt-2', sourceReal ? 'text-emerald-700' : 'text-amber-700')}>
          {sourceReal ? '● ' : '◐ '}{source}
        </p>
      )}
    </div>
  )
}
