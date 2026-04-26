'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { SupplyByYear, MajorProject, SupplyDemandRatio } from '@/types'
import MetricCard from '@/components/MetricCard'
import { RealBadge, EstBadge, MixedBadge, SectionHeader, DataSource } from '@/components/DataBadge'
import clsx from 'clsx'

interface SupplyApiData {
  annualSupply:         SupplyByYear[]
  supplyDemand:         SupplyDemandRatio[]
  majorProjects:        MajorProject[]
  districtSupply:       Record<string, number>
  annualDemandBaseline: number
  realPriceByGu:        Record<string, number>
}

const STATUS_CLS: Record<string, string> = {
  '입주완료': 'bg-slate-700 text-slate-400',
  '입주예정': 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  '시공중':   'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  '분양중':   'bg-purple-900/40 text-purple-300 border border-purple-700/40',
  '분양예정': 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
  '계획중':   'bg-slate-700/50 text-slate-400',
}

const TYPE_CLS: Record<string, string> = {
  '재건축': 'text-blue-400',
  '재개발': 'text-emerald-400',
  '신규':   'text-purple-400',
}

function fmtPrice(manwon: number): string {
  if (manwon >= 10000) return `${(manwon / 10000).toFixed(1)}억/m²`
  return `${manwon.toLocaleString()}만/m²`
}

