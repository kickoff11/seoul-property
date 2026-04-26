'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell,
} from 'recharts'
import {
  DemographicPoint, SentimentPoint, InterestRatePoint, AffordabilityPoint,
} from '@/types'
import MetricCard from '@/components/MetricCard'
import { RealBadge, EstBadge, SectionHeader, DataSource } from '@/components/DataBadge'
import clsx from 'clsx'

interface DemandApiData {
  demographics:         DemographicPoint[]
  sentiment:            SentimentPoint[]
  interestRates:        InterestRatePoint[]
  affordability:        AffordabilityPoint[]
  buyerAgeDistribution: { group: string; pct: number }[]
  marketSummary:        Record<string, string>
}

const AGE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function DemandPage() {
  const [data, setData] = useState<DemandApiData | null>(null)

  useEffect(() => {
    fetch('/api/demand').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const latest = data.sentiment[data.sentiment.length - 1]
  const latestRate = data.interestRates[data.interestRates.length - 1]
  const latestPir = data.affordability[data.affordability.length - 1]
  const latestDemog = data.demographics[data.demographics.length - 1]
  const prevDemog = data.demographics[data.demographics.length - 2]

  const sentimentLabel = latest.buyerSentiment > 100 ? '매수 우위' : latest.buyerSentiment > 70 ? '중립 회복' : '매도 우위'
  const sentimentColor = latest.buyerSentiment > 100 ? 'text-rose-400' : latest.buyerSentiment > 70 ? 'text-amber-400' : 'text-emerald-400'

  // Diverging chart: population goes down, households go up
  const demogChart = data.demographics.map(d => ({
    year: d.year,
    인구: d.population,
    가구수: d.households,
    '1인가구비율': d.singleHouseholdPct,
    혼인건수: d.marriages,
  }))

  const sentimentChart = data.sentiment.map(s => ({
    month: s.month.slice(2),
    '매수우위지수': s.buyerSentiment,
    '가격전망지수': s.priceExpectation,
  }))

  const rateChart = data.interestRates.map(r => ({
    month: r.month.slice(2),
    '기준금리': r.baseRate,
    '주담대금리': r.mortgageRate,
  }))

  const affordChart = data.affordability.map(a => ({
    year: a.year,
    'PIR (배수)': a.pir,
    '월 상환 부담 (%)': a.monthlyBurden,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">수요 분석 — 인구·심리·금리·구매력</h1>
        <p className="text-slate-400 text-sm mt-1">
          통계청·KB부동산·한국은행·한국부동산원 데이터 기반
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <RealBadge source="인구·가구수 — 통계청" />
          <EstBadge note="심리·금리·PIR — 공개보고서 기반, 실시간 아님" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="서울 인구 (2024)"
          value={`${latestDemog.population.toFixed(0)}만명`}
          sub={`전년比 ${((latestDemog.population - prevDemog.population) / prevDemog.population * 100).toFixed(1)}%`}
          source="통계청"
        />
        <MetricCard
          title="서울 가구수 (2024)"
          value={`${latestDemog.households.toFixed(0)}만 가구`}
          sub="1인 가구 36.3%"
          source="통계청"
        />
        <MetricCard
          title="매수심리지수"
          value={`${latest.buyerSentiment}`}
          sub={<span className={sentimentColor}>{sentimentLabel}</span> as unknown as string}
          highlight
          source="KB부동산 추정" sourceReal={false}
        />
        <MetricCard
          title="주담대 금리"
          value={`${latestRate.mortgageRate}%`}
          sub={`기준금리 ${latestRate.baseRate}%`}
          source="한국은행 보고서 기반" sourceReal={false}
        />
      </div>

      {/* Key insight banner */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4 flex items-start gap-3">
        <span className="text-blue-400 text-xl mt-0.5">💡</span>
        <div className="space-y-1 text-sm">
          <p className="text-blue-200 font-semibold">수요 핵심 인사이트</p>
          <ul className="text-blue-300/80 space-y-0.5 list-disc list-inside text-xs">
            <li>인구는 감소하지만 <strong className="text-blue-200">가구 수는 증가</strong> — 1인 가구 급증이 주택 수요를 견인</li>
            <li>혼인건수 급감 ({latestDemog.marriages}천 건) — 30대 주거 수요 지연, but 소형 면적 수요 증가</li>
            <li>금리 인하 사이클 진입 ({latestRate.baseRate}%) — 월 상환 부담 완화 → 매수심리 회복 중</li>
            <li>PIR {latestPir.pir}배 — 중위소득 가구가 중위가격 아파트 구입에 {latestPir.pir.toFixed(0)}년치 소득 필요, 여전히 부담</li>
          </ul>
        </div>
      </div>

      {/* Demographics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Population vs Households */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader title="서울 인구 vs 가구수" badge={<RealBadge source="통계청" />} sub="인구 감소에도 가구 수 증가 → 주택 수요 지속" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={demogChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="pop" orientation="left" tick={{ fill: '#94a3b8', fontSize: 10 }}
                domain={[850, 1100]} tickFormatter={v => `${v}만`} />
              <YAxis yAxisId="hh" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }}
                domain={[350, 480]} tickFormatter={v => `${v}만`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number, name: string) => [`${v.toFixed(1)}만`, name]} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Line yAxisId="pop" dataKey="인구" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line yAxisId="hh"  dataKey="가구수" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 1인 가구 + 혼인 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader title="1인 가구 비율 & 혼인건수 추이" badge={<RealBadge source="통계청" />} sub="소형 평형 수요↑ / 30대 주택 구매 지연" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={demogChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="single" orientation="left" domain={[20, 42]}
                tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <YAxis yAxisId="mar" orientation="right" domain={[25, 75]}
                tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}천`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number, name: string) => [
                  name === '1인가구비율' ? `${v.toFixed(1)}%` : `${v.toFixed(1)}천 건`, name
                ]} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Line yAxisId="single" dataKey="1인가구비율" stroke="#a78bfa" strokeWidth={2} dot={false} />
              <Line yAxisId="mar"    dataKey="혼인건수"    stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interest rates + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interest rates */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader title="금리 추이" badge={<EstBadge note="공개보고서 기반 · 실시간 아님" />} sub="기준금리 & 주담대 금리 — 인하 사이클 진입" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rateChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={2} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 7]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name]} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Line dataKey="기준금리"  stroke="#10b981" strokeWidth={2} dot={false} />
              <Line dataKey="주담대금리" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Buyer sentiment */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader title="매수·가격 심리지수 (KB부동산)" badge={<EstBadge note="KB부동산 보고서 기반 · 실시간 아님" />} sub="100 = 중립 / 100 이상 = 매수 우위 / 이하 = 매도 우위" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sentimentChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} interval={2} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[20, 160]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 3" label={{ value: '중립', fill: '#64748b', fontSize: 10 }} />
              <Line dataKey="매수우위지수"  stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line dataKey="가격전망지수"  stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Affordability + Age distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Affordability */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader title="주택구입부담 (PIR & 월 상환 비율)" badge={<EstBadge note="한국부동산원·통계청 보고서 기반" />} sub="PIR = 중위 아파트가 ÷ 중위 가구 연소득 / 상환 비율 = 월 원리금 ÷ 월 소득" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={affordChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="pir" orientation="left" tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${v}배`} domain={[0, 40]} />
              <YAxis yAxisId="burden" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${v}%`} domain={[0, 80]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <ReferenceLine yAxisId="burden" y={40} stroke="#ef4444" strokeDasharray="4 3"
                label={{ value: '부담 임계 (40%)', fill: '#ef4444', fontSize: 10 }} />
              <Bar yAxisId="pir"    dataKey="PIR (배수)"       fill="#3b82f6" fillOpacity={0.8} radius={[3,3,0,0]} />
              <Bar yAxisId="burden" dataKey="월 상환 부담 (%)" fill="#f59e0b" fillOpacity={0.8} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Buyer age + breakdown */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader title="연령대별 아파트 구매자 비중 (2023)" badge={<EstBadge note="국토교통부 실거래가 보고서 기반" />} sub="30-40대가 전체의 57%를 차지 — 핵심 수요층" />
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={data.buyerAgeDistribution}
                  dataKey="pct" nameKey="group"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                >
                  {data.buyerAgeDistribution.map((_, i) => (
                    <Cell key={i} fill={AGE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  formatter={(v: number) => [`${v}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {data.buyerAgeDistribution.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: AGE_COLORS[i] }} />
                  <span className="text-xs text-slate-300 w-12">{d.group}</span>
                  <span className="text-sm font-bold text-slate-200">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400 space-y-1">
            <p><span className="text-amber-400 font-semibold">30대 인구 감소 추세:</span> 베이비부머 자녀 세대 감소로 핵심 수요층 축소 예정</p>
            <p><span className="text-blue-400 font-semibold">60대+ 매수 비중 증가:</span> 자산 이전·다운사이징 수요 증가</p>
          </div>
        </div>
      </div>
    </div>
  )
}
