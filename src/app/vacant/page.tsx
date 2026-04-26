'use client'

import { useEffect, useState } from 'react'
import { VacantComplex } from '@/types'
import { fmt } from '@/lib/analysis'

function monthsInactive(c: VacantComplex): number {
  if (c.monthsInactive != null) return c.monthsInactive
  const last = new Date(c.lastDealDate)
  const now  = new Date()
  return (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth())
}
import clsx from 'clsx'
import { RealBadge, EstBadge } from '@/components/DataBadge'

export default function VacantPage() {
  const [data, setData]       = useState<VacantComplex[]>([])
  const [loading, setLoading] = useState(true)
  const [months, setMonths]   = useState(18)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/vacant?months=${months}`)
      .then(r => r.json())
      .then(j => { setData(j.data); setLoading(false) })
  }, [months])

  const filtered = data.filter(c =>
    !search || c.aptName.includes(search) || c.gu.includes(search) || c.dong.includes(search)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">공실 의심 단지 탐지</h1>
        <p className="text-slate-400 text-sm mt-1">
          실거래 기록이 장기간 없는 단지입니다. 장기 공실, 투기 목적 보유, 증여 대기 가능성이 있습니다.
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          {data.length > 0 && data[0].suspicionFlag
            ? <EstBadge note="모의 데이터 — 국토교통부 DB 데이터 부족" />
            : <RealBadge source="국토교통부 실거래가 DB" />
          }
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {[12, 18, 24, 36].map(m => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                months === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200',
              )}
            >
              {m}개월 이상
            </button>
          ))}
        </div>
        <input
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 w-52 focus:outline-none focus:border-blue-500"
          placeholder="아파트명 / 구 / 동 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="text-xs text-slate-500 ml-auto">{filtered.length}개 단지</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '12개월 이상 미거래', threshold: 12, color: 'border-yellow-700/50 bg-yellow-900/20 text-yellow-400' },
          { label: '24개월 이상 미거래', threshold: 24, color: 'border-amber-700/50 bg-amber-900/20 text-amber-400' },
          { label: '36개월 이상 미거래', threshold: 36, color: 'border-rose-700/50 bg-rose-900/20 text-rose-400' },
        ].map(s => (
          <div key={s.threshold} className={clsx('rounded-xl border p-4', s.color)}>
            <p className="text-xs opacity-70 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">
              {data.filter(c => monthsInactive(c) >= s.threshold).length}
              <span className="text-sm font-normal ml-1">단지</span>
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm py-8 justify-center">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          데이터 로딩 중…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-1">해당 조건의 단지 없음</p>
          <p className="text-sm">기간을 줄이거나 검색어를 변경해 보세요.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-700/50">
            {filtered.map((c, i) => {
              const mi   = monthsInactive(c)
              const flagKey = (c.suspicionFlag === 'high' || c.suspicionFlag === 'medium' || c.suspicionFlag === 'low')
                ? c.suspicionFlag
                : (mi >= 36 ? 'high' : mi >= 24 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
              const flagCfg = {
                high:   { label: '高 의심', cls: 'bg-rose-900/40 text-rose-300 border border-rose-700/40' },
                medium: { label: '中 의심', cls: 'bg-amber-900/40 text-amber-300 border border-amber-700/40' },
                low:    { label: '모니터링', cls: 'bg-slate-700/60 text-slate-400 border border-slate-600/40' },
              }[flagKey]

              return (
                <div key={i} className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <span className="text-xs text-slate-600 w-5 pt-0.5 shrink-0">{i + 1}</span>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-slate-100 text-sm">{c.aptName}</p>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold', flagCfg.cls)}>
                          {flagCfg.label}
                        </span>
                        <span className={clsx(
                          'text-xs px-2 py-0.5 rounded-full font-bold',
                          mi >= 36 ? 'bg-rose-900/40 text-rose-400' :
                          mi >= 24 ? 'bg-amber-900/40 text-amber-400' :
                          'bg-yellow-900/30 text-yellow-400',
                        )}>
                          {mi}개월 무거래
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mb-1">
                        {c.gu} {c.dong} · 마지막 거래: {c.lastDealDate} · 총 {c.totalDeals}건 · 평균 {Math.round(c.avgArea)}m²
                      </p>

                      {c.reason && (
                        <p className="text-xs text-slate-400 leading-relaxed">{c.reason}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-blue-300">{fmt(c.lastAmount)}</p>
                      <p className="text-xs text-slate-500">마지막 거래가</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
