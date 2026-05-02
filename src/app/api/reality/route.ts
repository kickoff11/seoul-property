export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  FACT_CHECKS, SELLER_DENIAL, DISTRICT_ASK_GAP,
} from '@/lib/market-reality'
import { ensureSeeded } from '@/lib/seed'
import { getMonthlyVolume, getMonthlyVolumeByDistrict, getCachedApi, setCachedApi } from '@/lib/db'
import { fetchSeoulPriceIndex, fetchSeoulJeonseIndex, fetchSeoulCityIndexSeries } from '@/lib/rone-api'

// ── Helpers ────────────────────────────────────────────────────

function recentMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

// ── Real transaction volume from MOLIT DB ─────────────────────

function getRealVolume(): { month: string; volume: number }[] {
  try {
    return getMonthlyVolume()
  } catch {
    return []
  }
}

// ── Real price index from R-ONE ────────────────────────────────

/** Walk back up to maxLag months to find the latest month the R-ONE API has published. */
async function latestAvailableYm(maxLag = 4): Promise<string | null> {
  const now = new Date()
  for (let i = 0; i <= maxLag; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
    const rows = await fetchSeoulPriceIndex(ym)
    if (rows.length > 0) return ym
  }
  return null
}

/**
 * Build a quarterly series of YYYYMM strings from startYm to currentYm.
 * Includes the start and end months exactly.
 */
