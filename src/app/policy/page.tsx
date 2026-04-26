'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { EstBadge, SectionHeader } from '@/components/DataBadge'
import {
  HousingPolicy, MarketScenario,
  POLICY_STATUS_LABEL, POLICY_STATUS_COLOR,
  PRICE_IMPACT_LABEL, PRICE_IMPACT_COLOR,
} from '@/lib/policy-data'

interface PolicyData {
  policies:  HousingPolicy[]
  scenarios: MarketScenario[]
}

const CATEGORY_LABEL: Record<string, string> = {
  demand_suppression: '수요 억제',
  supply_boost:       '공급 확대',
  market_diversion:   '자금 분산',
  renter_protection:  '임차인 보호',
  financing:          '대출 규제',
}

const CERTAINTY_LABEL: Record<string, string> = {
  high:   '효과 확실',
  medium: '효과 불확실',
  low:    '효과 미지수',
}
const CERTAINTY_COLOR: Record<string, string> = {
  high:   'text-emerald-400',
  medium: 'text-amber-400',
  low:    'text-slate-500',
}

function PolicyCard({ policy }: { policy: HousingPolicy }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold border', POLICY_STATUS_COLOR[policy.status])}>
                {POLICY_STATUS_LABEL[policy.status]}
              </span>
              <span className="text-xs text-slate-500">{CATEGORY_LABEL[policy.category]}</span>
              <span className={clsx('text-xs font-semibold ml-auto', PRICE_IMPACT_COLOR[policy.priceImpact])}>
                {PRICE_IMPACT_LABEL[policy.priceImpact]}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100">{policy.name}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{policy.goal}</p>
          </div>
          <span className="text-slate-600 text-xs shrink-0 mt-1">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-700/50 px-4 py-4 bg-slate-900/30 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">작동 방식</p>
            <p className="text-xs text-slate-300 leading-relaxed">{policy.mechanism}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">완전 시행 시 가격 효과</p>
            <p className="text-xs text-slate-300 leading-relaxed">{policy.ifSuccess}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">현재 증거</p>
            <p className="text-xs text-slate-400 leading-relaxed">{policy.evidence}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">효과 발현 시점</p>
              <p className="text-xs text-slate-400">{policy.timelineNote}</p>
            </div>
            <span className={clsx('text-xs font-semibold', CERTAINTY_COLOR[policy.certainty])}>
              {CERTAINTY_LABEL[policy.certainty]}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PolicyPage() {
  const [data, setData] = useState<PolicyData | null>(null)

  useEffect(() => {
    fetch('/api/policy').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const bearish = data.policies.filter(p => p.priceImpact === 'bearish')
  const bullish = data.policies.filter(p => p.priceImpact === 'bullish')
  const mixed   = data.policies.filter(p => p.priceImpact === 'mixed' || p.priceImpact === 'neutral')

  // Policy impact score for first-time buyers
  const bearishConfirmed = bearish.filter(p => p.status === 'evidenced').length
  const bearishActive    = bearish.filter(p => p.status === 'implementing').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">정책 분석 — 주택 시장에 미치는 영향</h1>
        <p className="text-slate-400 text-sm mt-1">
          현재 시행·예정 중인 주요 주택 정책과 매수 타이밍에 대한 함의를 분석합니다.
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <EstBadge note="정책 효과 평가 — 공개 발표 + 시장 데이터 기반 추정" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-950/20 border border-emerald-700/40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{bearish.length}</p>
          <p className="text-xs text-slate-400 mt-1">가격 하방 압력 정책</p>
          <p className="text-xs text-slate-500 mt-0.5">효과 확인: {bearishConfirmed}개 / 시행 중: {bearishActive}개</p>
        </div>
        <div className="bg-rose-950/20 border border-rose-700/40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-rose-400">{bullish.length}</p>
          <p className="text-xs text-slate-400 mt-1">가격 상방 압력 정책</p>
          <p className="text-xs text-slate-500 mt-0.5">현재는 없음 (공급 정책은 장기 효과)</p>
        </div>
        <div className="bg-amber-950/20 border border-amber-700/40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{mixed.length}</p>
          <p className="text-xs text-slate-400 mt-1">효과 혼합 / 불확실</p>
          <p className="text-xs text-slate-500 mt-0.5">재건축 규제 등</p>
        </div>
      </div>

      {/* Key insight */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
        <p className="text-blue-200 text-sm font-semibold mb-1">무주택자에게 핵심 시사점</p>
        <ul className="text-blue-300/80 text-xs space-y-1 list-disc list-inside leading-relaxed">
          <li>현재 하방 압력 정책이 다수이지만, <strong className="text-blue-200">효과 발현까지 1-3년</strong>이 걸려 단기 가격에는 반영 안 됨.</li>
          <li>공급 확대 정책은 <strong className="text-blue-200">2027년 이후</strong> 효과. 2025-2026 공급 절벽은 이미 확정.</li>
          <li>강남 핵심지는 정책 비탄력적 — 대출 규제, 세금보다 현금 자산가 수요가 가격을 지지.</li>
          <li>가장 불확실한 변수: <strong className="text-blue-200">주식시장 부양 효과</strong>. 성공 시 부동산 투자 심리 약화, 실패 시 현상 유지.</li>
        </ul>
      </div>

      {/* Policy groups */}
      <div className="space-y-6">
        {bearish.length > 0 && (
          <div>
            <SectionHeader
              title="가격 하방 압력 정책 (무주택자 관점: 기다릴 유인)"
              badge={<EstBadge note="효과 추정" />}
              sub="이 정책들이 효과를 내면 가격이 조정될 수 있습니다"
            />
            <div className="space-y-3">
              {bearish.map(p => <PolicyCard key={p.id} policy={p} />)}
            </div>
          </div>
        )}

        {(bullish.length > 0 || mixed.length > 0) && (
          <div>
            <SectionHeader
              title="혼합·불확실 정책"
              sub="방향이 불분명하거나 단기-장기 효과가 다른 정책들"
            />
            <div className="space-y-3">
              {[...bullish, ...mixed].map(p => <PolicyCard key={p.id} policy={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Policy timing matrix */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="정책 효과 타임라인"
          sub="정책이 실제 가격·거래량에 반영되는 시점 추정"
          badge={<EstBadge note="추정" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2 pr-4 text-left text-slate-400 font-semibold w-32">시점</th>
                <th className="py-2 pr-4 text-left text-slate-400 font-semibold">가격 영향 가능성</th>
                <th className="py-2 text-left text-slate-400 font-semibold">주요 변수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {[
                { period: '2025 ~ 2026', impact: '제한적 (현재)', factors: '공급 절벽 심화. 정책 효과 아직 미발현. 거래량 회복 중. 가격지수 역대 최고 수준 유지.' },
                { period: '2026 ~ 2027', impact: '분기점 예상', factors: '다주택자 압박 정책 효과 여부 판가름. 역전세·경매 건수가 증가하면 하방 압력 가시화. 거래량 7,000건+ 회복 여부 확인.' },
                { period: '2027 ~ 2029', impact: '공급 회복', factors: '3기 신도시 입주 시작. 도심복합 물량 출회. 공급/수요 비율 0.8+ 회복 예상. 가격 안정 구간 진입 가능.' },
                { period: '2030+',       impact: '구조적 변화', factors: '30대 인구 감소 본격화. 1인 가구 비중 40%+ → 소형 수요 지속. 외곽 대규모 단지 수요 약화.' },
              ].map(r => (
                <tr key={r.period} className="hover:bg-slate-700/20">
                  <td className="py-2.5 pr-4 font-semibold text-slate-300 whitespace-nowrap">{r.period}</td>
                  <td className="py-2.5 pr-4 text-amber-400 font-medium whitespace-nowrap">{r.impact}</td>
                  <td className="py-2.5 text-slate-400 leading-relaxed">{r.factors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
