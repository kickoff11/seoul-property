'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { EstBadge, RealBadge, SectionHeader } from '@/components/DataBadge'
import type { TimingSignal } from '@/app/api/timing/route'
import type { MarketScenario } from '@/lib/policy-data'

interface TimingData {
  signals:         TimingSignal[]
  waitRiskSignals: TimingSignal[]
  buyRiskSignals:  TimingSignal[]
  verdict:         { score: number; label: string; color: string; summary: string }
  scenarios:       MarketScenario[]
  dataAsOf:        string
}

const STATUS_DOT: Record<string, string> = {
  red:    'bg-rose-500',
  yellow: 'bg-amber-400',
  green:  'bg-emerald-500',
}
const STATUS_RING: Record<string, string> = {
  red:    'border-rose-700/50 bg-rose-950/20',
  yellow: 'border-amber-700/50 bg-amber-950/20',
  green:  'border-emerald-700/50 bg-emerald-950/20',
}
const STATUS_TEXT: Record<string, string> = {
  red:    'text-rose-300',
  yellow: 'text-amber-300',
  green:  'text-emerald-300',
}
const SCENARIO_COLORS: Record<string, { border: string; bg: string; label: string }> = {
  bull: { border: 'border-rose-700/50',    bg: 'bg-rose-950/20',    label: '상승' },
  bear: { border: 'border-emerald-700/50', bg: 'bg-emerald-950/20', label: '하락' },
  base: { border: 'border-slate-600/50',   bg: 'bg-slate-800/40',   label: '횡보' },
}

