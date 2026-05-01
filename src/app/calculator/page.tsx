'use client'

import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { fmt } from '@/lib/analysis'

// Monthly payment for a standard annuity mortgage
function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return principal * r / (1 - Math.pow(1 + r, -n))
}

// Seoul district median prices (만원/m²) — used for quick estimates
const DISTRICT_PRICES: { gu: string; avgPpm2: number }[] = [
  { gu: '강남구',   avgPpm2: 3400 },
  { gu: '서초구',   avgPpm2: 3100 },
  { gu: '송파구',   avgPpm2: 2450 },
  { gu: '용산구',   avgPpm2: 2800 },
  { gu: '마포구',   avgPpm2: 1750 },
  { gu: '성동구',   avgPpm2: 1700 },
  { gu: '광진구',   avgPpm2: 1480 },
  { gu: '동작구',   avgPpm2: 1500 },
  { gu: '영등포구', avgPpm2: 1380 },
  { gu: '강서구',   avgPpm2: 1180 },
  { gu: '양천구',   avgPpm2: 1260 },
  { gu: '노원구',   avgPpm2:  710 },
  { gu: '도봉구',   avgPpm2:  620 },
  { gu: '강북구',   avgPpm2:  610 },
  { gu: '은평구',   avgPpm2:  780 },
]

const AREA_OPTIONS = [33, 59, 84, 101, 115, 135]

