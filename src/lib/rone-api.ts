/**
 * 한국부동산원 R-ONE Open API client
 *
 * Used for:
 *  - Apartment price index by Seoul district (STATBL_ID: A_2024_00010, monthly)
 *
 * Key tables discovered:
 *  A_2024_00010 — 아파트 매매가격지수 (monthly, by district)
 *  A_2024_00060 — 아파트 평균 매매가격 (monthly, by district)
 *  A_2024_00900 — 아파트 매매가격지수 (annual)
 */

const RONE_BASE = 'https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do'

interface RoneRow {
  STATBL_ID:       string
  DTACYCLE_CD:     string
  WRTTIME_IDTFR_ID: string
  CLS_NM:          string
  CLS_FULLNM:      string
  ITM_NM:          string
  DTA_VAL:         number | null
  WRTTIME_DESC:    string
}

async function fetchRoneTable(
  statblId: string,
  dtaCycle: 'MM' | 'YY',
  period: string,   // YYYYMM for MM, YYYY for YY
  pageSize = 500,
): Promise<RoneRow[]> {
  const key = process.env.RONE_API_KEY
  if (!key) return []

  const url = new URL(RONE_BASE)
  url.searchParams.set('KEY',              key)
  url.searchParams.set('STATBL_ID',        statblId)
  url.searchParams.set('DTACYCLE_CD',      dtaCycle)
  url.searchParams.set('WRTTIME_IDTFR_ID', period)
  url.searchParams.set('Type',             'json')
  url.searchParams.set('pIndex',           '1')
  url.searchParams.set('pSize',            String(pageSize))

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)
  if (!res || !res.ok) return []

  const data = await res.json()
  const tables = data?.SttsApiTblData
  if (!Array.isArray(tables) || tables.length < 2) return []
  return tables[1]?.row ?? []
}

// ── Seoul district price index ─────────────────────────────────
// Returns index values (base 100) for each Seoul district for a given month.
// Index < 100 means prices are below the base period level.
export async function fetchSeoulPriceIndex(
  yearMonth: string,  // YYYYMM
): Promise<{ gu: string; index: number }[]> {
  const rows = await fetchRoneTable('A_2024_00010', 'MM', yearMonth)
  return rows
    .filter(r => r.CLS_FULLNM?.startsWith('서울>') && r.DTA_VAL != null)
    .map(r => ({
      gu:    r.CLS_NM,
      index: parseFloat(String(r.DTA_VAL)),
    }))
}

// ── Multi-month price index for a district ─────────────────────
// Fetches the last N months for all Seoul districts.
export async function fetchSeoulPriceIndexRange(
  months: string[],  // array of YYYYMM strings
): Promise<Map<string, Map<string, number>>> {
  // Returns: Map<gu, Map<yearMonth, index>>
  const result = new Map<string, Map<string, number>>()

  await Promise.all(months.map(async ym => {
    const rows = await fetchSeoulPriceIndex(ym)
    for (const { gu, index } of rows) {
      if (!result.has(gu)) result.set(gu, new Map())
      result.get(gu)!.set(ym, index)
    }
  }))

  return result
}

// ── Seoul city-level index time series ────────────────────────
// A_2024_00010 has no city-aggregate row — only district (구) level.
// Computes the simple average across all Seoul districts for each month.
export async function fetchSeoulCityIndexSeries(
  months: string[],  // YYYYMM strings
): Promise<{ month: string; index: number }[]> {
  const results = await Promise.all(months.map(async ym => {
    const distRows = await fetchSeoulPriceIndex(ym)
    if (distRows.length === 0) return null
    const avg = distRows.reduce((s, r) => s + r.index, 0) / distRows.length
    return { month: ym, index: avg }
  }))
  return results.filter((x): x is { month: string; index: number } => x !== null)
}

// ── Seoul district jeonse price index ─────────────────────────
// Table A_2024_00045 — 아파트 전세가격지수 (monthly, by district, base 100)
// CLS_FULLNM structure: 서울>지역>권역>구 (4 segments for gu level)
export async function fetchSeoulJeonseIndex(
  yearMonth: string,  // YYYYMM
): Promise<{ gu: string; index: number }[]> {
  const rows = await fetchRoneTable('A_2024_00045', 'MM', yearMonth)
  return rows
    .filter(r => r.CLS_FULLNM?.startsWith('서울>') && r.CLS_FULLNM.split('>').length === 4 && r.DTA_VAL != null)
    .map(r => ({
      gu:    r.CLS_NM,
      index: parseFloat(String(r.DTA_VAL)),
    }))
}
