import { PriceTrend } from '@/types'

/** Format 만원 as human-readable Korean notation */
export function fmt(amount: number): string {
  if (amount >= 10_000) {
    const eok = amount / 10_000
    return eok % 1 === 0 ? `${eok}억` : `${eok.toFixed(1)}억`
  }
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}천만`
  return `${amount.toLocaleString()}만`
}

export function fmtFull(amount: number): string {
  const eok = Math.floor(amount / 10_000)
  const man = amount % 10_000
  if (eok === 0) return `${man.toLocaleString()}만원`
  if (man === 0) return `${eok}억원`
  return `${eok}억 ${man.toLocaleString()}만원`
}

export function fmtPricePerM2(ppm2: number): string {
  return `${ppm2.toLocaleString()}만/m²`
}

/** Convert DB monthly rows to PriceTrend array */
export function buildTrends(rows: {
  dealYear: number
  dealMonth: number
  count: number
  avgAmount: number
  avgPricePerM2: number
  minAmount: number
  maxAmount: number
}[]): PriceTrend[] {
  return rows.map(r => ({
    month: `${r.dealYear}-${String(r.dealMonth).padStart(2, '0')}`,
    avgPrice: Math.round(r.avgAmount),
    medianPrice: Math.round(r.avgAmount * 0.95), // approximate — full median needs raw data
    transactionCount: r.count,
    avgPricePerM2: Math.round(r.avgPricePerM2),
  }))
}

/** Infer months inactive from lastDealDate */
export function monthsInactive(lastDealDate: string): number {
  const last = new Date(lastDealDate)
  const now  = new Date()
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24 * 30.5))
}

/** Heatmap colour — blue (cheap) → red (expensive) based on price/m² */
export function priceColor(ppm2: number, min: number, max: number): string {
  const t = max === min ? 0.5 : Math.max(0, Math.min(1, (ppm2 - min) / (max - min)))
  const r = Math.round(t * 230)
  const g = Math.round(60 - t * 40)
  const b = Math.round((1 - t) * 230)
  return `rgb(${r},${g},${b})`
}

/** Circle radius on map scaled to transaction count */
export function markerRadius(count: number, maxCount: number): number {
  return 8 + Math.round((count / Math.max(1, maxCount)) * 22)
}
