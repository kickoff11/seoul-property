'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { DistrictSummary } from '@/types'
import { fmt, fmtPricePerM2, priceColor, markerRadius } from '@/lib/analysis'

interface Props {
  districts: DistrictSummary[]
  onDistrictClick?: (lawdCd: string) => void
}

export default function SeoulMap({ districts, onDistrictClick }: Props) {
  const [mounted, setMounted] = useState(false)
  const [bottomSheet, setBottomSheet] = useState<DistrictSummary | null>(null)
  useEffect(() => setMounted(true), [])

  if (!mounted || !districts.length) {
    return (
      <div className="flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700" style={{ height: 460 }}>
        <p className="text-slate-500 text-sm">지도 로딩 중…</p>
      </div>
    )
  }

  const prices = districts.map(d => d.avgPricePerM2)
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const maxCount = Math.max(...districts.map(d => d.count))

  function handleClick(d: DistrictSummary) {
    setBottomSheet(d)
    onDistrictClick?.(d.lawdCd)
  }

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-slate-700" style={{ height: 460 }}>
        <MapContainer
          center={[37.5665, 126.978]}
          zoom={11}
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {districts.map(d => {
            const dist = d.district
            if (!dist) return null
            const color  = priceColor(d.avgPricePerM2, minP, maxP)
            const radius = markerRadius(d.count, maxCount)

            return (
              <CircleMarker
                key={d.lawdCd}
                center={[dist.lat, dist.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.82,
                  color: 'rgba(255,255,255,0.25)',
                  weight: 1.5,
                }}
                eventHandlers={{
                  click: () => handleClick(d),
                }}
              >
                {/* Desktop popup */}
                <Popup className="dark-popup">
                  <div style={{ fontFamily: 'sans-serif', minWidth: 200 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{dist.name}</p>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ color: '#94a3b8', paddingRight: 8 }}>평균 거래가</td><td style={{ fontWeight: 600 }}>{fmt(d.avgAmount)}</td></tr>
                        <tr><td style={{ color: '#94a3b8' }}>m²당 단가</td>     <td style={{ fontWeight: 600 }}>{fmtPricePerM2(d.avgPricePerM2)}</td></tr>
                        <tr><td style={{ color: '#94a3b8' }}>거래 건수</td>     <td style={{ fontWeight: 600 }}>{d.count.toLocaleString()}건</td></tr>
                        <tr><td style={{ color: '#94a3b8' }}>최저가</td>        <td>{fmt(d.minAmount)}</td></tr>
                        <tr><td style={{ color: '#94a3b8' }}>최고가</td>        <td>{fmt(d.maxAmount)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Mobile bottom sheet — slides up when a district is tapped */}
      {bottomSheet && (
        <div className="sm:hidden mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {/* Handle bar + header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-700/50">
            <p className="text-sm font-bold text-slate-100">
              {bottomSheet.district?.name ?? bottomSheet.gu}
            </p>
            <button
              onClick={() => setBottomSheet(null)}
              className="text-slate-500 hover:text-slate-300 text-lg leading-none px-1"
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px bg-slate-700/40 text-sm">
            {[
              { label: '평균 거래가',  value: fmt(Math.round(bottomSheet.avgAmount)) },
              { label: 'm²당 단가',   value: fmtPricePerM2(Math.round(bottomSheet.avgPricePerM2)) },
              { label: '거래 건수',   value: `${bottomSheet.count.toLocaleString()}건` },
              { label: '최저 / 최고', value: `${fmt(bottomSheet.minAmount)} / ${fmt(bottomSheet.maxAmount)}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 px-4 py-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-semibold text-slate-100 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Tap hint */}
          <p className="text-[10px] text-slate-600 text-center py-2">
            위 차트와 거래 목록이 이 구 기준으로 필터됩니다
          </p>
        </div>
      )}
    </div>
  )
}
