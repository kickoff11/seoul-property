import { DistrictSummary } from '@/types'
import { fmt, fmtPricePerM2 } from '@/lib/analysis'

interface Props {
  data: DistrictSummary[]
}

export default function DistrictRanking({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.avgPricePerM2 - a.avgPricePerM2)
  const maxPpm2 = sorted[0]?.avgPricePerM2 ?? 1

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300">구별 평균 m²당 가격 순위</h3>
        <p className="text-xs text-slate-500 mt-0.5">최근 6개월 실거래가 기준</p>
      </div>
      <div className="divide-y divide-slate-700/50 max-h-[440px] overflow-y-auto">
        {sorted.map((d, i) => (
          <div key={d.lawdCd} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
            <span className="text-xs font-bold text-slate-500 w-5 text-right">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-200">{d.gu}</span>
                <div className="text-right">
                  <span className="text-xs text-blue-300 font-semibold">{fmtPricePerM2(Math.round(d.avgPricePerM2))}</span>
                  <span className="text-xs text-slate-500 ml-2">평균 {fmt(Math.round(d.avgAmount))}</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(d.avgPricePerM2 / maxPpm2) * 100}%`,
                    background: `hsl(${220 - (d.avgPricePerM2 / maxPpm2) * 180}, 80%, 60%)`,
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">{d.count.toLocaleString()}건</span>
          </div>
        ))}
      </div>
    </div>
  )
}
