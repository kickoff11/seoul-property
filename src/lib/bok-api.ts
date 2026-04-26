/**
 * Bank of Korea ECOS Open API client
 *
 * Register for a free API key at: https://ecos.bok.or.kr/#/AuthKeyApply
 * Set BOK_API_KEY in .env.local
 *
 * Key stat codes used here:
 *   722Y001 / 0101000  — 한국은행 기준금리 (monthly)
 *   721Y001 / 3400000  — 주택담보대출 가중평균금리 신규취급액기준 (monthly)
 *
 * If the API key is missing or calls fail, all functions return [] and callers
 * fall back to the last known static value.
 */

const BOK_BASE = 'https://ecos.bok.or.kr/api'

interface EcosRow {
  TIME:       string  // YYYYMM
  DATA_VALUE: string  // numeric string, or '-' when no data
}

async function fetchEcosSeries(
  statCode:  string,
  itemCode:  string,
  startYm:   string,  // YYYYMM
  endYm:     string,  // YYYYMM
): Promise<{ month: string; value: number }[]> {
  const key = process.env.BOK_API_KEY
  if (!key) return []

  const url = [
    BOK_BASE, 'StatisticSearch', key, 'json', 'kr',
    '1', '100', statCode, 'M', startYm, endYm, itemCode,
  ].join('/')

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    const rows: EcosRow[] = data?.StatisticSearch?.row ?? []
    return rows
      .filter(r => r.DATA_VALUE && r.DATA_VALUE !== '-')
      .map(r => ({
        month: `${r.TIME.slice(0, 4)}-${r.TIME.slice(4, 6)}`,
        value: parseFloat(r.DATA_VALUE),
      }))
      .filter(r => !isNaN(r.value))
  } catch {
    return []
  }
}

function recentStartYm(monthsBack = 60): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsBack)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentYm(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 한국은행 기준금리 monthly series. Returns [] when key is missing/API fails. */
export async function fetchBaseRateSeries(
  monthsBack = 60,
): Promise<{ month: string; value: number }[]> {
  return fetchEcosSeries('722Y001', '0101000', recentStartYm(monthsBack), currentYm())
}

/**
 * 예금은행 주택담보대출 가중평균금리 (신규취급액기준).
 * Tries stat 721Y001 item 3400000. Returns [] on failure.
 */
export async function fetchMortgageRateSeries(
  monthsBack = 60,
): Promise<{ month: string; value: number }[]> {
  // Primary: 신규취급액 기준 주담대금리
  const primary = await fetchEcosSeries('721Y001', '3400000', recentStartYm(monthsBack), currentYm())
  if (primary.length > 0) return primary

  // Fallback stat code variant
  const fallback = await fetchEcosSeries('121Y006', '5120000', recentStartYm(monthsBack), currentYm())
  return fallback
}

/**
 * Returns the latest base rate and mortgage rate as single numbers.
 * Falls back to null if the API is unavailable.
 */
export async function fetchLatestRates(): Promise<{
  baseRate:     number
  mortgageRate: number
  asOf:         string   // YYYY-MM
} | null> {
  const [base, mortgage] = await Promise.all([
    fetchBaseRateSeries(6),
    fetchMortgageRateSeries(6),
  ])

  if (base.length === 0 && mortgage.length === 0) return null

  const latestBase     = base.at(-1)
  const latestMortgage = mortgage.at(-1)
  if (!latestBase && !latestMortgage) return null

  return {
    baseRate:     latestBase?.value     ?? 2.50,  // last known if missing
    mortgageRate: latestMortgage?.value ?? 3.45,
    asOf:         (latestBase ?? latestMortgage)!.month,
  }
}
