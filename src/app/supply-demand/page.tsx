'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie,
} from 'recharts'
import { SupplyByYear, MajorProject, SupplyDemandRatio, DemographicPoint, SentimentPoint, InterestRatePoint, AffordabilityPoint } from '@/types'
import MetricCard from '@/components/MetricCard'
import { RealBadge, EstBadge, MixedBadge, SectionHeader, DataSource } from '@/components/DataBadge'
import clsx from 'clsx'

interface SupplyApiData {
  annualSupply:         SupplyByYear[]
  supplyDemand:         SupplyDemandRatio[]
  majorProjects:        MajorProject[]
  annualDemandBaseline: number
  realPriceByGu:        Record<string, number>
}

interface DemandApiData {
  demographics:         DemographicPoint[]
  sentiment:            SentimentPoint[]
  interestRates:        InterestRatePoint[]
  affordability:        AffordabilityPoint[]
  buyerAgeDistribution: { group: string; pct: number }[]
  marketSummary: {
    liveRates: boolean
    livePir:   boolean
  }
}

const STATUS_CLS: Record<string, string> = {
  '입주완료': 'bg-slate-700 text-slate-400',
  '입주예정': 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  '시공중':   'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  '분양중':   'bg-purple-900/40 text-purple-300 border border-purple-700/40',
  '분양예정': 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
  '계획중':   'bg-slate-700/50 text-slate-400',
}

const AGE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

type Tab = 'supply' | 'demand'

