'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { DistrictSummary, ApartmentTransaction } from '@/types'
import TransactionTable from '@/components/TransactionTable'
import { fmt, fmtPricePerM2 } from '@/lib/analysis'

const SeoulMap = dynamic(() => import('@/components/SeoulMap'), { ssr: false })

export default function MapPage() {
  const [districts, setDistricts]   = useState<DistrictSummary[]>([])
  const [transactions, setTx]       = useState<ApartmentTransaction[]>([])
  const [selected, setSelected]     = useState<DistrictSummary | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/districts').then(r => r.json()),
      fetch('/api/transactions?limit=500').then(r => r.json()),
    ]).then(([d, t]) => {
      setDistricts(d.data)
      setTx(t.data)
      setLoading(false)
    })
  }, [])

  async function handleDistrictClick(lawdCd: string) {
    const d = districts.find(x => x.lawdCd === lawdCd)
    setSelected(d ?? null)
    const res = await fetch(`/api/transactions?lawdCd=${lawdCd}&limit=300`)
    const json = await res.json()
    setTx(json.data)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const displayTx = selected ? transactions.filter(t => t.lawdCd === selected.lawdCd) : transactions

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">서울 부동산 지도</h1>
          <p className="text-slate-400 text-sm">구를 클릭하면 해당 구의 거래 내역을 확인할 수 있습니다</p>
        </div>
        {selected && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-right min-w-[200px]">
            <p className="font-bold text-lg text-slate-100">{selected.gu}</p>
            <p className="text-blue-300 text-sm font-semibold">{fmtPricePerM2(Math.round(selected.avgPricePerM2))}</p>
            <p className="text-slate-400 text-xs">평균 {fmt(Math.round(selected.avgAmount))}</p>
            <p className="text-slate-500 text-xs">{selected.count.toLocaleString()}건</p>
            <button onClick={() => { setSelected(null); fetch('/api/transactions?limit=500').then(r => r.json()).then(j => setTx(j.data)) }}
              className="text-xs text-slate-500 hover:text-slate-300 underline mt-1">
              전체 보기
            </button>
          </div>
        )}
      </div>

      <SeoulMap districts={districts} onDistrictClick={handleDistrictClick} />

      <TransactionTable data={displayTx} showDistrict={!selected} />
    </div>
  )
}
