'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { PriceTrend } from '@/types'
import { fmt, fmtPricePerM2 } from '@/lib/analysis'
import { MockBadge, QuotaRefreshAlert, RealBadge, SectionHeader } from '@/components/DataBadge'
import clsx from 'clsx'

// ── Policy constants (10·15 주택시장 안정화 대책, 2025.10.16 시행) ─
const POLICY_MONTH = '2025-10'
const POLICY_X     = '25-10'  // YY-MM axis format
const POLICY_LABEL = '10·15 대출규제'

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

// ── District configs ────────────────────────────────────────────
export interface DistrictConfig {
  lawdCd:      string
  name:        string   // e.g. '서초구'
  description: string   // brief market character
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

// ── Data shape ──────────────────────────────────────────────────
interface DistrictData {
  trends:     PriceTrend[]
  priceTiers: { month: string; under15: number; btw1525: number; over25: number; total: number }[]
  topApts:    { aptName: string; count: number; avgAmount: number; avgPricePerM2: number; maxAmount: number }[]
  prePolicy:  { avgMonthly: number; avgPrice: number; months: number }
  postPolicy: { avgMonthly: number; avgPrice: number; months: number }
  isMock:     boolean
}

// ── Helpers ─────────────────────────────────────────────────────
function RefLabel({ viewBox, value }: { viewBox?: { x: number; y: number }; value?: string }) {
  if (!viewBox) return null
  return (
    <text x={viewBox.x + 4} y={12} fill="#f59e0b" fontSize={10} fontWeight={600}>
      {value}
    </text>
  )
}

const TOOLTIP = {
  contentStyle: { background: '#1e293b', border: '1px solid #475569', borderRadius: 8 },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
}

// ── Main component ───────────────────────────────────────────────
export default function DistrictDeepDivePage({ lawdCd }: { lawdCd: string }) {
  const [data, setData] = useState<DistrictData | null>(null)

  const config = DISTRICT_CONFIGS[lawdCd] ?? {
    lawdCd,
    name:        lawdCd,
    description: '',
  }

  useEffect(() => {
    fetch(`/api/gangnam?lawdCd=${lawdCd}`).then(r => r.json()).then(setData)
  }, [lawdCd])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const volumeChange = data.prePolicy.avgMonthly && data.postPolicy.months > 0
    ? ((data.postPolicy.avgMonthly - data.prePolicy.avgMonthly) / data.prePolicy.avgMonthly * 100)
    : null

  const priceChange = data.prePolicy.avgPrice && data.postPolicy.months > 0
    ? ((data.postPolicy.avgPrice - data.prePolicy.avgPrice) / data.prePolicy.avgPrice * 100)
    : null

  const policyMonthInData = data.trends.some(t => t.month >= POLICY_MONTH)

  const latestTier = data.priceTiers.at(-1)
  const over25Pct  = latestTier && latestTier.total > 0
    ? Math.round(latestTier.over25 / latestTier.total * 100)
    : null

  // Chart data
  const volumeChart = data.trends.map(t => ({ month: t.month.slice(2), 거래량: t.transactionCount }))
  const priceChart  = data.trends.map(t => ({ month: t.month.slice(2), 평균거래가: t.avgPrice }))
  const tierChart   = data.priceTiers.map(t => ({
    month:       t.month.slice(2),
    '15억미만':  t.under15,
    '15–25억':   t.btw1525,
    '25억초과':  t.over25,
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-slate-100">{config.name} 심층 분석</h1>
          {data.isMock
            ? <MockBadge detail="모의 데이터 — 실제 정책 충격이 반영되지 않습니다. 자정 KST 이후 실제 데이터로 갱신됩니다." />
            : <RealBadge source="국토교통부" />}
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{config.description}</p>
        <p className="text-slate-500 text-xs mt-1">
          2025년 10월 16일 시행된 고가주택 주담대 상한제(10·15 대책)가
          거래량과 가격에 미친 영향을 실거래 데이터로 검증합니다.
        </p>
        {data.isMock && <QuotaRefreshAlert />}
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

      {/* Mock data notice */}
      {data.isMock && (
        <div className="bg-orange-950/20 border border-orange-800/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-400 mb-1">모의 데이터 한계 안내</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            현재 모의 데이터는 계절성·경기 주기는 반영하지만,
            <strong className="text-slate-300"> 10·15 대출규제에 따른 실제 거래량 급감 효과는 반영하지 않습니다.</strong>{' '}
            실제 데이터에서는 2025년 10월 이후 거래량 감소와 25억 초과 구간 거래 비중 변화가 나타납니다.
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            volumeChange !== null && volumeChange < -10 ? 'text-rose-400' : 'text-slate-200')}>
            {data.postPolicy.months > 0 ? `${data.postPolicy.avgMonthly}건` : '—'}
          </p>
          <p className="text-xs mt-1">
            {volumeChange !== null
              ? <span className={volumeChange < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {volumeChange > 0 ? '+' : ''}{volumeChange.toFixed(0)}% vs 규제 전
                </span>
              : <span className="text-slate-500">
                  {policyMonthInData ? `${data.postPolicy.months}개월 평균` : '데이터 대기 중'}
                </span>
            }
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">현재 평균 거래가</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {data.trends.at(-1) ? fmt(data.trends.at(-1)!.avgPrice) : '—'}
          </p>
          <p className="text-xs mt-1">
            {priceChange !== null
              ? <span className={priceChange > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}% 규제 전 대비
                </span>
              : <span className="text-slate-500">최근 1개월</span>
            }
          </p>
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

        {/* Volume chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="월별 거래량"
            badge={data.isMock ? <MockBadge /> : <RealBadge source="국토교통부" />}
            sub="수직선 = 10·15 대출규제 시행일 (2025.10.16)"
          />
          <div className="overflow-x-auto"><div style={{ minWidth: 300 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeChart} margin={{ top: 16, right: 4, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis width={36} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip {...TOOLTIP} formatter={(v: number) => [`${v}건`, '거래량']} />
              <ReferenceLine x={POLICY_X} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={2}
                label={<RefLabel value={POLICY_LABEL} />} />
              <Bar dataKey="거래량" radius={[2, 2, 0, 0]}>
                {volumeChart.map(d => (
                  <Cell key={d.month} fill={d.month >= POLICY_X ? '#f97316' : '#3b82f6'} />
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

        {/* Price trend */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="월별 평균 거래가"
            badge={data.isMock ? <MockBadge /> : <RealBadge source="국토교통부" />}
            sub="수직선 = 10·15 대출규제 시행일 (2025.10.16)"
          />
          <div className="overflow-x-auto"><div style={{ minWidth: 300 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={priceChart} margin={{ top: 16, right: 4, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis width={48} tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${(v / 10000).toFixed(0)}억`} />
              <Tooltip {...TOOLTIP}
                formatter={(v: number) => [`${fmt(v)}원`, '평균 거래가']} />
              <ReferenceLine x={POLICY_X} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={2}
                label={<RefLabel value={POLICY_LABEL} />} />
              <Line type="monotone" dataKey="평균거래가" stroke="#3b82f6"
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          </div></div>
        </div>
      </div>

      {/* Price tier stacked bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="월별 거래 가격대 분포 — 대출규제 구간별"
          badge={data.isMock ? <MockBadge /> : <RealBadge source="국토교통부" />}
          sub="10·15 대책 이후 25억 초과(2억 한도) 구간 거래 비중 변화를 확인합니다"
        />
        <div className="overflow-x-auto"><div style={{ minWidth: 400 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={tierChart} margin={{ top: 16, right: 4, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis width={36} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip {...TOOLTIP} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <ReferenceLine x={POLICY_X} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={2}
              label={<RefLabel value={POLICY_LABEL} />} />
            <Bar dataKey="15억미만" stackId="tier" fill="#3b82f6" />
            <Bar dataKey="15–25억"  stackId="tier" fill="#f59e0b" />
            <Bar dataKey="25억초과" stackId="tier" fill="#f87171" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div></div>
        <p className="text-[10px] text-slate-600 mt-2">
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
                    {volumeChange !== null
                      ? <span className={clsx('font-semibold', volumeChange < 0 ? 'text-rose-400' : 'text-emerald-400')}>
                          {volumeChange > 0 ? '+' : ''}{volumeChange.toFixed(0)}%
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
                    {priceChange !== null
                      ? <span className={priceChange > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
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
              히스토리 백필이 완료되면 규제 후 수치가 표시됩니다.
            </p>
          )}
        </div>
      )}

      {/* Top apartments */}
      {data.topApts.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title={`${config.name} 주요 단지 거래 현황`}
            badge={data.isMock ? <MockBadge /> : <RealBadge source="국토교통부" />}
            sub="분석 기간 내 거래량 기준 상위 단지"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2 pr-3 text-left text-slate-400 font-semibold">단지명</th>
                  <th className="py-2 pr-3 text-right text-slate-400 font-semibold">거래건수</th>
                  <th className="py-2 pr-3 text-right text-slate-400 font-semibold">평균 거래가</th>
                  <th className="py-2 pr-3 text-right text-slate-400 font-semibold">최고 거래가</th>
                  <th className="py-2 text-right text-slate-400 font-semibold">평균 m²당</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.topApts.map(apt => (
                  <tr key={apt.aptName} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2 pr-3 font-medium text-slate-200">{apt.aptName}</td>
                    <td className="py-2 pr-3 text-right text-slate-300">{apt.count}건</td>
                    <td className="py-2 pr-3 text-right text-amber-400">{fmt(apt.avgAmount)}원</td>
                    <td className={clsx('py-2 pr-3 text-right',
                      apt.maxAmount >= 250000 ? 'text-rose-400' : 'text-slate-300')}>
                      {fmt(apt.maxAmount)}원
                      {apt.maxAmount >= 250000 && (
                        <span className="ml-1 text-[9px] text-rose-500">2억 한도</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-slate-400">{fmtPricePerM2(apt.avgPricePerM2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            최고 거래가 25억원 이상 단지는 주담대 한도 2억원(10·15 대책) 구간에 해당
          </p>
        </div>
      )}

    </div>
  )
}