function SignalCard({ signal }: { signal: TimingSignal }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={clsx('rounded-xl border p-4 cursor-pointer transition-colors hover:brightness-110', STATUS_RING[signal.status])}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-start gap-3">
        <span className={clsx('w-2.5 h-2.5 rounded-full mt-1 shrink-0', STATUS_DOT[signal.status])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-200">{signal.name}</p>
            <span className={clsx('text-xs font-semibold shrink-0', STATUS_TEXT[signal.status])}>
              {signal.statusLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{signal.currentValue}</p>
          {open && (
            <div className="mt-3 space-y-2 text-xs border-t border-slate-700/50 pt-3">
              <p className="text-slate-300 leading-relaxed">{signal.forBuyer}</p>
              <p className="text-slate-500 leading-relaxed">
                <span className="text-slate-400 font-medium">전환 조건: </span>
                {signal.targetToFlip}
              </p>
              <p className={clsx('text-[10px]', signal.isReal ? 'text-emerald-700' : 'text-amber-700')}>
                {signal.isReal ? '● ' : '◐ '}{signal.source}
              </p>
            </div>
          )}
        </div>
        <span className="text-slate-600 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </div>
    </div>
  )
}

export default function TimingPage() {
  const [data, setData] = useState<TimingData | null>(null)

  useEffect(() => {
    fetch('/api/timing').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const redCount    = data.signals.filter(s => s.status === 'red').length
  const yellowCount = data.signals.filter(s => s.status === 'yellow').length
  const greenCount  = data.signals.filter(s => s.status === 'green').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">매수 타이밍 신호</h1>
        <p className="text-slate-400 text-sm mt-1">
          지금 서울 아파트를 사야 할까, 기다려야 할까? 핵심 지표를 종합해 매수 타이밍을 분석합니다.
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <RealBadge source="거래량 — 국토교통부 DB" />
          <RealBadge source="가격지수 — 부동산원 R-ONE" />
          <EstBadge note="갭·부담·정책 — 공개보고서 기반 추정" />
        </div>
      </div>

      {/* Verdict banner */}
      <div className={clsx(
        'rounded-xl border p-5',
        data.verdict.score <= 1 ? 'bg-rose-950/20 border-rose-700/50' :
        data.verdict.score >= 3 ? 'bg-emerald-950/20 border-emerald-700/50' :
        'bg-amber-950/20 border-amber-700/50',
      )}>
        <div className="flex items-start gap-4">
          <div className="shrink-0 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">종합 신호</p>
            <p className={clsx('text-2xl font-bold', data.verdict.color)}>{data.verdict.label}</p>
            <div className="flex gap-1 mt-2 justify-center">
              {Array.from({ length: redCount }).map((_, i) => <span key={`r${i}`} className="w-2 h-2 rounded-full bg-rose-500" />)}
              {Array.from({ length: yellowCount }).map((_, i) => <span key={`y${i}`} className="w-2 h-2 rounded-full bg-amber-400" />)}
              {Array.from({ length: greenCount }).map((_, i) => <span key={`g${i}`} className="w-2 h-2 rounded-full bg-emerald-500" />)}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-slate-200 text-sm leading-relaxed">{data.verdict.summary}</p>
            <p className="text-slate-500 text-xs mt-2">
              신호 현황: <span className="text-rose-400">적색 {redCount}개</span>{' '}·{' '}
              <span className="text-amber-400">황색 {yellowCount}개</span>{' '}·{' '}
              <span className="text-emerald-400">녹색 {greenCount}개</span>
              {' '}/ 데이터 기준일: {data.dataAsOf}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column signal layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy risk signals */}
        <div>
          <SectionHeader
            title="지금 사면 위험한 이유"
            sub="이 신호들이 개선되면 더 좋은 가격에 살 수 있습니다"
            badge={<EstBadge note="일부 항목 추정" />}
          />
          <div className="space-y-3">
            {data.buyRiskSignals.map(s => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>

        {/* Wait risk signals */}
        <div>
          <SectionHeader
            title="기다리면 위험한 이유"
            sub="이 신호들이 강해지면 지금 움직이는 게 나을 수 있습니다"
            badge={<EstBadge note="일부 항목 추정" />}
          />
          <div className="space-y-3">
            {data.waitRiskSignals.map(s => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>
      </div>

      {/* What to watch */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="신호가 바뀌면 재검토하세요"
          sub="아래 이벤트가 발생하면 이 페이지를 다시 확인하세요"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { event: '월 거래량이 6,000건 이상으로 2개월 연속 유지', meaning: '시장 해동 신호 — 매수 적기 접근' },
            { event: '호가-실거래 갭이 5% 이하로 축소', meaning: '셀러 태도 변화 — 협상 여지 증가' },
            { event: 'BoK 기준금리 2.0% 이하로 추가 인하', meaning: '월 상환 부담 개선 — 매수력 확대' },
            { event: '강남구 등 핵심지 신고가 거래 연속 출현', meaning: '상승 시나리오 확률 상승 — 관망 리스크 증가' },
            { event: '다주택자 보유세 강화 법안 국회 통과', meaning: '매물 증가 가능성 — 가격 하방 압력 확인' },
            { event: '역전세 건수 급증 or 경매 물량 증가', meaning: '하락 시나리오 진행 — 기다릴 유인 증가' },
          ].map((w, i) => (
            <div key={i} className="bg-slate-900/40 rounded-lg p-3 flex gap-3">
              <span className="text-blue-500 text-sm mt-0.5 shrink-0">◉</span>
              <div>
                <p className="text-xs font-medium text-slate-200">{w.event}</p>
                <p className="text-xs text-slate-500 mt-0.5">{w.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenarios */}
      <div>
        <SectionHeader
          title="세 가지 시나리오"
          sub="어떤 시나리오가 현실이 되느냐에 따라 매수 전략이 달라집니다. 확률은 현재 데이터 기반 추정치이며 바뀔 수 있습니다."
          badge={<EstBadge note="시나리오 확률 추정" />}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {data.scenarios.map(s => {
            const c = SCENARIO_COLORS[s.id]
            return (
              <div key={s.id} className={clsx('rounded-xl border p-4', c.border, c.bg)}>
                <div className="flex items-center justify-between mb-3">
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-semibold border',
                    s.id === 'bull' ? 'bg-rose-900/40 text-rose-300 border-rose-700/40' :
                    s.id === 'bear' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' :
                    'bg-slate-700/60 text-slate-300 border-slate-600/40',
                  )}>{c.label} 시나리오</span>
                  <span className="text-lg font-bold text-slate-200">{s.probability}%</span>
                </div>
                <p className="text-sm font-semibold text-slate-100 mb-2">{s.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{s.thesis}</p>

                <div className="space-y-2 mb-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">핵심 가정</p>
                  {s.keyAssumptions.slice(0, 3).map((a, i) => (
                    <p key={i} className="text-xs text-slate-400 flex gap-1.5">
                      <span className="text-slate-600 shrink-0">·</span>{a}
                    </p>
                  ))}
                </div>

                <div className="border-t border-slate-700/50 pt-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">가격 전망</p>
                  <p className="text-xs font-semibold text-slate-200">{s.priceOutcome}</p>
                </div>

                <div className="mt-3 bg-slate-900/50 rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">무주택자에게 의미</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.implication}</p>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">확인 신호</p>
                  {s.triggerEvents.slice(0, 2).map((t, i) => (
                    <p key={i} className="text-xs text-slate-500 flex gap-1.5 mt-0.5">
                      <span className="text-blue-600 shrink-0">→</span>{t}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* District-tier buying note */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader title="지역별 매수 성격 차이" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {[
            {
              tier: '강남3구·용산·마포',
              color: 'text-indigo-300',
              border: 'border-indigo-700/30',
              gapType: '프리미엄 확신',
              why: '강남 ask-gap은 셀러 부정이 아닌 시장 합의된 프리미엄. 학군·직주근접·브랜드 가치가 가격을 지지. 금리 규제에 비탄력적 (현금 매수 비중 높음).',
              advice: '이 구간에서 "싸게" 사기는 어렵습니다. 진입 타이밍보다 재정 여력 판단이 더 중요.',
            },
            {
              tier: '마포·성동·동작·강서',
              color: 'text-amber-300',
              border: 'border-amber-700/30',
              gapType: '혼합 (일부 부정)',
              why: '직장 접근성·교통 투자에 따른 실수요가 강하지만 갭투자 비중도 있어 정책 변화에 더 민감. 금리·전세가율에 연동.',
              advice: '거래량 회복과 호가-갭 축소를 확인 후 진입하는 것이 안전. 단지별 편차 큼.',
            },
            {
              tier: '노원·도봉·강북·은평',
              color: 'text-rose-300',
              border: 'border-rose-700/30',
              gapType: '셀러 부정 높음',
              why: '실수요 기반이 약한 상태에서 셀러들이 2021년 고점 가격을 고집. 호가-갭이 17-18%로 가장 큼. 인구 감소 직격 지역.',
              advice: '가격 조정 여지가 가장 큼. 단, 수요 기반도 약해 조정 후에도 회복이 느릴 수 있음. 장기 보유 관점에서 신중한 접근 필요.',
            },
          ].map(d => (
            <div key={d.tier} className={clsx('rounded-xl border p-4', d.border)}>
              <p className={clsx('text-sm font-semibold mb-1', d.color)}>{d.tier}</p>
              <p className="text-slate-500 text-[10px] mb-2">갭 성격: {d.gapType}</p>
              <p className="text-slate-400 leading-relaxed mb-3">{d.why}</p>
              <div className="bg-slate-900/50 rounded p-2">
                <p className="text-slate-300 leading-relaxed">{d.advice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
