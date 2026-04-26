'use client'

import { useState } from 'react'
import { ApartmentTransaction } from '@/types'
import { fmt, fmtPricePerM2 } from '@/lib/analysis'
import clsx from 'clsx'

interface Props {
  data: ApartmentTransaction[]
  showDistrict?: boolean
}

type SortKey = 'dealDate' | 'amount' | 'pricePerM2' | 'area'

export default function TransactionTable({ data, showDistrict = true }: Props) {
  const [sort, setSort]   = useState<SortKey>('dealDate')
  const [asc, setAsc]     = useState(false)
  const [search, setSearch] = useState('')

  function toggle(key: SortKey) {
    if (sort === key) setAsc(a => !a)
    else { setSort(key); setAsc(false) }
  }

  const filtered = data.filter(t =>
    !search || t.aptName.includes(search) || t.dong.includes(search) || t.gu.includes(search)
  )

  const sorted = [...filtered].sort((a, b) => {
    const mul = asc ? 1 : -1
    if (sort === 'dealDate') return mul * a.dealDate.localeCompare(b.dealDate)
    return mul * (a[sort] - b[sort])
  })

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-200 select-none whitespace-nowrap"
      onClick={() => toggle(k)}
    >
      {label} {sort === k ? (asc ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-300 flex-1">최근 실거래 내역</h3>
        <input
          className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 w-48 focus:outline-none focus:border-blue-500"
          placeholder="아파트명 / 동 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="text-xs text-slate-500">{sorted.length.toLocaleString()}건</span>
      </div>
      <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 sticky top-0">
            <tr>
              <Th label="거래일" k="dealDate" />
              {showDistrict && <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">구</th>}
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">아파트</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">법정동</th>
              <Th label="거래금액" k="amount" />
              <Th label="전용면적" k="area" />
              <Th label="m²당" k="pricePerM2" />
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">층</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sorted.slice(0, 300).map(t => (
              <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">{t.dealDate}</td>
                {showDistrict && <td className="px-3 py-2 text-slate-300 text-xs">{t.gu}</td>}
                <td className="px-3 py-2 font-medium text-slate-200 whitespace-nowrap">{t.aptName}</td>
                <td className="px-3 py-2 text-slate-400 text-xs">{t.dong}</td>
                <td className="px-3 py-2 text-blue-300 font-semibold whitespace-nowrap">{fmt(t.amount)}</td>
                <td className="px-3 py-2 text-slate-300 text-xs whitespace-nowrap">{t.area}m²</td>
                <td className={clsx(
                  'px-3 py-2 text-xs whitespace-nowrap',
                  t.pricePerM2 > 2000 ? 'text-rose-400' : t.pricePerM2 > 1000 ? 'text-amber-400' : 'text-emerald-400',
                )}>
                  {fmtPricePerM2(t.pricePerM2)}
                </td>
                <td className="px-3 py-2 text-slate-400 text-xs">{t.floor}층</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