export default function CalculatorPage() {
  // Inputs
  const [annualIncome,  setAnnualIncome]  = useState(7000)   // 만원
  const [savings,       setSavings]       = useState(10000)  // 만원
  const [targetPrice,   setTargetPrice]   = useState(50000)  // 만원
  const [mortgageRate,  setMortgageRate]  = useState(3.45)   // %
  const [loanYears,     setLoanYears]     = useState(30)
  const [ltvPct,        setLtvPct]        = useState(50)     // % (사용자 설정 LTV)
  const [selectedGu,    setSelectedGu]    = useState('')
  const [selectedArea,  setSelectedArea]  = useState(84)     // m²

  // Derive price from district + area selection when gu is chosen
  const derivedPrice = useMemo(() => {
    const d = DISTRICT_PRICES.find(d => d.gu === selectedGu)
    return d ? Math.round(d.avgPpm2 * selectedArea) : null
  }, [selectedGu, selectedArea])

  const price = derivedPrice ?? targetPrice

  // Calculations
  const maxLoan        = Math.round(price * ltvPct / 100)
  const loanCapped     = Math.min(maxLoan, price - savings)
  const loan           = Math.max(0, loanCapped)
  const shortfall      = Math.max(0, price - savings - loan)
  const monthlyPayAmt  = monthlyPayment(loan, mortgageRate, loanYears)
  const monthlyIncome  = annualIncome / 12
  const burdenPct      = monthlyIncome > 0 ? monthlyPayAmt / monthlyIncome * 100 : 0
  const pir            = annualIncome > 0 ? price / annualIncome : 0
  const yearsToBuy     = Math.max(0, (price - savings) / (annualIncome * 0.3))

  const canAfford      = shortfall === 0 && burdenPct <= 40
  const borderColor    = canAfford ? 'border-emerald-700/50' : burdenPct > 55 ? 'border-rose-700/50' : 'border-amber-700/50'
  const bgColor        = canAfford ? 'bg-emerald-950/20' : burdenPct > 55 ? 'bg-rose-950/20' : 'bg-amber-950/20'
  const verdictText    = canAfford ? '구입 가능 범위' : burdenPct > 55 ? '재정적 부담 과다' : '주의 — 부담 높음'
  const verdictColor   = canAfford ? 'text-emerald-400' : burdenPct > 55 ? 'text-rose-400' : 'text-amber-400'

  function SliderInput({
    label, value, min, max, step, unit, onChange, format,
  }: {
    label: string; value: number; min: number; max: number; step: number; unit?: string
    onChange: (v: number) => void; format?: (v: number) => string
  }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-slate-400">{label}</label>
          <span className="text-sm font-semibold text-slate-200">
            {format ? format(value) : `${value.toLocaleString()}${unit ?? ''}`}
          </span>
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
          <span>{format ? format(min) : `${min.toLocaleString()}${unit ?? ''}`}</span>
          <span>{format ? format(max) : `${max.toLocaleString()}${unit ?? ''}`}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">주택 구입 부담 계산기</h1>
        <p className="text-slate-400 text-sm mt-1">
          내 소득과 자산으로 서울 아파트를 살 수 있을지 시뮬레이션해보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Inputs panel ── */}
        <div className="space-y-5">

          {/* Quick district lookup */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">구·면적으로 빠른 조회</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">구 선택</label>
                <select
                  value={selectedGu}
                  onChange={e => setSelectedGu(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">직접 입력</option>
                  {DISTRICT_PRICES.map(d => (
                    <option key={d.gu} value={d.gu}>{d.gu}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">전용면적</label>
                <select
                  value={selectedArea}
                  onChange={e => setSelectedArea(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}m²</option>)}
                </select>
              </div>
            </div>
            {derivedPrice && (
              <p className="text-xs text-blue-300 bg-blue-950/20 border border-blue-800/30 rounded px-3 py-2">
                {selectedGu} 평균 실거래가 기준 (84m² 환산): 약 {fmt(derivedPrice)}
              </p>
            )}
          </div>

          {/* Financial inputs */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-300">내 재정 상황</h3>
            <SliderInput
              label="연 소득 (가구 합산)"
              value={annualIncome} min={2000} max={30000} step={500}
              onChange={setAnnualIncome}
              format={v => fmt(v)}
            />
            <SliderInput
              label="보유 현금·자산 (주택자금)"
              value={savings} min={0} max={200000} step={1000}
              onChange={setSavings}
              format={v => fmt(v)}
            />
            {!selectedGu && (
              <SliderInput
                label="목표 주택 가격"
                value={targetPrice} min={10000} max={300000} step={1000}
                onChange={setTargetPrice}
                format={v => fmt(v)}
              />
            )}
          </div>

          {/* Loan conditions */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-300">대출 조건</h3>
            <SliderInput
              label="주담대 금리"
              value={mortgageRate} min={1.0} max={8.0} step={0.05}
              unit="%" onChange={setMortgageRate}
            />
            <SliderInput
              label="대출 기간"
              value={loanYears} min={10} max={40} step={5}
              unit="년" onChange={setLoanYears}
            />
            <SliderInput
              label="LTV (주택담보대출비율)"
              value={ltvPct} min={20} max={80} step={5}
              unit="%" onChange={setLtvPct}
            />
            <p className="text-xs text-slate-600">
              실제 LTV 한도는 지역·소득·투기지역 여부에 따라 다릅니다 (서울 투기과열: 최대 40%)
            </p>
          </div>
        </div>

        {/* ── Results panel ── */}
        <div className="space-y-4">

          {/* Verdict */}
          <div className={clsx('rounded-xl border p-5', borderColor, bgColor)}>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">종합 판정</p>
            <p className={clsx('text-2xl font-bold', verdictColor)}>{verdictText}</p>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              {canAfford
                ? '현재 조건으로 구입 가능해 보입니다. 월 상환액이 소득의 40% 이내입니다.'
                : shortfall > 0
                ? `자금이 ${fmt(shortfall)} 부족합니다. 추가 저축 또는 목표 가격 조정이 필요합니다.`
                : `월 상환 부담이 소득의 ${burdenPct.toFixed(0)}%로 높습니다. 금리 하락 또는 대출 기간 연장을 고려하세요.`}
            </p>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '목표 주택 가격',  value: fmt(price),                                  color: 'text-slate-200' },
              { label: '필요 대출금',     value: fmt(loan),                                   color: 'text-blue-300' },
              { label: '월 상환액',       value: `${Math.round(monthlyPayAmt).toLocaleString()}만원`, color: burdenPct > 55 ? 'text-rose-400' : burdenPct > 40 ? 'text-amber-400' : 'text-emerald-400' },
              { label: '월 상환 부담률',  value: `${burdenPct.toFixed(1)}%`,                  color: burdenPct > 55 ? 'text-rose-400' : burdenPct > 40 ? 'text-amber-400' : 'text-emerald-400' },
              { label: 'PIR (소득 대비 주택가)',  value: `${pir.toFixed(1)}배`,               color: pir > 20 ? 'text-rose-400' : pir > 12 ? 'text-amber-400' : 'text-emerald-400' },
              { label: '자금 부족액',     value: shortfall > 0 ? fmt(shortfall) : '없음',     color: shortfall > 0 ? 'text-rose-400' : 'text-emerald-400' },
            ].map(c => (
              <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className={clsx('text-lg font-bold mt-0.5', c.color)}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Repayment timeline */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">총 상환 비용</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: '원금',       value: fmt(loan) },
                { label: '총 이자',    value: fmt(Math.round(monthlyPayAmt * loanYears * 12 - loan)) },
                { label: '총 상환액',  value: fmt(Math.round(monthlyPayAmt * loanYears * 12)) },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1 border-b border-slate-700/50 last:border-0">
                  <span className="text-xs text-slate-400">{r.label}</span>
                  <span className="text-sm font-semibold text-slate-200">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Savings goal */}
          {shortfall > 0 && (
            <div className="bg-slate-800 border border-amber-700/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-300 mb-2">자금 마련 시나리오</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                연 소득의 30%를 저축할 경우 부족 자금{' '}
                <strong className="text-amber-300">{fmt(shortfall)}</strong>을{' '}
                마련하는 데 약{' '}
                <strong className="text-amber-300">{yearsToBuy.toFixed(1)}년</strong>이 필요합니다.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-slate-600 leading-relaxed">
            본 계산기는 참고용이며 실제 대출 승인·금리·세금은 금융기관 및 세무사와 별도로 확인하세요.
            DSR·LTV 규제, 보유세, 취득세 등은 포함되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
