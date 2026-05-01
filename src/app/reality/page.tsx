'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { AskTransactionGap, DistrictAskGap } from '@/lib/market-reality'
import clsx from 'clsx'
import { RealBadge, EstBadge, SectionHeader, DataSource } from '@/components/DataBadge'

interface RealityData {
  monthlyVolume:       { month: string; volume: number }[]
  askTransactionGap:   AskTransactionGap[]
  priceIndexSeries:    { month: string; label: string; index: number }[]
  jeonseByGu:          { gu: string; jeonseIndex: number; saleIndex: number; jeonseRatio: number }[]
  districtAskGap:      DistrictAskGap[]
  volumeHistoricalAvg: number
  volumePeak:          number
  volumeIsReal:        boolean
  hasPriceData:        boolean
  priceDataMonth:      string | null
  peakIndex:           number | null
  peakMonth:           string | null
  troughIndex:         number | null
  currentIndex:        number | null
  changeFromPeak:      number | null
}

const CATEGORY_COLOR: Record<string, string> = {
  premium: '#818cf8',
  mid:     '#f59e0b',
  outer:   '#ef4444',
}
const CATEGORY_LABEL: Record<string, string> = {
  premium: '강남권 (확신 프리미엄)',
  mid:     '중간지역 (혼합)',
  outer:   '외곽지역 (셀러 부정)',
}

function fmtYm(ym: string): string {
  return `${ym.slice(0, 4)}년 ${parseInt(ym.slice(4))}월`
}