function quarterlyMonths(startYm: string, endYm: string): string[] {
  const months: string[] = []
  let year  = parseInt(startYm.slice(0, 4))
  let month = parseInt(startYm.slice(4, 6))
  const endYear  = parseInt(endYm.slice(0, 4))
  const endMonth = parseInt(endYm.slice(4, 6))

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}${String(month).padStart(2, '0')}`)
    month += 3
    if (month > 12) { month -= 12; year++ }
  }
  // Always include the exact end month
  const last = `${endYear}${String(endMonth).padStart(2, '0')}`
  if (!months.includes(last)) months.push(last)
  return months
}

async function getRealPriceData(): Promise<{
  priceIndexSeries:  { month: string; label: string; index: number }[]
  jeonseByGu:        { gu: string; jeonseIndex: number; saleIndex: number; jeonseRatio: number }[]
  hasPriceData:      boolean
  dataMonth:         string | null
  peakIndex:         number | null   // highest index in the series
  peakMonth:         string | null
  troughIndex:       number | null   // lowest index after peak
  currentIndex:      number | null
  changeFromPeak:    number | null   // % change current vs peak
}> {
  const currentYm = await latestAvailableYm()

  if (!currentYm) {
    return {
      priceIndexSeries: [], jeonseByGu: [], hasPriceData: false,
      dataMonth: null, peakIndex: null, peakMonth: null,
      troughIndex: null, currentIndex: null, changeFromPeak: null,
    }
  }

  // Quarterly series from 2021-01 to now
  const seriesMonths = quarterlyMonths('202101', currentYm)
  const seriesCacheKey = `price_series:${currentYm}`
  const jeonseKey      = `jeonse:${currentYm}`
  const saleKey        = `sale:${currentYm}`

  const TTL_HIST = 24 * 60 * 60 * 1_000   // 24 h for historical quarters
  const TTL_CUR  =      60 * 60 * 1_000   // 1 h for current month

  type SeriesRow = { month: string; index: number }
  type GusRow    = { gu: string; index: number }

  const [seriesData, jeonseRows, currentRows] = await Promise.all([
    (async () => {
      const cached = getCachedApi<SeriesRow[]>(seriesCacheKey, TTL_HIST)
      if (cached) return cached
      const data = await fetchSeoulCityIndexSeries(seriesMonths)
      if (data.length) setCachedApi(seriesCacheKey, data)
      return data
    })(),
    (async () => {
      const cached = getCachedApi<GusRow[]>(jeonseKey, TTL_CUR)
      if (cached) return cached
      const data = await fetchSeoulJeonseIndex(currentYm)
      if (data.length) setCachedApi(jeonseKey, data)
      return data
    })(),
    (async () => {
      const cached = getCachedApi<GusRow[]>(saleKey, TTL_CUR)
      if (cached) return cached
      const data = await fetchSeoulPriceIndex(currentYm)
      if (data.length) setCachedApi(saleKey, data)
      return data
    })(),
  ])

  if (!seriesData.length || !currentRows.length) {
    return {
      priceIndexSeries: [], jeonseByGu: [], hasPriceData: false,
      dataMonth: null, peakIndex: null, peakMonth: null,
      troughIndex: null, currentIndex: null, changeFromPeak: null,
    }
  }

  // Sort series by month
  seriesData.sort((a, b) => a.month.localeCompare(b.month))

  // Find the local peak: the highest point that was followed by at least one lower point.
  // This captures the 2022 correction cycle rather than the current all-time high.
  let peakIdx = 0
  for (let i = 1; i < seriesData.length - 1; i++) {
    if (seriesData[i].index > seriesData[peakIdx].index) {
      // Only accept as peak if a later point is lower (i.e., it's a local maximum)
      const hasLowerAfter = seriesData.slice(i + 1).some(s => s.index < seriesData[i].index)
      if (hasLowerAfter) peakIdx = i
    }
  }
  const peak = seriesData[peakIdx]

  // Trough: lowest point after the local peak
  let trough = peak
  for (let i = peakIdx + 1; i < seriesData.length; i++) {
    if (seriesData[i].index < trough.index) trough = seriesData[i]
  }

  const current = seriesData[seriesData.length - 1]
  const changeFromPeak = parseFloat(((current.index - peak.index) / peak.index * 100).toFixed(1))

  const priceIndexSeries = seriesData.map(s => ({
    month: s.month,
    label: `${s.month.slice(2, 4)}-${s.month.slice(4, 6)}`,
    index: parseFloat(s.index.toFixed(2)),
  }))

  // Jeonse ratio per district
  const saleMap   = new Map(currentRows.map(r => [r.gu, r.index]))
  const jeonseMap = new Map(jeonseRows.map(r => [r.gu, r.index]))

  const jeonseByGu = currentRows
    .filter(r => jeonseMap.has(r.gu))
    .map(r => ({
      gu:          r.gu,
      saleIndex:   parseFloat(r.index.toFixed(1)),
      jeonseIndex: parseFloat((jeonseMap.get(r.gu)!).toFixed(1)),
      jeonseRatio: parseFloat((jeonseMap.get(r.gu)! / r.index * 100).toFixed(1)),
    }))
    .sort((a, b) => b.jeonseRatio - a.jeonseRatio)

  return {
    priceIndexSeries,
    jeonseByGu,
    hasPriceData:   true,
    dataMonth:      currentYm,
    peakIndex:      parseFloat(peak.index.toFixed(2)),
    peakMonth:      peak.month,
    troughIndex:    parseFloat(trough.index.toFixed(2)),
    currentIndex:   parseFloat(current.index.toFixed(2)),
    changeFromPeak,
  }
}

// ── Route handler ──────────────────────────────────────────────

export async function GET() {
  ensureSeeded()

  let volumeByDistrict: { gu: string; month: string; volume: number }[] = []
  try { volumeByDistrict = getMonthlyVolumeByDistrict() } catch { /* empty DB */ }

  const [priceData, realVolume] = await Promise.all([
    getRealPriceData(),
    Promise.resolve(getRealVolume()),
  ])

  const VOLUME_HISTORICAL_AVERAGE = 6500 // 2015-2019 평균 (부동산원 공표 수치)
  const VOLUME_PEAK = 11200              // 2020-07

  return NextResponse.json({
    // Real data from MOLIT DB
    monthlyVolume: realVolume,
    monthlyVolumeByDistrict: volumeByDistrict,
    volumeHistoricalAvg: VOLUME_HISTORICAL_AVERAGE,
    volumePeak: VOLUME_PEAK,
    volumeIsReal: realVolume.length > 0,

    // Real data from R-ONE price index (if API key set)
    priceIndexSeries:  priceData.priceIndexSeries,
    jeonseByGu:        priceData.jeonseByGu,
    hasPriceData:      priceData.hasPriceData,
    priceDataMonth:    priceData.dataMonth,
    peakIndex:         priceData.peakIndex,
    peakMonth:         priceData.peakMonth,
    troughIndex:       priceData.troughIndex,
    currentIndex:      priceData.currentIndex,
    changeFromPeak:    priceData.changeFromPeak,

    // Still estimated — no free public API available
    askTransactionGap:  require('@/lib/market-reality').ASK_TRANSACTION_GAP,
    factChecks:         FACT_CHECKS,
    sellerDenial:       SELLER_DENIAL,
    districtAskGap:     DISTRICT_ASK_GAP,
  })
}
