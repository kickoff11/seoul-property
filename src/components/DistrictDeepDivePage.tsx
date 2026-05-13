'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { PriceTrend } from '@/types'
import { fmt, fmtPricePerM2 } from '@/lib/analysis'
import { RealBadge, SectionHeader } from '@/components/DataBadge'
import clsx from 'clsx'

// ── Policy events shown as reference lines on the charts ─────────
// Short-form month is the x-axis key (YY-MM); fullMonth is used to
// decide which events fall within a chart's visible date range.
const POLICY_EVENTS = [
  { month: '17-08', fullMonth: '2017-08', label: '8·2 대책',        color: '#ef4444', side: 'left'  },
  { month: '19-12', fullMonth: '2019-12', label: '12·16 대책',      color: '#ef4444', side: 'left'  },
  { month: '20-07', fullMonth: '2020-07', label: '7·10 대책',       color: '#ef4444', side: 'left'  },
  { month: '22-06', fullMonth: '2022-06', label: '규제 완화',        color: '#34d399', side: 'left'  },
  { month: '25-10', fullMonth: '2025-10', label: '10·15 대출규제',   color: '#f59e0b', side: 'right' },
  { month: '26-05', fullMonth: '2026-05', label: '양도세 면제 종료', color: '#f97316', side: 'right' },
]

const TIERS = [
  {
    label:  '25억원 초과',
    cap:    '대출 한도 2억원 (~USD 150k)',
    note:   '최고가 강남권 아파트 주요 구간',
    color:  'text-rose-400',
    border: 'border-rose-800/40',
    bg:     'bg-rose-950/20',
    impact: '현금 또는 극소수 고신용자만 매수 가능',
  },
  {
    label:  '15–25억원',
    cap:    '대출 한도 4억원 (~USD 290k)',
    note:   '서울 주요 지역 중형 아파트 구간',
    color:  'text-amber-400',
    border: 'border-amber-800/40',
    bg:     'bg-amber-950/20',
    impact: '실수요자 진입 대폭 제한',
  },
  {
    label:  '15억원 이하',
    cap:    '대출 한도 6억원',
    note:   '상대적으로 규제 영향 낮은 구간',
    color:  'text-emerald-400',
    border: 'border-emerald-800/40',
    bg:     'bg-emerald-950/20',
    impact: '실수요자 일부 여전히 진입 가능',
  },
]

export interface DistrictConfig {
  lawdCd:      string
  name:        string
  description: string
}

export const DISTRICT_CONFIGS: Record<string, DistrictConfig> = {
  '11680': {
    lawdCd:      '11680',
    name:        '강남구',
    description: '서울 최고가 지역. 타워팰리스·래미안대치팰리스 등 초고가 단지 밀집. 대부분 거래가 25억 초과로 2억 한도 구간 해당.',
  },
  '11650': {
    lawdCd:      '11650',
    name:        '서초구',
    description: '아크로리버파크·래미안퍼스티지 등 한강변 프리미엄 단지. 반포·서초 재건축 수요 지속. 강남구에 이은 서울 2위 고가 지역.',
  },
  '11170': {
    lawdCd:      '11170',
    name:        '용산구',
    description: '한남더힐·나인원한남 등 초고가 단지와 이촌동 한강변 아파트 혼재. 대통령실 이전 이후 프리미엄 급등. 외국인·법인 수요 강함.',
  },
  '11200': {
    lawdCd:      '11200',
    name:        '성동구',
    description: '성수동 서울숲 인근 신고가 행진. 헬리오시티·왕십리자이 등 대단지. 강남 진입 전 수요층의 선택지로 최근 가격 급등.',
  },
  '11710': {
    lawdCd:      '11710',
    name:        '송파구',
    description: '잠실 헬리오시티·엘스·리센츠·트리지움 등 국내 최대 규모 단지군. 학군·교통·상권 3박자. 거래량 서울 최상위권.',
  },
}