export default function RealityPage() {
  const [data, setData] = useState<RealityData | null>(null)

  useEffect(() => {
    fetch('/api/reality').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const latestVolume = data.monthlyVolume.at(-1)
  const latestGap    = data.askTransactionGap.at(-1)
  const volumeVsAvg  = latestVolume
    ? ((latestVolume.volume - data.volumeHistoricalAvg) / data.volumeHistoricalAvg * 100)
    : null

  const troughCorrection = (data.peakIndex && data.troughIndex)
    ? parseFloat(((data.troughIndex - data.peakIndex) / data.peakIndex * 100).toFixed(1))
    : null

  const combinedChart = data.monthlyVolume.map(v => ({
    month:  v.month.slice(2),
    거래량: v.volume,
  }))

  const gapChart = data.askTransactionGap.map(g => ({
    month: g.month.slice(2),
    gap:   g.gapPct,
    label: g.label,
  }))

  const districtGapChart = [...data.districtAskGap]
    .sort((a, b) => b.currentGapPct - a.currentGapPct)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">시장 현실 분석</h1>
        <p className="text-slate-400 text-sm mt-1">
          가격지수 · 거래량 · 호가-실거래 갭 — 무주택자 관점에서 본 서울 아파트 시장의 실제 모습
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <RealBadge source="거래량 — 국토교통부 실거래가 DB" />
          <RealBadge source="가격지수 — 부동산원 R-ONE" />
          <EstBadge note="호가-갭 — 공개 API 없음, 시장 데이터 추정" />
        </div>
      </div>

      {/* Main thesis — balanced dual perspective */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bull read */}
        <div className="bg-rose-950/20 border border-rose-700/40 rounded-xl p-4">
          <p className="text-rose-300 text-xs font-bold uppercase tracking-widest mb-2">상승론 시각</p>
          <p className="text-sm text-slate-200 font-semibold mb-2">
            가격이 안 떨어진 게 아니라 — <span className="text-rose-300">가격이 오르고 있다</span>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            부동산원 가격지수는 현재 <strong className="text-rose-300">역대 최고치</strong>입니다.
            거래량 감소는 &ldquo;살 사람이 없어서&rdquo;가 아니라 <strong className="text-slate-200">살 사람이 없어도
            팔 필요가 없는 사람들</strong>이 버티고 있기 때문입니다.
            강남은 현금 자산가 수요가 가격을 지지 — 금리·규제에 비탄력적입니다.
            2025-2026 공급 절벽이 현실화되면 전세난 → 매매 전환 수요로 가격 상승이 가속될 수 있습니다.
          </p>
        </div>
        {/* Bear read */}
        <div className="bg-emerald-950/20 border border-emerald-700/40 rounded-xl p-4">
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2">하락론 시각</p>
          <p className="text-sm text-slate-200 font-semibold mb-2">
            거래 없는 가격은 <span className="text-emerald-300">신기루다</span>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            호가-실거래 갭 <strong className="text-amber-400">10.5%</strong>는 셀러가 부르는 가격과
            실제 거래가 사이의 괴리입니다. 거래량은 평년 대비 -{Math.abs(volumeVsAvg ?? 23).toFixed(0)}%로
            위축돼 있고, <strong className="text-slate-200">매수자도 스스로 기다리고 있습니다</strong>.
            PIR 27배·월 상환 부담 61%는 실수요자의 진입 자체를 막고 있습니다.
            정책 효과 + 공급 회복이 맞물리면 2027년 이후 가격 조정 가능성이 있습니다.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">현재 거래량 vs 평년</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {volumeVsAvg !== null ? `${volumeVsAvg.toFixed(0)}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {latestVolume
              ? `월 ${latestVolume.volume.toLocaleString()}건 vs 평년 ${data.volumeHistoricalAvg.toLocaleString()}건`
              : '데이터 없음'}
          </p>
          <DataSource label="국토교통부 실거래가" isReal={data.volumeIsReal} />
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">호가-실거래 갭</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {latestGap ? `+${latestGap.gapPct}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">정상 시장 기준: 2% 이하</p>
          <DataSource label="추정치 · 공개 API 없음" isReal={false} />
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">가격지수 고점 조정폭</p>
          {data.hasPriceData && troughCorrection !== null ? (
            <>
              <p className="text-2xl font-bold text-blue-400 mt-1">{troughCorrection.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">
                {data.peakMonth ? fmtYm(data.peakMonth) : '고점'} 대비 최대 조정
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-500 mt-1">—</p>
          )}
          <DataSource label="부동산원 R-ONE 지수" isReal={data.hasPriceData} />
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">현재 가격지수</p>
          {data.hasPriceData && data.changeFromPeak !== null ? (
            <>
              <p className={clsx('text-2xl font-bold mt-1', data.changeFromPeak > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                {data.changeFromPeak > 0 ? '+' : ''}{data.changeFromPeak.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {data.peakMonth ? fmtYm(data.peakMonth) : '고점'} 대비 (역대 최고)
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-500 mt-1">—</p>
          )}
          <DataSource label="부동산원 R-ONE 지수" isReal={data.hasPriceData} />
        </div>
      </div>

      {/* Chart 1: Volume with dual-cause explanation */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="월별 서울 아파트 매매 거래량"
          badge={data.volumeIsReal ? <RealBadge source="국토교통부" /> : <EstBadge />}
          sub="평년 기준선(6,500건) 대비 현재 거래량 수준"
        />

        {/* Dual-cause explainer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-amber-950/20 border border-amber-700/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-300 mb-1">원인 1: 셀러 확신 (버티기)</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              특히 외곽 지역 셀러들은 2021년 고점 가격을 고수합니다.
              &ldquo;언젠가는 다시 오른다&rdquo;는 확신으로 호가를 낮추지 않아 거래가 성사되지 않습니다.
            </p>
          </div>
          <div className="bg-blue-950/20 border border-blue-700/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-300 mb-1">원인 2: 바이어 관망 (능동적 대기)</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              많은 잠재 매수자들이 &ldquo;지금은 아니다&rdquo;라고 스스로 판단해 시장에 들어오지 않습니다.
              PIR 27배·월 상환 61% 부담이 실수요자 진입을 막고 있습니다.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: 360 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={combinedChart} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd"
                  angle={-45} textAnchor="end" height={44} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}천`}
                  label={{ value: '거래 건수', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, dx: -8 }}
                  width={52} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  formatter={(v: number) => [`${v.toLocaleString()}건`, '거래량']}
                />
                <ReferenceLine y={data.volumeHistoricalAvg} stroke="#f59e0b" strokeDasharray="5 3"
                  label={{ value: '평년 평균 6,500건', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
                <Bar dataKey="거래량" radius={[3, 3, 0, 0]}>
                  {combinedChart.map((entry, i) => (
                    <Cell key={i} fill={entry.거래량 < data.volumeHistoricalAvg ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 2: R-ONE price index time series */}
      {data.hasPriceData && data.priceIndexSeries.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="서울 아파트 매매가격지수 추이 (2021~현재)"
            badge={
              <RealBadge
                source="부동산원 R-ONE"
                detail={`한국부동산원 아파트 매매가격지수 (A_2024_00010) · 기준월: ${data.priceDataMonth ?? ''}`}
              />
            }
            sub={
              `고점(${data.peakMonth ? fmtYm(data.peakMonth) : '—'} · ${data.peakIndex?.toFixed(1)}) 대비 조정폭 ${troughCorrection?.toFixed(1) ?? '—'}% — 현재 역대 최고치`
            }
          />

          <div className="mb-4 bg-rose-950/20 border border-rose-700/30 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-rose-300 mb-1">
              핵심: 가격은 내리지 않았다 — 거래량이 줄었을 뿐
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              2022년 고점 대비 최대 조정폭은 <strong className="text-amber-300">{troughCorrection?.toFixed(1) ?? '—'}%</strong>에 불과했습니다.
              그 후 회복해 현재는 <strong className="text-rose-300">역대 최고치</strong>입니다.
              &ldquo;폭락&rdquo;은 없었고, 거래량만 평년 대비 -{Math.abs(volumeVsAvg ?? 23).toFixed(0)}% 감소한 상태입니다.
              이를 &ldquo;위기&rdquo;로 볼 것인지 &ldquo;공급 부족 속 가격 유지&rdquo;로 볼 것인지는
              해석의 차이입니다.
            </p>
          </div>

          <div className="overflow-x-auto"><div style={{ minWidth: 340 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.priceIndexSeries} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                domain={['auto', 'auto']}
                tickFormatter={v => v.toFixed(0)}
                label={{ value: '가격지수', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, dx: -8 }}
                width={52}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number) => [v.toFixed(2), '매매가격지수 (서울)']}
              />
              {data.peakIndex && (
                <ReferenceLine y={data.peakIndex} stroke="#f59e0b" strokeDasharray="4 3"
                  label={{ value: `2022 고점 ${data.peakIndex.toFixed(1)}`, fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
              )}
              <Line type="monotone" dataKey="index" name="매매가격지수"
                stroke="#3b82f6" strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          </div></div>
          <DataSource
            label={`한국부동산원 R-ONE 아파트 매매가격지수 · 서울 전체 · 분기별 표시 · 기준월: ${data.priceDataMonth ?? '미확인'}`}
            isReal
          />
        </div>
      )}

      {/* Chart 3: Ask-transaction gap over time */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="호가-실거래가 갭 추이"
          badge={<EstBadge note="호가 데이터 공개 API 없음 — KB부동산 기반 추정" />}
          sub="갭이 클수록 셀러 희망가와 실제 거래 가능 가격의 차이가 큼. 정상 시장 기준: 2% 이하"
        />
        <div className="overflow-x-auto"><div style={{ minWidth: 320 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={gapChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 18]} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
              formatter={(v: number) => [`${v}%`, '호가-실거래 갭']}
              labelFormatter={(label) => {
                const d = gapChart.find(x => x.month === label)
                return d?.label ? `${label} — ${d.label}` : label
              }}
            />
            <ReferenceLine y={2} stroke="#10b981" strokeDasharray="5 3"
              label={{ value: '정상 시장 (2%)', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
            <Bar dataKey="gap" name="호가-실거래 갭 (%)" radius={[3, 3, 0, 0]}>
              {gapChart.map((entry, i) => (
                <Cell key={i} fill={entry.gap >= 10 ? '#ef4444' : entry.gap >= 5 ? '#f59e0b' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div></div>
      </div>

      {/* Chart 4: District ask-gap with reframed insight */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="구별 호가-실거래 갭 — 지역별 성격 차이"
          badge={<EstBadge note="호가 데이터 공개 API 없음" />}
          sub="현재 갭(진한 막대) vs 2023년 최고점 갭(연한 막대). 정상 시장 기준선: 2%"
        />

        {/* Key insight — reframed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-indigo-950/20 border border-indigo-700/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-indigo-300 mb-1">강남권 — 확신 프리미엄</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              강남·서초·송파 갭(7-8%)은 &ldquo;셀러 부정&rdquo;이 아닌
              <strong className="text-slate-300"> 시장이 합의한 프리미엄</strong>입니다.
              학군·직주근접·브랜드 가치가 가격을 지지하며,
              현금 매수 비중이 높아 금리·규제에 비탄력적입니다.
            </p>
          </div>
          <div className="bg-amber-950/20 border border-amber-700/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-300 mb-1">중간지역 — 혼합</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              마포·성동·동작 등은 실수요와 갭투자가 혼재합니다.
              금리·정책 변화에 더 민감하게 반응하며,
              단지별 편차가 큰 구간입니다.
            </p>
          </div>
          <div className="bg-rose-950/20 border border-rose-700/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-rose-300 mb-1">외곽지역 — 셀러 버티기</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              도봉·강북·노원 갭(17-18%)은 실수요 기반이 약한 상태에서
              2021년 고점 가격을 고수하는 셀러들의 <strong className="text-slate-300">버티기</strong>입니다.
              가격 조정 여지가 가장 크지만, 수요 기반도 약합니다.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
        <div style={{ minWidth: 320 }}>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={districtGapChart} layout="vertical" margin={{ top: 5, right: 40, left: 52, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={v => `${v}%`} domain={[0, 30]} />
            <YAxis type="category" dataKey="gu" tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
              formatter={(v: number, name: string) => [`${(v as number).toFixed(1)}%`, name]}
            />
            <ReferenceLine x={2} stroke="#10b981" strokeDasharray="5 3"
              label={{ value: '정상 (2%)', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
            <Bar dataKey="peakGapPct" name="2023년 최고 갭" radius={[0, 3, 3, 0]}>
              {districtGapChart.map((d, i) => (
                <Cell key={`peak-${i}`} fill={`${CATEGORY_COLOR[d.category]}40`} />
              ))}
            </Bar>
            <Bar dataKey="currentGapPct" name="현재 갭 (2025 Q1)" radius={[0, 3, 3, 0]}>
              {districtGapChart.map((d, i) => (
                <Cell key={`curr-${i}`} fill={CATEGORY_COLOR[d.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
          {(['premium', 'mid', 'outer'] as const).map(cat => (
            <span key={cat} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: CATEGORY_COLOR[cat] }} />
              {CATEGORY_LABEL[cat]}
            </span>
          ))}
          <span className="flex items-center gap-1.5 ml-auto">
            연한 막대 = 2023년 최고점 &nbsp;|&nbsp; 진한 막대 = 현재
          </span>
        </div>
        <DataSource label="추정치 — KB부동산 호가지수 + 공개 데이터 기반. 오차 범위 ±3%p" isReal={false} />
      </div>

      {/* Chart 5: Jeonse ratio — custom bar table */}
      {data.jeonseByGu.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="구별 전세가율 (전세가격지수 ÷ 매매가격지수)"
            badge={
              data.hasPriceData
                ? <RealBadge source="부동산원 R-ONE" detail={`아파트 전세가격지수 (A_2024_00045) · 기준월: ${data.priceDataMonth}`} />
                : <EstBadge note="R-ONE API 미연결 — 2025년 1월 스냅샷 데이터" />
            }
            sub={`전세가율이 높을수록 갭투자·역전세 리스크 증가. 70% 이상 경보구간.${data.priceDataMonth ? ` 기준월: ${fmtYm(data.priceDataMonth)}` : ' (2025년 1월 스냅샷)'}`}
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> &lt;70% 안전
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> 70–100% 주의
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-rose-500" /> &gt;100% 역전세 위험
            </span>
            <span className="ml-auto text-slate-500">막대 기준: 0–120%</span>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {[...data.jeonseByGu]
              .sort((a, b) => b.jeonseRatio - a.jeonseRatio)
              .map(d => {
                const MAX = 120
                const barWidth = Math.min(d.jeonseRatio / MAX * 100, 100)
                const barColor = d.jeonseRatio >= 100 ? '#ef4444' : d.jeonseRatio >= 70 ? '#f59e0b' : '#10b981'
                const textColor = d.jeonseRatio >= 100 ? 'text-rose-400' : d.jeonseRatio >= 70 ? 'text-amber-400' : 'text-emerald-400'
                const badge    = d.jeonseRatio >= 100 ? '역전세' : d.jeonseRatio >= 70 ? '주의' : '안전'
                const badgeCls = d.jeonseRatio >= 100
                  ? 'bg-rose-900/40 text-rose-400 border border-rose-700/40'
                  : d.jeonseRatio >= 70
                  ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40'
                  : 'bg-emerald-900/30 text-emerald-500 border border-emerald-800/40'
                return (
                  <div key={d.gu} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-14 shrink-0 text-right font-medium">{d.gu}</span>
                    <div className="flex-1 h-6 bg-slate-700/60 rounded overflow-hidden relative">
                      {/* Zone markers */}
                      <div className="absolute inset-y-0 w-px bg-amber-600/50" style={{ left: `${70 / MAX * 100}%` }} />
                      <div className="absolute inset-y-0 w-px bg-rose-600/50"  style={{ left: `${100 / MAX * 100}%` }} />
                      {/* Filled bar */}
                      <div className="h-full transition-all duration-300 rounded"
                        style={{ width: `${barWidth}%`, background: barColor, opacity: 0.85 }} />
                    </div>
                    <span className={clsx('text-xs font-bold w-12 shrink-0 text-right tabular-nums', textColor)}>
                      {d.jeonseRatio.toFixed(1)}%
                    </span>
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium w-12 text-center shrink-0', badgeCls)}>
                      {badge}
                    </span>
                  </div>
                )
              })}
          </div>

          {/* Scale ruler */}
          <div className="mt-3 ml-[4.25rem] mr-[6.5rem] flex justify-between text-[10px] text-slate-600 border-t border-slate-700/50 pt-1">
            <span>0%</span>
            <span className="text-amber-700">70%</span>
            <span className="text-rose-700">100%</span>
            <span>120%+</span>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            역전세(100%+): 전세 보증금이 집값을 초과 — 집주인 반환 불능 리스크. 역전세 급증 시 강제 매물 출회 → 매수자 관망 신호.
          </p>
          <DataSource label={`한국부동산원 R-ONE 전세가격지수 (A_2024_00045) · 기준월: ${data.priceDataMonth ?? '미확인'}`} isReal />
        </div>
      )}

      {/* What to watch for buyers */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHeader
          title="무주택자가 주목해야 할 지표"
          sub="아래 신호들이 바뀔 때 시장 방향이 명확해집니다"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              signal: '호가-실거래 갭 5% 이하로 축소',
              bull:   '셀러가 현실적 가격을 수용 → 거래 재개 → 안전하게 진입 가능',
              bear:   '셀러가 가격 수용하기 시작 = 하방 압력 시작 신호일 수 있음',
              color:  'border-amber-700/30',
            },
            {
              signal: '월 거래량 6,000건+ 2개월 연속',
              bull:   '시장이 정상 작동 → 가격 발견 재개 → 매수 타이밍 접근',
              bear:   '바이어들이 돌아왔다 = 추가 상승 전 마지막 기회일 수도',
              color:  'border-blue-700/30',
            },
            {
              signal: '강남 역대 신고가 연속 출현',
              bull:   '상승 시나리오 현실화 — 외곽 관망자들 매수 전환 압박',
              bear:   '투기 과열 → 정부 추가 규제 → 단기 급등 후 조정 가능',
              color:  'border-rose-700/30',
            },
            {
              signal: '역전세·경매 건수 급증',
              bull:   '매물 증가 → 협상 기회 → 바이어 협상력 회복',
              bear:   '하락 시나리오 진행 중 — 추가 조정 기다릴 근거',
              color:  'border-emerald-700/30',
            },
          ].map((w, i) => (
            <div key={i} className={clsx('rounded-xl border p-4', w.color)}>
              <p className="text-xs font-semibold text-slate-200 mb-2">{w.signal}</p>
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400 flex gap-2">
                  <span className="text-rose-400 shrink-0">↑ 상승론:</span>{w.bull}
                </p>
                <p className="text-xs text-slate-400 flex gap-2">
                  <span className="text-emerald-400 shrink-0">↓ 하락론:</span>{w.bear}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