export default function SupplyDemandPage() {
  const [supply, setSupply] = useState<SupplyApiData | null>(null)
  const [demand, setDemand] = useState<DemandApiData | null>(null)
  const [tab, setTab]       = useState<Tab>('supply')
  const [guFilter, setGuFilter]     = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')

  useEffect(() => {
    Promise.all([
      fetch('/api/supply').then(r => r.json()),
      fetch('/api/demand').then(r => r.json()),
    ]).then(([s, d]) => { setSupply(s); setDemand(d) })
  }, [])

  if (!supply || !demand) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const supply2025 = supply.annualSupply.find(s => s.year === 2025)?.units ?? 0
  const supply2026 = supply.annualSupply.find(s => s.year === 2026)?.units ?? 0
  const latestRate = demand.interestRates[demand.interestRates.length - 1]
  const latest     = demand.sentiment[demand.sentiment.length - 1]
  const latestPir  = demand.affordability[demand.affordability.length - 1]
  const latestDemog = demand.demographics[demand.demographics.length - 1]

  const guList = ['전체', ...Array.from(new Set(supply.majorProjects.map(p => p.gu))).sort()]
  const statusList = ['전체', '시공중', '분양중', '분양예정', '입주예정', '계획중', '입주완료']

  let displayed = [...supply.majorProjects]
  if (guFilter !== '전체')     displayed = displayed.filter(p => p.gu === guFilter)
  if (statusFilter !== '전체') displayed = displayed.filter(p => p.status === statusFilter)

  const supplyChartData = supply.annualSupply.map(s => ({
    year: s.year,
    재건축재개발: s.reconstructionUnits,
    신규건설:    s.newBuildUnits,
    actual: s.actual,
  }))

  const ratioData = supply.supplyDemand.map(s => ({ year: s.year, ratio: s.ratio }))

  const sentimentChart = demand.sentiment.map(s => ({
    month: s.month.slice(2),
    매수우위지수:  s.buyerSentiment,
    가격전망지수: s.priceExpectation,
  }))

  const rateChart = demand.interestRates.map(r => ({
    month: r.month.slice(2),
    기준금리:  r.baseRate,
    주담대금리: r.mortgageRate,
  }))

  const affordChart = demand.affordability.map(a => ({
    year: a.year,
    'PIR (배수)':       a.pir,
    '월 상환 부담 (%)': a.monthlyBurden,
  }))

  const demogChart = demand.demographics.map(d => ({
    year: d.year, 인구: d.population, 가구수: d.households,
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">공급·수요 분석</h1>
        <p className="text-slate-400 text-sm mt-1">
          2025-2026 공급 절벽과 수요 구조 변화 — 매수 타이밍의 핵심 배경 데이터
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <MixedBadge note="공급 실적: 국토부 / 공급 전망: 부동산R114 / 수요: 공개보고서 추정" />
          <RealBadge source="인구·가구수 — 통계청" />
        </div>
      </div>

      {/* Combined KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="2026년 예정 입주" value={`${(supply2026/10000).toFixed(1)}만 세대`}
          sub={`수요比 ${(supply2026/supply.annualDemandBaseline*100).toFixed(0)}%`}
          highlight source="부동산R114 추정" sourceReal={false} />
        <MetricCard title="매수심리지수" value={`${latest.buyerSentiment}`}
          sub="100 = 중립" source="KB부동산 추정" sourceReal={false} />
        <MetricCard title="주담대 금리" value={`${latestRate.mortgageRate}%`}
          sub={`기준금리 ${latestRate.baseRate}%`} source="한국은행 기반 추정" sourceReal={false} />
        <MetricCard title="주택구입부담 (PIR)" value={`${latestPir.pir}배`}
          sub={`월 상환 ${latestPir.monthlyBurden}%`} source="통계청·부동산원 추정" sourceReal={false} />
      </div>

      {/* Supply cliff alert */}
      <div className="bg-rose-900/20 border border-rose-700/50 rounded-xl p-4 flex gap-3">
        <span className="text-rose-400 text-lg mt-0.5 shrink-0">⚠</span>
        <div>
          <p className="text-rose-300 font-semibold text-sm">2025–2026 공급 절벽 — 무주택자에게 양날의 칼</p>
          <p className="text-rose-400/75 text-xs mt-1 leading-relaxed">
            2025년 {supply2025.toLocaleString()}세대, 2026년 {supply2026.toLocaleString()}세대 입주 예정 — 수요 추정치(3.7만)의 절반 이하.
            공급 부족은 <strong className="text-rose-300">가격 하방을 막는 지지대</strong>가 되지만, 동시에 <strong className="text-rose-300">지금 사면 역대 최고가</strong>라는 딜레마.
            기다리면 공급이 더 줄어드는 2026년 상반기에 가격 상방 압력이 커질 수 있습니다.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-1">
        {(['supply', 'demand'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-t transition-colors',
              tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200',
            )}>
            {t === 'supply' ? '공급 분석' : '수요 분석'}
          </button>
        ))}
      </div>

      {/* ─── SUPPLY TAB ─── */}
      {tab === 'supply' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHeader title="연도별 서울 아파트 입주 물량"
                badge={<MixedBadge note="실적: 국토교통부 · 전망: 부동산R114 추정" />}
                sub="진한 막대 = 실적 · 흐린 막대 = 추정 · 점선 = 수요 기준선 (37,000세대)" />
              <div className="overflow-x-auto"><div style={{ minWidth: 320 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={supplyChartData} margin={{ top: 5, right: 5, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v/10000).toFixed(0)}만`}
                    label={{ value: '입주 세대수', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, dx: -8 }}
                    width={56} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                    formatter={(v: number, name: string) => [`${v.toLocaleString()}세대`, name]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <ReferenceLine y={37000} stroke="#f59e0b" strokeDasharray="5 3"
                    label={{ value: '수요선', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
                  <Bar dataKey="재건축재개발" stackId="a">
                    {supplyChartData.map((e, i) => <Cell key={i} fill={e.actual ? '#3b82f6' : '#1d4ed8'} fillOpacity={e.actual ? 1 : 0.45} />)}
                  </Bar>
                  <Bar dataKey="신규건설" stackId="a" radius={[3,3,0,0]}>
                    {supplyChartData.map((e, i) => <Cell key={i} fill={e.actual ? '#10b981' : '#065f46'} fillOpacity={e.actual ? 1 : 0.45} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div></div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHeader title="공급/수요 비율"
                badge={<EstBadge note="수요 기준선 37,000세대 추정" />}
                sub="1.0 이하 → 가격 상방 압력" />
              <div className="overflow-x-auto"><div style={{ minWidth: 260 }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={ratioData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 2]} tickFormatter={v => `${v}x`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                    formatter={(v: number) => [`${v}x`, '공급/수요']} />
                  <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="5 3"
                    label={{ value: '균형', fill: '#f59e0b', fontSize: 10 }} />
                  <Line type="monotone" dataKey="ratio" stroke="#3b82f6" strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              </div></div>
            </div>
          </div>

          {/* Project list */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <SectionHeader title="주요 사업지 현황"
                badge={<MixedBadge note="확정 분양가: 실제 / 사업 현황: 공시자료" />} />
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
            <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
              {displayed.map(p => (
                <div key={p.name} className="px-4 py-3 hover:bg-slate-700/20">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-100 text-sm">{p.nameShort}</p>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full', STATUS_CLS[p.status])}>{p.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.gu} {p.dong} · {p.expectedYear}년 · {p.totalUnits.toLocaleString()}세대 · {p.developer}
                      </p>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs text-slate-500">확정 분양가/m²</p>
                      <p className="text-sm font-bold text-blue-300">
                        {p.presalePrice && p.presalePriceNote === '확정'
                          ? `${(p.presalePrice/10000).toFixed(1)}억`
                          : <span className="text-slate-600">미확정</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DEMAND TAB ─── */}
      {tab === 'demand' && (
        <div className="space-y-6">

          {/* Key insight */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
            <p className="text-blue-200 font-semibold text-sm mb-1">수요 핵심 인사이트</p>
            <ul className="text-blue-300/80 text-xs space-y-0.5 list-disc list-inside leading-relaxed">
              <li>인구는 감소하지만 <strong className="text-blue-200">가구 수는 증가</strong> — 1인 가구 급증이 주택 수요 지지</li>
              <li>혼인건수 감소 ({latestDemog.marriages}천건) — 30대 매수 지연, 소형 수요 증가</li>
              <li>금리 인하 사이클 ({latestRate.baseRate}%) — 월 상환 부담 점진 완화</li>
              <li>PIR {latestPir.pir}배 — 중위 소득 가구가 서울 중위 아파트 구입에 {latestPir.pir.toFixed(0)}년치 소득 필요</li>
            </ul>
            <DataSource label="통계청·KB부동산·한국은행 보고서 기반 추정" isReal={false} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interest rates */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHeader title="금리 추이"
                badge={demand.marketSummary.liveRates
                  ? <RealBadge source="한국은행 ECOS API" />
                  : <EstBadge note="공개보고서 기반 · 최신 공표치 반영" />}
                sub="기준금리 & 주담대 금리 — 인하 사이클 진입" />
              <div className="overflow-x-auto"><div style={{ minWidth: 300 }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={rateChart} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 7]}
                    label={{ value: '금리 (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, dx: -8 }}
                    width={52} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                    formatter={(v: number, n: string) => [`${v.toFixed(2)}%`, n]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Line dataKey="기준금리"  stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line dataKey="주담대금리" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              </div></div>
            </div>

            {/* Sentiment */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHeader title="매수·가격 심리지수 (KB부동산)"
                badge={<EstBadge note="KB부동산 보고서 기반 · 실시간 아님" />}
                sub="100 = 중립 / 100 이상 = 매수 우위" />
              <div className="overflow-x-auto"><div style={{ minWidth: 300 }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sentimentChart} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[20, 160]}
                    label={{ value: '지수 (100=중립)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, dx: -8 }}
                    width={56} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 3"
                    label={{ value: '중립', fill: '#64748b', fontSize: 10 }} />
                  <Line dataKey="매수우위지수"  stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line dataKey="가격전망지수"  stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              </div></div>
            </div>

            {/* Affordability */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHeader title="주택구입부담 (PIR & 월 상환 비율)"
                badge={demand.marketSummary.livePir
                  ? <RealBadge source="국토교통부 실거래가 기반 실시간 계산" />
                  : <EstBadge note="한국부동산원·통계청 보고서 기반" />}
                sub={demand.marketSummary.livePir
                  ? 'PIR = 국토부 실거래 중위가격 ÷ 통계청 중위가구소득'
                  : 'PIR = 중위 아파트가 ÷ 중위 가구 연소득 (추정치)'} />
              <div className="overflow-x-auto"><div style={{ minWidth: 300 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={affordChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis yAxisId="pir" orientation="left" width={44} tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={v => `${v}배`} domain={[0, 40]} />
                  <YAxis yAxisId="burden" orientation="right" width={40} tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={v => `${v}%`} domain={[0, 80]} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <ReferenceLine yAxisId="burden" y={40} stroke="#ef4444" strokeDasharray="4 3"
                    label={{ value: '부담 임계', fill: '#ef4444', fontSize: 9 }} />
                  <Bar yAxisId="pir"    dataKey="PIR (배수)"       fill="#3b82f6" fillOpacity={0.8} radius={[3,3,0,0]} />
                  <Bar yAxisId="burden" dataKey="월 상환 부담 (%)" fill="#f59e0b" fillOpacity={0.8} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              </div></div>
              <p className="text-xs text-slate-500 mt-2">
                ※ PIR은 측정 방법에 따라 차이가 큼. 이 수치는 중위 아파트 실거래가 ÷ 서울 중위 가구 소득 기반 추정이며, 보수적 산출 방식입니다.
              </p>
            </div>

            {/* Demographics */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHeader title="서울 인구 vs 가구수"
                badge={<RealBadge source="통계청" />}
                sub="인구 감소에도 가구 수 증가 → 소형 주택 수요 지속" />
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={demogChart} margin={{ top: 5, right: 55, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis yAxisId="pop" orientation="left"  domain={[850, 1100]} tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={v => `${v}만`}
                    label={{ value: '인구 (만명)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9, dx: -8 }}
                    width={56} />
                  <YAxis yAxisId="hh"  orientation="right" domain={[350, 480]} tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={v => `${v}만`}
                    label={{ value: '가구수 (만)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 9, dx: 8 }}
                    width={52} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                    formatter={(v: number, n: string) => [`${v.toFixed(1)}만`, n]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Line yAxisId="pop" dataKey="인구" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line yAxisId="hh"  dataKey="가구수" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              {/* Buyer age distribution */}
              <div className="mt-4 flex items-center gap-4">
                <div className="shrink-0">
                  <p className="text-xs text-slate-400 mb-1">연령별 매수자 (2023)</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={demand.buyerAgeDistribution} dataKey="pct" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2}>
                        {demand.buyerAgeDistribution.map((_, i) => <Cell key={i} fill={AGE_COLORS[i]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1">
                  {demand.buyerAgeDistribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: AGE_COLORS[i] }} />
                      <span className="text-xs text-slate-400 w-10">{d.group}</span>
                      <span className="text-sm font-bold text-slate-200">{d.pct}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  30-40대 57% 차지. 30대 인구 감소 추세로 핵심 수요층 축소 예정.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