interface DistrictData {
  trends:               PriceTrend[]
  priceTiers:           { month: string; under15: number; btw1525: number; over25: number; total: number }[]
  topApts:              { aptName: string; countBefore: number; countAfter: number; monthsBefore: number; monthsAfter: number; avgAmountBefore: number | null; avgAmountAfter: number | null; maxAmount: number }[]
  topAptsWindowMonths:  number
  prePolicy:            { avgMonthly: number; avgPrice: number; months: number }
  postPolicy:           { avgMonthly: number; avgPrice: number; months: number }
}

// ── Chart helpers ────────────────────────────────────────────────

// Uses <foreignObject> so the label text is HTML — Google Translate can read it,
// unlike SVG <text> elements which Translate ignores.
// alignRight=true flips the label to the LEFT of the line (prevents edge clipping).
function RefLabel({
  viewBox, value, fill = '#f59e0b', yOffset = 12, alignRight = false,
}: {
  viewBox?: { x: number; y: number }
  value?: string
  fill?: string
  yOffset?: number
  alignRight?: boolean
}) {
  if (!viewBox) return null
  const w = 120
  const x = alignRight ? viewBox.x - w - 2 : viewBox.x + 4
  return (
    <foreignObject x={x} y={yOffset - 12} width={w} height={18} overflow="visible">
      <span style={{
        display: 'block',
        color: fill,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        textAlign: alignRight ? 'right' : 'left',
      }}>
        {value}
      </span>
    </foreignObject>
  )
}

// Returns ReferenceLine elements for policy events within a chart's date range.
// Recharts requires ReferenceLine to be direct children of the chart — do not
// wrap this call in a custom component or Recharts will ignore the lines.
function policyLines(earliest: string, latest: string, alternateY = false) {
  return POLICY_EVENTS
    .filter(e => e.month >= earliest && e.month <= latest)
    .map((e, i) => (
      <ReferenceLine
        key={e.month}
        x={e.month}
        stroke={e.color}
        strokeDasharray="4 2"
        strokeWidth={1.5}
        label={
          <RefLabel
            value={e.label}
            fill={e.color}
            yOffset={alternateY ? (i % 2 === 0 ? 12 : 24) : 12}
            alignRight={e.side === 'right'}
          />
        }
      />
    ))
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #475569', borderRadius: 8 },
  labelStyle:   { color: '#94a3b8' },
  itemStyle:    { color: '#e2e8f0' },
}

