'use client'

interface Props {
  dataAgeHours: number | null
  /** Threshold in hours before the banner appears (default 26) */
  thresholdHours?: number
}

export default function StaleDataBanner({ dataAgeHours, thresholdHours = 26 }: Props) {
  if (dataAgeHours === null || dataAgeHours < thresholdHours) return null

  const days  = Math.floor(dataAgeHours / 24)
  const label = days >= 2 ? `${days}일` : `${dataAgeHours}시간`

  return (
    <div className="bg-slate-800/70 border border-slate-600/60 rounded-lg px-4 py-2.5 flex items-center gap-3">
      <span className="text-amber-400 text-sm shrink-0">⏱</span>
      <p className="text-xs text-slate-400 leading-snug">
        캐시된 거래 데이터가{' '}
        <strong className="text-amber-300">{label} 전</strong>에 수집된 것입니다.
        최신 데이터를 보려면 페이지를 새로고침하세요.
        새 데이터는 국토교통부 API 할당량 내에서 자동 갱신됩니다.
      </p>
    </div>
  )
}
