import { VacantComplex } from '@/types'
import { fmt } from '@/lib/analysis'
import clsx from 'clsx'

interface Props {
  data: VacantComplex[]
}

function urgencyLabel(months: number): { label: string; color: string } {
  if (months >= 36) return { label: '장기 미거래', color: 'text-rose-400 bg-rose-900/30 border-rose-700/50' }
  if (months >= 24) return { label: '2년 이상',    color: 'text-amber-400 bg-amber-900/30 border-amber-700/50' }
  return              { label: '1.5년 이상',        color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50' }
}

export default function VacancyAlert({ data }: Props) {
  if (!data.length) return null

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300">공실 의심 단지</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          실거래 기록이 18개월 이상 없는 아파트 단지입니다. 장기 공실 또는 증여/상속이 의심됩니다.
        </p>
      </div>
      <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
        {data.slice(0, 40).map((c, i) => {
          const mi = c.monthsInactive ?? (() => {
            const last = new Date(c.lastDealDate)
            const now  = new Date()
            return (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth())
          })()
          const { label, color } = urgencyLabel(mi)
          return (
            <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
              <div className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap', color)}>
                {label}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{c.aptName}</p>
                <p className="text-xs text-slate-500">{c.gu} {c.dong} · {Math.round(c.avgArea)}m² · 마지막 거래: {c.lastDealDate}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">{mi}개월 전</p>
                <p className="text-xs text-slate-500">최근가 {fmt(c.lastAmount)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