export default function SupplyPage() {
  const [data, setData]         = useState<SupplyApiData | null>(null)
  const [guFilter, setGuFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/supply').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const supply2025 = data.annualSupply.find(s => s.year === 2025)?.units ?? 0
  const supply2026 = data.annualSupply.find(s => s.year === 2026)?.units ?? 0
  const activePipeline = data.majorProjects
    .filter(p => p.status !== '입주완료')
    .reduce((s, p) => s + p.totalUnits, 0)

  const guList = ['전체', ...Array.from(new Set(data.majorProjects.map(p => p.gu))).sort()]
  const statusList = ['전체', '시공중', '분양중', '분양예정', '입주예정', '계획중', '입주완료']

  let displayed = [...data.majorProjects]
  if (guFilter !== '전체')     displayed = displayed.filter(p => p.gu === guFilter)
  if (statusFilter !== '전체') displayed = displayed.filter(p => p.status === statusFilter)

  const chartData = data.annualSupply.map(s => ({
    year: s.year,
    재건축재개발: s.reconstructionUnits,
    신규건설:    s.newBuildUnits,
    actual: s.actual,
  }))

  const ratioData = data.supplyDemand.map(s => ({ year: s.year, ratio: s.ratio }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">공급 분석</h1>
        <p className="text-slate-400 text-sm mt-1">
          서울 아파트 공급 전망 및 주요 사업지 현황 · 국토교통부·부동산R114·서울시 정비사업 현황 기반
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <EstBadge note="공급 물량 — 부동산R114·서울시 정비사업 기반 추정" />
          <RealBadge source="단지별 실거래가 — 국토교통부" />
        </div>
      </div>

      {/* Supply cliff alert */}
      <div className="bg-rose-900/20 border border-rose-700/50 rounded-xl p-4 flex gap-3">
        <span className="text-rose-400 text-lg mt-0.5 shrink-0">⚠</span>
        <div>
          <p className="text-rose-300 font-semibold text-sm">2025–2026 공급 절벽 경고</p>
          <p className="text-rose-400/75 text-xs mt-1 leading-relaxed">
            2025년 예상 입주 {supply2025.toLocaleString()}세대, 2026년 {supply2026.toLocaleString()}세대 —
            서울 연간 수요 추정치(3.7만 세대)의 절반 수준. 재건축 인허가 감소·공사비 급등으로 인한 사업 지연이 원인.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="2025년 예정 입주" value={`${(supply2025/10000).toFixed(1)}만 세대`} sub="전년比 -51%" source="부동산R114 추정" sourceReal={false} />
        <MetricCard title="2026년 예정 입주" value={`${(supply2026/10000).toFixed(1)}만 세대`} sub="역대 최저 수준" source="부동산R114 추정" sourceReal={false} />
        <MetricCard title="공급/수요 비율 (2026)" value={`${(supply2026/37000).toFixed(2)}x`} sub="1.0 미만 = 공급 부족" highlight source="수요 기준선 추정" sourceReal={false} />
        <MetricCard title="진행 중 파이프라인" value={`${activePipeline.toLocaleString()}세대`} sub="입주완료 제외" source="공시자료 기반" sourceReal={false} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="연도별 서울 아파트 입주 물량"
            badge={<MixedBadge note="실적: 국토교통부 · 전망: 부동산R114 추정" />}
            sub="진한 막대 = 실적 · 흐린 막대 = 추정 · 점선 = 수요 기준선 (37,000세대)"
          />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v/10000).toFixed(0)}만`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number, name: string) => [`${v.toLocaleString()}세대`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <ReferenceLine y={37000} stroke="#f59e0b" strokeDasharray="5 3"
                label={{ value: '수요선', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
              <Bar dataKey="재건축재개발" stackId="a">
                {chartData.map((e, i) => <Cell key={i} fill={e.actual ? '#3b82f6' : '#1d4ed8'} fillOpacity={e.actual ? 1 : 0.45} />)}
              </Bar>
              <Bar dataKey="신규건설" stackId="a" radius={[3,3,0,0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.actual ? '#10b981' : '#065f46'} fillOpacity={e.actual ? 1 : 0.45} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="공급/수요 비율"
            badge={<EstBadge note="수요 기준선 추정 (37,000세대)" />}
            sub="1.0 이하 → 가격 상승 압력"
          />
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={ratioData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 2]} tickFormatter={v => `${v}x`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number) => [`${v}x`, '공급/수요']}
              />
              <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="5 3"
                label={{ value: '균형', fill: '#f59e0b', fontSize: 10 }} />
              <Line type="monotone" dataKey="ratio" stroke="#3b82f6" strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project list */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <SectionHeader
            title="주요 사업지 현황"
            badge={<MixedBadge note="확정 분양가·실거래가: 실제 / 사업 현황: 공시자료" />}
          />
          <div className="flex flex-wrap gap-2">
            {guList.map(g => (
              <button key={g} onClick={() => setGuFilter(g)}
                className={clsx('px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  guFilter === g ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600')}>
                {g}
              </button>
            ))}
            <div className="w-px bg-slate-600 mx-1" />
            {statusList.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={clsx('px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600')}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {displayed.map(p => {
            const isExpanded = expandedId === p.name
            const realPrice  = p.avgTransactionPricePerM2

            return (
              <div key={p.name} className="hover:bg-slate-700/20 transition-colors">
                <div className="px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : p.name)}>
                  <div className="flex items-center gap-4">

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-100 text-sm">{p.nameShort}</p>
                        {p.riverView && <span className="text-xs text-blue-400">🌊</span>}
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full', STATUS_CLS[p.status])}>{p.status}</span>
                        <span className={clsx('text-xs font-medium', TYPE_CLS[p.type])}>{p.type}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.gu} {p.dong} · {p.expectedYear}년 · {p.totalUnits.toLocaleString()}세대
                        {p.generalSaleUnits ? ` (일반분양 ${p.generalSaleUnits.toLocaleString()})` : ''}
                        {' · '}{p.developer}
                      </p>
                    </div>

                    {/* Pricing — real data only */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
                      <div>
                        <p className="text-xs text-slate-500">확정 분양가/m²</p>
                        <p className="text-sm font-bold text-blue-300">
                          {p.presalePrice && p.presalePriceNote === '확정'
                            ? fmtPrice(p.presalePrice)
                            : <span className="text-slate-600">미확정</span>}
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">● 분양공고</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">구 실거래 평균/m²</p>
                        <p className="text-sm font-bold text-slate-300">
                          {realPrice ? fmtPrice(realPrice) : <span className="text-slate-600">—</span>}
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">● 국토교통부</p>
                      </div>
                    </div>

                    <span className="text-slate-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-slate-900/30 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-3 mb-2">교통 · 학군</p>
                      <p className="text-xs text-slate-300">{p.subway}</p>
                      <p className="text-xs text-slate-400 mt-1">{p.schoolZone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-3 mb-2">주요 사항</p>
                      <ul className="space-y-1">
                        {p.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-2">
                            <span className="text-blue-500 shrink-0">•</span>{h}
                          </li>
                        ))}
                      </ul>
                      {p.notes && (
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed border-l-2 border-slate-600 pl-2">{p.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-3 border-t border-slate-700 text-xs text-slate-600">
          구 실거래 평균가는 국토교통부 실거래가 DB 기준 (최근 6개월 해당 구 전체 아파트 평균).
          확정 분양가 없는 단지는 분양가상한제·사업 진행에 따라 변동될 수 있습니다.
        </div>
      </div>
    </div>
  )
}
