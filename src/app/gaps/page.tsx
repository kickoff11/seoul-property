'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts'
import { PriceGap } from '@/types'
import { fmt } from '@/lib/analysis'
import { SEOUL_DISTRICTS } from '@/lib/seoul-districts'
import { DistrictAskGap, AskTransactionGap } from '@/lib/market-reality'
import clsx from 'clsx'
import { RealBadge, EstBadge, SectionHeader, DataSource } from '@/components/DataBadge'

interface GapsApiData {
  data:              PriceGap[]
  listingCount:      number
  transactionCount:  number
  naverBlocked:      boolean
  lawdCd:            string
  districtAskGap:    DistrictAskGap[]
  askTransactionGap: AskTransactionGap[]
}

const CATEGORY_COLOR: Record<string, string> = {
  premium: '#3b82f6',
  mid:     '#a78bfa',
  outer:   '#f87171',
}

export default function GapsPage() {
  const [data, setData]     = useState<GapsApiData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lawdCd, setLawdCd] = useState('11680') // 강남구

  async function fetchGaps(code: string) {
    setLoading(true)
    try {
      const res  = await fetch(`/api/gaps?lawdCd=${code}`)
      const json = await res.json()
      setData(json)
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => { fetchGaps(lawdCd) }, [lawdCd])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">호가 vs 실거래가 비교</h1>
        <p className="text-slate-400 text-sm mt-1">
          셀러가 원하는 호가와 실제 체결된 거래가의 격차 — 갭이 클수록 시장 불투명성이 높고 가격 조정 압력이 누적됩니다.
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <RealBadge source="실거래가 — 국토교통부 DB" />
          <EstBadge note="호가 갭 — KB부동산 호가지수 기반 추정" />
        </div>
      </div>

      {/* ── Chart 1: time-series gap ──────────────────────────── */}
      {data && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="호가-실거래 갭 추이 (서울 전체)"
            badge={<EstBadge note="KB부동산 호가지수 기반 추정" />}
            sub="정상 시장 기준선 ~2% · 현재 약 10.5% — 5배 이상 괴리 지속 중"
          />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.askTransactionGap} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={m => m.slice(2)} interval={2} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => `${v}%`} domain={[0, 18]} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number, name: string) => [`${v}%`, name]}
              />
              <ReferenceLine y={2} stroke="#10b981" strokeDasharray="4 3"
                label={{ value: '정상선 2%', fill: '#10b981', fontSize: 9, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="gapPct" name="호가-실거래 갭 (%)"
                stroke="#f59e0b" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          <DataSource label="KB부동산 호가지수 기반 추정 · 정확한 실시간 갭은 네이버 부동산 접근 허용 시 표시" isReal={false} />
        </div>
      )}

      {/* ── Chart 2: district gap comparison ─────────────────── */}
      {data && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <SectionHeader
            title="구별 호가-실거래 갭 비교"
            badge={<EstBadge note="KB부동산 호가지수 기반 추정" />}
            sub="외곽 구일수록 갭이 크다 — 고레버리지 매수자일수록 호가 인하를 거부"
          />
          <div className="flex gap-4 text-[11px] text-slate-400 mb-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#3b82f6' }} />프리미엄</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#a78bfa' }} />중간</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#f87171' }} />외곽</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.districtAskGap}
              margin={{ top: 5, right: 10, left: -10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="gu" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                formatter={(v: number, name: string) => [`${v}%`, name]}
              />
              <ReferenceLine y={2} stroke="#10b981" strokeDasharray="4 3"
                label={{ value: '정상 기준선', fill: '#10b981', fontSize: 9 }} />
              <Bar dataKey="prePeakGapPct" name="2020년 이전" fill="#334155" radius={[2, 2, 0, 0]} />
              <Bar dataKey="peakGapPct"    name="2023년 최고점" fill="#6b7280" radius={[2, 2, 0, 0]} />
              <Bar dataKey="currentGapPct" name="현재 (2025 Q1)" radius={[3, 3, 0, 0]}>
                {data.districtAskGap.map((d, i) => (
                  <Cell key={i} fill={CATEGORY_COLOR[d.category]} />
                ))}
              </Bar>
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
            </BarChart>
          </ResponsiveContainer>
          <DataSource label="KB부동산 호가지수 기반 추정 (2025 Q1 기준)" isReal={false} />
        </div>
      )}

      {/* ── Live Naver comparison (if available) ─────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <SectionHeader
            title="실시간 호가 vs 실거래가 — 단지별 매칭"
            badge={data?.naverBlocked
              ? <EstBadge note="네이버 부동산 차단됨 — 실시간 데이터 없음" />
              : <RealBadge source="네이버 부동산 실시간" />}
            sub={data?.naverBlocked
              ? '네이버 부동산이 자동화된 요청을 차단하고 있습니다. 위 차트는 KB부동산 지수 기반 추정치를 사용합니다.'
              : `구 선택 후 호가와 국토교통부 실거래가를 단지별로 비교합니다. 매물 ${data?.listingCount ?? 0}건 · 실거래 ${data?.transactionCount ?? 0}건`}
          />

          {/* District selector */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SEOUL_DISTRICTS.map(d => (
              <button
                key={d.code}
                onClick={() => setLawdCd(d.code)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  lawdCd === d.code
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500 hover:text-slate-200',
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-sm p-6">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            네이버 부동산 호가 조회 중…
          </div>
        )}

        {!loading && data?.naverBlocked && (
          <div className="p-6 text-center">
            <p className="text-slate-400 text-sm">네이버 부동산이 서버 요청을 차단하고 있습니다.</p>
            <p className="text-slate-500 text-xs mt-1">
              브라우저에서 직접 <span className="text-blue-400">land.naver.com</span>을 방문하면 호가 확인이 가능합니다.
              위 구별 갭 차트는 KB부동산 지수에서 산출한 추정치입니다.
            </p>
          </div>
        )}

        {!loading && data && !data.naverBlocked && data.data.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-sm">
            이 구에서 호가와 실거래가를 매칭할 수 있는 단지가 없습니다.
          </div>
        )}

        {!loading && data && data.data.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">단지명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">법정동</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">실거래가</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">현재 호가</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">갭 (%)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">전용면적</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.data.map((g, i) => (
                <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-200">{g.aptName}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{g.dong}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-medium">{fmt(g.avgTransactionPrice)}</td>
                  <td className="px-4 py-2.5 text-right text-blue-300 font-medium">{fmt(g.avgListingPrice)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-bold',
                      g.gapPct > 30 ? 'bg-rose-900/40 text-rose-400' :
                      g.gapPct > 15 ? 'bg-amber-900/40 text-amber-400' :
                      'bg-yellow-900/30 text-yellow-400',
                    )}>
                      +{g.gapPct}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400 text-xs">{g.area}m²</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
