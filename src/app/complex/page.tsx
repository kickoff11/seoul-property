'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { fmt, fmtPricePerM2 } from '@/lib/analysis'
import { ApartmentTransaction } from '@/types'
import { useWatchlist, WatchButton, WatchlistPanel } from '@/components/Watchlist'
import clsx from 'clsx'

interface ComplexSummary {
  aptName: string
  gu: string
  dong: string
  builtYear: number
  roadAddress: string | null
  totalDeals: number
  avgAmount: number
  medianAmount: number
  minAmount: number
  maxAmount: number
  avgPricePerM2: number
  minPricePerM2: number
  maxPricePerM2: number
  latestDeal: string
  latestPrice: number
  areaTypes: number[]
}

interface TrendRow {
  month: string
  avgAmount: number
  avgPricePerM2: number
  count: number
}

function ComplexPageInner() {
  const params  = useSearchParams()
  const name    = params.get('name') ?? ''
  const gu      = params.get('gu')   ?? undefined

  const { items: watchlist, add: watchAdd, remove: watchRemove, isWatched } = useWatchlist()
  const [summary, setSummary] = useState<ComplexSummary | null>(null)
  const [trends,  setTrends]  = useState<TrendRow[]>([])
  const [txs,     setTxs]     = useState<ApartmentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState<number | null>(null)

  useEffect(() => {
    if (!name) { setLoading(false); return }
    const q = new URLSearchParams({ name, ...(gu ? { gu } : {}) })
    fetch(`/api/complex?${q}`)
      .then(r => r.json())
      .then(d => {
        setSummary(d.summary)
        setTrends(d.trends ?? [])
        setTxs(d.transactions ?? [])
      })
      .finally(() => setLoading(false))
  }, [name, gu])

  if (!name) return (
    <div className="text-slate-500 text-sm py-20 text-center">단지명이 지정되지 않았습니다.</div>
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!summary) return (
    <div className="text-center py-20">
      <p className="text-slate-400 text-sm">해당 단지의 거래 데이터가 없습니다.</p>
      <p className="text-slate-600 text-xs mt-2">단지명: {name}</p>
      <Link href="/" className="text-blue-400 text-xs underline mt-4 inline-block">← 대시보드로</Link>
    </div>
  )

  const filteredTxs = areaFilter
    ? txs.filter(t => Math.abs(t.area - areaFilter) < 0.5)
    : txs

  const trendChart = trends.map(t => ({
    month:    t.month.slice(2),
    평균거래가: Math.round(t.avgAmount),
    거래량:   t.count,
  }))

  const floorDistribution = txs.reduce<Record<string, number>>((acc, t) => {
    const band = t.floor <= 5 ? '저층(1-5)' : t.floor <= 15 ? '중층(6-15)' : '고층(16+)'
    acc[band] = (acc[band] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">

      {/* Back + header */}
      <div>
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← 대시보드로
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <h1 className="text-xl font-bold text-slate-100">{summary.aptName}</h1>
          <WatchButton
            aptName={summary.aptName} gu={summary.gu}
            isWatched={isWatched(summary.aptName, summary.gu)}
            onAdd={watchAdd} onRemove={watchRemove}
          />
        </div>
        <p className="text-slate-400 text-sm mt-0.5">
          {summary.gu} · {summary.dong}
          {summary.builtYear > 0 && ` · ${summary.builtYear}년 준공`}
          {summary.roadAddress && ` · ${summary.roadAddress}`}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '최근 거래가',    value: fmt(summary.latestPrice),         sub: summary.latestDeal },
          { label: '중위 거래가',    value: fmt(summary.medianAmount),         sub: `평균 ${fmt(summary.avgAmount)}` },
          { label: '평균 m²당',     value: fmtPricePerM2(summary.avgPricePerM2), sub: `${fmtPricePerM2(summary.minPricePerM2)} ~ ${fmtPricePerM2(summary.maxPricePerM2)}` },
          { label: '총 거래 건수',   value: `${summary.totalDeals.toLocaleString()}건`, sub: '수집 기간 내' },
        ].map(c => (
          <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-xl font-bold text-slate-100 mt-1">{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Price trend chart */}
      {trendChart.length > 1 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">월별 평균 거래가 추이</h3>
          <div className="overflow-x-auto"><div style={{ minWidth: 320 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${(v / 10000).toFixed(0)}억`}
                width={44}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number) => [`${v.toLocaleString()}만원`, '평균 거래가']}
              />
              <Line type="monotone" dataKey="평균거래가" stroke="#3b82f6" strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          </div></div>
        </div>
      )}

      {/* Area type filter + floor distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area filter */}
        {summary.areaTypes.length > 1 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">전용면적별 필터</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAreaFilter(null)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  areaFilter === null
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500',
                )}
              >
                전체
              </button>
              {summary.areaTypes.map(a => (
                <button
                  key={a}
                  onClick={() => setAreaFilter(a)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    areaFilter === a
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500',
                  )}
                >
                  {a}m²
                </button>
              ))}
            </div>
            {areaFilter && (
              <p className="text-xs text-slate-500 mt-2">
                {areaFilter}m² 거래 {filteredTxs.length.toLocaleString()}건 표시 중
              </p>
            )}
          </div>
        )}

        {/* Floor distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">층별 거래 분포</h3>
          <div className="overflow-x-auto"><div style={{ minWidth: 240 }}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={Object.entries(floorDistribution).map(([band, count]) => ({ band, count }))}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="band" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number) => [`${v}건`, '거래량']}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div></div>
        </div>
      </div>

      {/* Watchlist panel */}
      <WatchlistPanel items={watchlist} onRemove={watchRemove} />

      {/* Transaction list */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">실거래 내역</h3>
          <span className="text-xs text-slate-500">{filteredTxs.length.toLocaleString()}건</span>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
          {filteredTxs.map(t => (
            <div key={t.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{t.dealDate}</span>
                <span className="text-base font-bold text-blue-300">{fmt(t.amount)}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>{t.area}m²</span>
                <span>{t.floor}층</span>
                <span className={clsx('ml-auto font-semibold',
                  t.pricePerM2 > 2000 ? 'text-rose-400' : t.pricePerM2 > 1000 ? 'text-amber-400' : 'text-emerald-400',
                )}>
                  {fmtPricePerM2(t.pricePerM2)}/m²
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 sticky top-0">
              <tr>
                {['거래일', '거래금액', '전용면적', 'm²당', '층'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTxs.map(t => (
                <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">{t.dealDate}</td>
                  <td className="px-3 py-2 text-blue-300 font-semibold whitespace-nowrap">{fmt(t.amount)}</td>
                  <td className="px-3 py-2 text-slate-300 text-xs">{t.area}m²</td>
                  <td className={clsx('px-3 py-2 text-xs whitespace-nowrap',
                    t.pricePerM2 > 2000 ? 'text-rose-400' : t.pricePerM2 > 1000 ? 'text-amber-400' : 'text-emerald-400',
                  )}>
                    {fmtPricePerM2(t.pricePerM2)}
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{t.floor}층</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default function ComplexPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ComplexPageInner />
    </Suspense>
  )
}
