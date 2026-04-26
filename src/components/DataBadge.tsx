/**
 * Per-section data provenance badges.
 *
 * Design rules:
 *  - Badge sits on its own line BELOW the section title (never inline — avoids overflow)
 *  - Visible text is short; full detail is in the `title` tooltip on hover
 *  - Three variants: real data (green), estimated (amber), mixed (blue)
 *
 * Usage:
 *   <SectionHeader title="월별 거래량" badge={<RealBadge source="국토교통부" />} />
 *   — or for KPI cards —
 *   <DataSource real="국토교통부" />   ← tiny footer credit
 */

interface RealProps  { source: string; detail?: string }
interface EstProps   { note?: string }
interface MixedProps { note?: string }

export function RealBadge({ source, detail }: RealProps) {
  return (
    <span
      title={detail ?? `실제 데이터 출처: ${source}`}
      className="inline-flex items-center gap-1 text-[11px] leading-none bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-medium cursor-default select-none"
    >
      <span className="text-emerald-500 text-[8px]">●</span>{source}
    </span>
  )
}

export function EstBadge({ note }: EstProps) {
  return (
    <span
      title={note ? `추정치 · ${note}` : '추정치 — 공개 API 없음'}
      className="inline-flex items-center gap-1 text-[11px] leading-none bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded font-medium cursor-default select-none"
    >
      <span className="text-amber-500 text-[8px]">◐</span>추정치
    </span>
  )
}

export function MixedBadge({ note }: MixedProps) {
  return (
    <span
      title={note ? `혼합 · ${note}` : '실제 데이터 + 추정치 혼합'}
      className="inline-flex items-center gap-1 text-[11px] leading-none bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded font-medium cursor-default select-none"
    >
      <span className="text-[8px]">◑</span>혼합
    </span>
  )
}

/**
 * SectionHeader — title + optional badge + optional subtitle.
 * Badge always appears on the same line as the title; the container wraps
 * on narrow screens so the badge never overflows.
 */
interface SectionHeaderProps {
  title: string
  badge?: React.ReactNode
  sub?: string
  className?: string
}

export function SectionHeader({ title, badge, sub, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        {badge}
      </div>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

/**
 * DataSource — tiny one-line source credit for the bottom of KPI cards.
 */
interface DataSourceProps { label: string; isReal?: boolean }

export function DataSource({ label, isReal = true }: DataSourceProps) {
  return (
    <p className={`text-[10px] mt-1.5 ${isReal ? 'text-emerald-700' : 'text-amber-700'}`}>
      {isReal ? '● ' : '◐ '}{label}
    </p>
  )
}