// Custom tooltip for the volume chart — adds month-over-month percentage.
function VolumeTooltip({
  active, payload, label,
}: {
  active?: boolean
  payload?: { payload: { 거래량: number; momPct: number | null } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-600 px-3 py-2 text-xs" style={{ background: '#1e293b' }}>
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-slate-100 font-semibold">{d.거래량.toLocaleString()}건</p>
      {d.momPct !== null && d.momPct !== undefined && (
        <p className={clsx('mt-0.5', d.momPct >= 0 ? 'text-rose-400' : 'text-emerald-400')}>
          전월 대비 {d.momPct >= 0 ? '+' : ''}{d.momPct}%
        </p>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function DistrictDeepDivePage({ lawdCd }: { lawdCd: string }) {
  const [data, setData] = useState<DistrictData | null>(null)

  const config = DISTRICT_CONFIGS[lawdCd] ?? { lawdCd, name: lawdCd, description: '' }

  useEffect(() => {
    fetch(`/api/gangnam?lawdCd=${lawdCd}`).then(r => r.json()).then(setData)
  }, [lawdCd])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Derived values ─────────────────────────────────────────────

  const POLICY_MONTH = '2025-10'
  const policyMonthInData = data.trends.some(t => t.month >= POLICY_MONTH)

  const preMonths  = data.trends.filter(t => t.month < POLICY_MONTH)
  const postMonths = data.trends.filter(t => t.month >= POLICY_MONTH)

  const volumeChange = preMonths.length && postMonths.length
    ? ((postMonths.at(-1)!.transactionCount - preMonths.at(-1)!.transactionCount)
       / preMonths.at(-1)!.transactionCount * 100)
    : null

  // Pre/post policy averages
  function avg(arr: number[]) {
    return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
  }
  const preAvgVolume  = avg(preMonths.map(t => t.transactionCount))
  const postAvgVolume = avg(postMonths.map(t => t.transactionCount))
  const preAvgPrice   = avg(preMonths.map(t => t.avgPrice))
  const postAvgPrice  = avg(postMonths.map(t => t.avgPrice))

  const volumeChangePct = preAvgVolume && postMonths.length
    ? ((postAvgVolume - preAvgVolume) / preAvgVolume * 100) : null
  const priceChangePct = preAvgPrice && postMonths.length
    ? ((postAvgPrice - preAvgPrice) / preAvgPrice * 100) : null

  const latestTier  = data.priceTiers.at(-1)
  const over25Pct   = latestTier?.total
    ? Math.round(latestTier.over25 / latestTier.total * 100) : null

  // Month-over-month velocity for the volume chart
  const volumeChart = data.trends.map((t, i) => {
    const prev = data.trends[i - 1]
    const momPct = prev && prev.transactionCount > 0
      ? Math.round((t.transactionCount - prev.transactionCount) / prev.transactionCount * 100)
      : null
    return { month: t.month.slice(2), 거래량: t.transactionCount, momPct }
  })

  // Latest month MoM change for the KPI card
  const latestMoM = volumeChart.at(-1)?.momPct ?? null

  // 12-month rolling average for the price chart
  const priceChart = data.trends.map((t, i) => {
    const window12 = data.trends.slice(Math.max(0, i - 11), i + 1)
    const avg12m   = Math.round(window12.reduce((s, w) => s + w.avgPrice, 0) / window12.length)
    return { month: t.month.slice(2), 평균거래가: t.avgPrice, '12개월평균': avg12m }
  })

  // Latest price deviation from its 12-month average
  const latestPrice  = priceChart.at(-1)
  const priceVs12m   = latestPrice
    ? Math.round((latestPrice.평균거래가 - latestPrice['12개월평균']) / latestPrice['12개월평균'] * 100)
    : null

  const tierChart = data.priceTiers.map(t => ({
    month:       t.month.slice(2),
    '15억미만':  t.under15,
    '15–25억':   t.btw1525,
    '25억초과':  t.over25,
  }))

  // X-axis range helpers for reference lines
  const trendFirst = volumeChart.at(0)?.month ?? '00-01'
  const trendLast  = volumeChart.at(-1)?.month ?? '99-12'
  const tierFirst  = tierChart.at(0)?.month  ?? '00-01'
  const tierLast   = tierChart.at(-1)?.month ?? '99-12'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-slate-100">{config.name} 심층 분석</h1>
          <RealBadge source="국토교통부" />
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{config.description}</p>
        <p className="text-slate-500 text-xs mt-1">
          2025년 10월 16일 시행된 고가주택 주담대 상한제(10·15 대책)가
          거래량과 가격에 미친 영향을 실거래 데이터로 검증합니다.
        </p>
      </div>

      {/* Policy explainer */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="mb-3">
          <p className="text-xs font-semibold text-amber-500/80 uppercase tracking-wide mb-0.5">
            10·15 주택시장 안정화 대책 · 2025.10.16 시행
          </p>
          <p className="text-sm font-semibold text-slate-200">
            주택 가격에 따른 3단계 주담대 상한 — 고가 단지일수록 대출 한도 급감
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIERS.map(tier => (
            <div key={tier.label} className={clsx('rounded-xl border p-4', tier.bg, tier.border)}>
              <p className={clsx('text-base font-bold', tier.color)}>{tier.label}</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">{tier.cap}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tier.note}</p>
              <p className={clsx('text-[11px] mt-2 font-medium', tier.color)}>{tier.impact}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-3">
          출처: 금융위원회 10·15 주택시장 안정화 대책 보도자료 · 전 서울 투기과열지구 지정 포함
        </p>
      </div>

      {/* KPI cards — 6 cards including MoM velocity and 12-month deviation */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">규제 전 월평균 거래량</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {data.prePolicy.avgMonthly > 0 ? `${data.prePolicy.avgMonthly}건` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data.prePolicy.months > 0 ? `최근 ${data.prePolicy.months}개월 평균` : '데이터 없음'}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">규제 후 월평균 거래량</p>
          <p className={clsx('text-2xl font-bold mt-1',
            volumeChangePct !== null && volumeChangePct < -10 ? 'text-rose-400' : 'text-slate-200')}>
            {data.postPolicy.months > 0 ? `${data.postPolicy.avgMonthly}건` : '—'}
          </p>
          <p className="text-xs mt-1">
            {volumeChangePct !== null
              ? <span className={volumeChangePct < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {volumeChangePct > 0 ? '+' : ''}{volumeChangePct.toFixed(0)}% vs 규제 전
                </span>
              : <span className="text-slate-500">
                  {policyMonthInData ? `${data.postPolicy.months}개월 평균` : '데이터 대기 중'}
                </span>
            }
          </p>
        </div>

        {/* NEW: Month-over-month velocity */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">거래량 전월 대비</p>
          <p className={clsx('text-2xl font-bold mt-1',
            latestMoM === null ? 'text-slate-400'
            : latestMoM >= 0   ? 'text-rose-400'
            : 'text-emerald-400')}>
            {latestMoM !== null ? `${latestMoM >= 0 ? '+' : ''}${latestMoM}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">최신 1개월 기준 · 양수 = 거래 증가</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">현재 평균 거래가</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {data.trends.at(-1) ? fmt(data.trends.at(-1)!.avgPrice) : '—'}
          </p>
          <p className="text-xs mt-1">
            {priceChangePct !== null
              ? <span className={priceChangePct > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {priceChangePct > 0 ? '+' : ''}{priceChangePct.toFixed(1)}% 규제 전 대비
                </span>
              : <span className="text-slate-500">최근 1개월</span>
            }
          </p>
        </div>

        {/* NEW: Price vs 12-month rolling average */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">현재가 vs 12개월 평균</p>
          <p className={clsx('text-2xl font-bold mt-1',
            priceVs12m === null ? 'text-slate-400'
            : priceVs12m > 5    ? 'text-rose-400'
            : priceVs12m < -5   ? 'text-emerald-400'
            : 'text-slate-200')}>
            {priceVs12m !== null ? `${priceVs12m >= 0 ? '+' : ''}${priceVs12m}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">1년 평균 대비 고평가(+) / 저평가(-)</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">25억 초과 거래 비중</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {over25Pct !== null ? `${over25Pct}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">최근 1개월 · 2억 한도 적용 구간</p>
        </div>

      </div>

      {/* Volume + Price charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Volume chart with MoM tooltip and all policy markers */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="월별 거래량"
            badge={<RealBadge source="국토교통부" />}
            sub="수직선 = 주요 부동산 정책 시행일 · 막대 위에 올리면 전월 대비 변화율 표시"
          />
          <div className="overflow-x-auto"><div style={{ minWidth: 300 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeChart} margin={{ top: 20, right: 4, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis width={36} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip content={<VolumeTooltip />} />
              {policyLines(trendFirst, trendLast, true)}
              <Bar dataKey="거래량" radius={[2, 2, 0, 0]}>
                {volumeChart.map(d => (
                  <Cell key={d.month} fill={d.month >= '25-10' ? '#f97316' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div></div>
          <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
            <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1" />규제 전</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />규제 후</span>
          </div>
        </div>

        {/* Price chart with 12-month rolling average and policy markers */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="월별 평균 거래가"
            badge={<RealBadge source="국토교통부" />}
            sub="파란선 = 실제 거래가 · 회색 점선 = 12개월 이동평균"
          />
          <div className="overflow-x-auto"><div style={{ minWidth: 300 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={priceChart} margin={{ top: 20, right: 4, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis width={48} tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${(v / 10000).toFixed(0)}억`} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: number, name: string) => [
                  `${fmt(v)}원`,
                  name === '12개월평균' ? '12개월 이동평균' : '평균 거래가',
                ]}
              />
              {policyLines(trendFirst, trendLast, true)}
              <Line type="monotone" dataKey="평균거래가" stroke="#3b82f6"
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="12개월평균" stroke="#64748b"
                strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          </div></div>
        </div>
      </div>

      {/* Price tier stacked bar with full historical policy markers */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="월별 거래 가격대 분포 — 대출규제 구간별"
          badge={<RealBadge source="국토교통부" />}
          sub="수직선 = 주요 정책 시행일 (적색=규제 강화, 녹색=규제 완화, 황색=현행 대출상한제)"
        />
        <div className="overflow-x-auto"><div style={{ minWidth: 400 }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={tierChart} margin={{ top: 28, right: 4, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis width={36} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            {policyLines(tierFirst, tierLast, true)}
            <Bar dataKey="15억미만" stackId="tier" fill="#34d399" />
            <Bar dataKey="15–25억"  stackId="tier" fill="#f59e0b" />
            <Bar dataKey="25억초과" stackId="tier" fill="#f87171" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div></div>
        <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-slate-500">
          <span><span className="inline-block w-3 h-0.5 bg-red-500 mr-1 align-middle" />규제 강화 (8·2, 12·16, 7·10)</span>
          <span><span className="inline-block w-3 h-0.5 bg-emerald-500 mr-1 align-middle" />규제 완화 (2022.06)</span>
          <span><span className="inline-block w-3 h-0.5 bg-amber-400 mr-1 align-middle" />현행 10·15 대출규제</span>
          <span><span className="inline-block w-3 h-0.5 bg-orange-400 mr-1 align-middle" />양도세 면제 종료 (2026.05)</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          15억 = 주담대 6억 한도 구간 경계 · 25억 = 주담대 2억 한도 구간 경계
        </p>
      </div>

      {/* Pre/post comparison table */}
      {(data.prePolicy.months > 0 || data.postPolicy.months > 0) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title={`규제 전후 ${config.name} 시장 비교`}
            sub="10·15 대책(2025.10.16) 기준 · 월평균"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2 pr-6 text-left text-slate-400 font-semibold">지표</th>
                  <th className="py-2 pr-6 text-right text-slate-400 font-semibold">
                    규제 전 ({data.prePolicy.months}개월 평균)
                  </th>
                  <th className="py-2 pr-6 text-right text-slate-400 font-semibold">
                    규제 후 ({data.postPolicy.months > 0 ? `${data.postPolicy.months}개월 평균` : '대기 중'})
                  </th>
                  <th className="py-2 text-right text-slate-400 font-semibold">변화</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                <tr>
                  <td className="py-3 pr-6 text-slate-300">월평균 거래량</td>
                  <td className="py-3 pr-6 text-right text-slate-200">{data.prePolicy.avgMonthly}건</td>
                  <td className="py-3 pr-6 text-right text-slate-200">
                    {data.postPolicy.months > 0 ? `${data.postPolicy.avgMonthly}건` : '—'}
                  </td>
                  <td className="py-3 text-right">
                    {volumeChangePct !== null
                      ? <span className={clsx('font-semibold', volumeChangePct < 0 ? 'text-rose-400' : 'text-emerald-400')}>
                          {volumeChangePct > 0 ? '+' : ''}{volumeChangePct.toFixed(0)}%
                        </span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-6 text-slate-300">월평균 거래가</td>
                  <td className="py-3 pr-6 text-right text-slate-200">{fmt(data.prePolicy.avgPrice)}원</td>
                  <td className="py-3 pr-6 text-right text-slate-200">
                    {data.postPolicy.months > 0 ? `${fmt(data.postPolicy.avgPrice)}원` : '—'}
                  </td>
                  <td className="py-3 text-right">
                    {priceChangePct !== null
                      ? <span className={priceChangePct > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {priceChangePct > 0 ? '+' : ''}{priceChangePct.toFixed(1)}%
                        </span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {!policyMonthInData && (
            <p className="text-xs text-slate-500 mt-3">
              규제 시행일(2025년 10월) 이후 데이터가 아직 로드되지 않았습니다.
            </p>
          )}
        </div>
      )}

      {/* Top apartments */}
      {data.topApts.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title={`${config.name} 주요 단지 — 10·15 규제 전후 거래량 비교`}
            badge={<RealBadge source="국토교통부" />}
            sub={`규제 전 ${data.topAptsWindowMonths}개월 vs 규제 후 ${data.topAptsWindowMonths}개월 동일 기간 비교 · 규제 전 월평균 거래량 순 정렬`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2 pr-3 text-left text-slate-400 font-semibold">단지명</th>
                  <th className="py-2 pr-3 text-right text-slate-400 font-semibold">규제 전<br/><span className="font-normal text-slate-600">월평균</span></th>
                  <th className="py-2 pr-3 text-right text-slate-400 font-semibold">규제 후<br/><span className="font-normal text-slate-600">월평균</span></th>
                  <th className="py-2 pr-3 text-right text-slate-400 font-semibold">거래량<br/><span className="font-normal text-slate-600">변화</span></th>
                  <th className="py-2 pr-3 text-right text-slate-400 font-semibold">규제 전<br/><span className="font-normal text-slate-600">평균가</span></th>
                  <th className="py-2 text-right text-slate-400 font-semibold">규제 후<br/><span className="font-normal text-slate-600">평균가</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.topApts.map(apt => {
                  const mBefore = apt.monthsBefore || 1
                  const mAfter  = apt.monthsAfter  || 1
                  const avgBefore = apt.countBefore / mBefore
                  const avgAfter  = apt.countAfter  / mAfter
                  const volChangePct = avgBefore > 0
                    ? Math.round((avgAfter - avgBefore) / avgBefore * 100)
                    : null
                  return (
                    <tr key={apt.aptName} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-2 pr-3 font-medium text-slate-200">
                        {apt.aptName}
                        {apt.maxAmount >= 250000 && (
                          <span className="ml-1 text-[9px] text-rose-500">2억한도</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right text-blue-400">
                        {avgBefore.toFixed(1)}건
                      </td>
                      <td className="py-2 pr-3 text-right text-orange-400">
                        {avgAfter.toFixed(1)}건
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {volChangePct !== null
                          ? <span className={clsx('font-semibold', volChangePct < 0 ? 'text-rose-400' : 'text-emerald-400')}>
                              {volChangePct > 0 ? '+' : ''}{volChangePct}%
                            </span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-2 pr-3 text-right text-slate-300">
                        {apt.avgAmountBefore ? fmt(Math.round(apt.avgAmountBefore)) : '—'}
                      </td>
                      <td className={clsx('py-2 text-right',
                        apt.avgAmountAfter && apt.avgAmountAfter < (apt.avgAmountBefore ?? 0)
                          ? 'text-emerald-400' : 'text-slate-300')}>
                        {apt.avgAmountAfter ? fmt(Math.round(apt.avgAmountAfter)) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            완료된 개월 수 기준 양측 동일 기간 · 매월 자동 확장 ·
            규제 후 평균가 하락 단지 초록색 표시 · 2억한도 = 최고 거래가 25억 이상(10·15 대책)
          </p>
        </div>
      )}

    </div>
  )
}
