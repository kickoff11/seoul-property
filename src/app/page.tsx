'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import MetricCard from '@/components/MetricCard'
import PriceTrendChart from '@/components/PriceTrendChart'
import TransactionTable from '@/components/TransactionTable'
import DistrictRanking from '@/components/DistrictRanking'
import VacancyAlert from '@/components/VacancyAlert'
import { DistrictSummary, ApartmentTransaction, PriceTrend, VacantComplex, SupplyByYear, SentimentPoint, InterestRatePoint } from '@/types'
import { fmt, fmtPricePerM2 } from '@/lib/analysis'
import Link from 'next/link'
import { RealBadge, EstBadge, DataSource } from '@/components/DataBadge'

const SeoulMap = dynamic(() => import('@/components/SeoulMap'), { ssr: false })

interface DashboardData {
  districts:    DistrictSummary[]
  transactions: ApartmentTransaction[]
  trends:       PriceTrend[]
  vacant:       VacantComplex[]
  supply:       SupplyByYear[]
  sentiment:    SentimentPoint | null
  interestRate: InterestRatePoint | null
}

export default function Dashboard() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [selectedGu, setSelectedGu] = useState<string | null>(null)
  const [districtTrends, setDistrictTrends] = useState<PriceTrend[]>([])

  const load = useCallback(async () => {
    const [d, t, tr, v, sup, dem] = await Promise.all([
      fetch('/api/districts').then(r => r.json()),
      fetch('/api/transactions?limit=300').then(r => r.json()),
      fetch('/api/trends').then(r => r.json()),
      fetch('/api/vacant').then(r => r.json()),
      fetch('/api/supply').then(r => r.json()),
      fetch('/api/demand').then(r => r.json()),
    ])

    // Wait until seeding finishes — seeding now has 10s timeout per call so it
    // always terminates. Show nothing until we have clean, complete-month data.
    if (d.seeding || d.data?.length === 0) {
      setSeeding(true)
      setTimeout(load, 4000)
      return
    }

    setSeeding(false)
    setData({
      districts:    d.data,
      transactions: t.data,
      trends:       tr.data,
      vacant:       v.data,
      supply:       sup.annualSupply,
      sentiment:    dem.sentiment?.[dem.sentiment.length - 1] ?? null,
      interestRate: dem.interestRates?.[dem.interestRates.length - 1] ?? null,
    })
  }, [])

  useEffect(() => { load() }, [load])

  const handleDistrictClick = useCallback(async (lawdCd: string) => {
    const d = data?.districts.find(x => x.lawdCd === lawdCd)
    setSelectedGu(d?.gu ?? lawdCd)
    const res = await fetch(`/api/trends?lawdCd=${lawdCd}`)
    const json = await res.json()
    setDistrictTrends(json.data)
  }, [data])

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">
        {seeding ? '서버 첫 시작 중… 국토교통부 데이터 수집 중 (약 10초)' : '데이터 로딩 중…'}
      </p>
    </div>
  )

  if (!data) return null

  // ── Metrics ──────────────────────────────────────────────────
  const totalTx      = data.districts.reduce((s, d) => s + d.count, 0)
  const cityAvgPpm2  = Math.round(data.districts.reduce((s, d) => s + d.avgPricePerM2 * d.count, 0) / totalTx)
  const topByVol     = [...data.districts].sort((a, b) => b.count - a.count)[0]
  const topByPrice   = data.districts[0] // already sorted by price

  const filteredTx = selectedGu
    ? data.transactions.filter(t => t.gu === selectedGu)
    : data.transactions

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">서울 아파트 실거래가 대시보드</h1>
        <p className="text-slate-400 text-sm mt-1">
          국토교통부 실거래가 공개시스템 기반 · 호가 대비 실제 거래가를 한눈에 확인하세요
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <RealBadge source="거래 데이터 — 국토교통부 실거래가" />
          <EstBadge note="공급 전망 · 수요 심리 — 공개보고서 기반" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="총 거래 건수"
          value={`${totalTx.toLocaleString()}건`}
          sub="최근 6개월"
        />
        <MetricCard
          title="서울 평균 m²당 가격"
          value={fmtPricePerM2(cityAvgPpm2)}
          sub="전용면적 기준"
        />
        <MetricCard
          title="거래량 1위"
          value={topByVol?.gu ?? '-'}
          sub={`${topByVol?.count.toLocaleString() ?? 0}건`}
          highlight
        />
        <MetricCard
          title="최고가 구"
          value={topByPrice?.gu ?? '-'}
          sub={`평균 ${fmt(Math.round(topByPrice?.avgAmount ?? 0))}`}
        />
      </div>

      {/* Listings vs transactions callout */}
      <div className="bg-amber-950/10 border border-amber-800/25 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="shrink-0">
            <p className="text-[10px] font-medium text-amber-500/70 uppercase tracking-wide">매물 vs 거래 (2026년 4월)</p>
            <div className="flex items-end gap-3 mt-1">
              <div>
                <p className="text-2xl font-bold text-amber-400">74,600<span className="text-sm font-normal ml-0.5">건</span></p>
                <p className="text-[10px] text-slate-500">활성 매물</p>
              </div>
              <p className="text-slate-600 text-lg mb-4">vs</p>
              <div>
                <p className="text-2xl font-bold text-blue-400">8,550<span className="text-sm font-normal ml-0.5">건</span></p>
                <p className="text-[10px] text-slate-500">월 거래량</p>
              </div>
            </div>
          </div>
          <div className="h-px sm:h-16 sm:w-px bg-amber-800/30 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-300">10년 추이: 거래는 줄고 매물은 쌓였다</p>
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { year: '2020', tx: '9.4만', color: 'text-blue-400' },
                { year: '2022', tx: '1.5만', color: 'text-rose-400' },
                { year: '2023', tx: '3.6만', color: 'text-amber-400' },
                { year: '2025', tx: '~8만', color: 'text-emerald-500' },
              ].map(d => (
                <div key={d.year} className="bg-slate-900/50 rounded p-1.5 text-center">
                  <p className="text-[10px] text-slate-500">{d.year}</p>
                  <p className={`text-sm font-semibold ${d.color}`}>{d.tx}</p>
                  <p className="text-[9px] text-slate-600">연간</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-2">국토교통부 실거래 · 서울경제 보도 기반</p>
          </div>
          <Link href="/supply-demand" className="sm:ml-auto text-xs text-amber-400 hover:text-amber-300 underline shrink-0 self-start">
            10년 차트 →
          </Link>
        </div>
      </div>

      {/* Map */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-300">
            구별 m²당 실거래가 히트맵 {selectedGu && <span className="text-blue-400">— {selectedGu} 선택됨</span>}
          </h2>
          {selectedGu && (
            <button
              onClick={() => { setSelectedGu(null); setDistrictTrends([]) }}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              전체 보기
            </button>
          )}
          <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" /> 저가
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> 고가
            <span>원 크기 = 거래량</span>
          </span>
        </div>
        <SeoulMap districts={data.districts} onDistrictClick={handleDistrictClick} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriceTrendChart
          data={districtTrends.length ? districtTrends : data.trends}
          title={`${selectedGu ?? '서울 전체'} 월별 거래 추이`}
        />
        <DistrictRanking data={data.districts} />
      </div>

      {/* Transaction table */}
      <TransactionTable data={filteredTx} showDistrict={!selectedGu} />

      {/* Supply / Demand snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Supply cliff */}
        <div className="bg-rose-950/10 border border-rose-800/25 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-rose-500/70 uppercase tracking-wide">공급 전망</p>
              <p className="text-slate-300 font-semibold mt-0.5">2025–2026 공급 절벽</p>
              <DataSource label="부동산R114 추정" isReal={false} />
            </div>
            <Link href="/supply-demand" className="text-xs text-rose-400 hover:text-rose-300 underline shrink-0">자세히 →</Link>
          </div>
          <div className="flex gap-3">
            {data.supply.filter(s => !s.actual).slice(0, 4).map(s => (
              <div key={s.year} className="flex-1 text-center">
                <p className="text-xs text-slate-500">{s.year}년</p>
                <p className={`text-lg font-bold ${s.units < 20000 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {(s.units / 10000).toFixed(1)}<span className="text-xs font-normal">만</span>
                </p>
                <div className="h-1 bg-slate-700 rounded mt-1">
                  <div className="h-full rounded" style={{
                    width: `${(s.units / 55000) * 100}%`,
                    background: s.units < 20000 ? '#ef4444' : '#3b82f6'
                  }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">수요 기준선 3.7만 세대 대비 절반 수준</p>
        </div>

        {/* Demand signals */}
        <div className="bg-blue-950/10 border border-blue-800/25 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-blue-500/70 uppercase tracking-wide">수요 시그널</p>
              <p className="text-slate-300 font-semibold mt-0.5">심리 회복 중, 금리 하락 중</p>
              <DataSource label="KB부동산·한국은행 추정" isReal={false} />
            </div>
            <Link href="/supply-demand" className="text-xs text-blue-400 hover:text-blue-300 underline shrink-0">자세히 →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {data.sentiment && (
              <>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">매수심리지수</p>
                  <p className="text-xl font-bold text-amber-400">{data.sentiment.buyerSentiment}</p>
                  <p className="text-xs text-slate-500">100 = 중립</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">가격전망지수</p>
                  <p className="text-xl font-bold text-purple-400">{data.sentiment.priceExpectation}</p>
                  <p className="text-xs text-slate-500">100이상 = 상승 전망</p>
                </div>
              </>
            )}
            {data.interestRate && (
              <>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">기준금리</p>
                  <p className="text-xl font-bold text-emerald-400">{data.interestRate.baseRate}%</p>
                  <p className="text-xs text-slate-500">인하 사이클</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">주담대금리</p>
                  <p className="text-xl font-bold text-blue-400">{data.interestRate.mortgageRate}%</p>
                  <p className="text-xs text-slate-500">전년比 -0.9%p</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vacancy */}
      {data.vacant.length > 0 && <VacancyAlert data={data.vacant} />}
    </div>
  )
}
