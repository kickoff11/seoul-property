/**
 * MOLIT (국토교통부) Apartment Transaction API Client
 *
 * Data source: https://www.data.go.kr
 * API name: 국토교통부_아파트매매 실거래 상세 자료
 *
 * Without MOLIT_API_KEY, the app generates realistic mock data so you can
 * explore the UI immediately. Set USE_MOCK_DATA=false to disable the fallback.
 */

import { ApartmentTransaction } from '@/types'
import { SEOUL_DISTRICTS, PRICE_MULTIPLIERS } from './seoul-districts'
import { parseStringPromise } from 'xml2js'

const MOLIT_API_BASE =
  'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade'

// ────────────────────────────────────────────────────────────────
// API types (MOLIT XML response shape — 아파트매매 실거래가 자료)
// ────────────────────────────────────────────────────────────────

interface MolitItem {
  aptNm:       string[]   // apartment name
  umdNm:       string[]   // legal dong
  sggCd:       string[]   // district code
  dealAmount:  string[]   // transaction amount (만원, comma-separated)
  excluUseAr:  string[]   // exclusive area (m²)
  floor:       string[]
  buildYear:   string[]
  dealYear:    string[]
  dealMonth:   string[]
  dealDay:     string[]
  jibun?:      string[]
}

function parseAmount(raw: string): number {
  return parseInt(raw.replace(/,/g, '').trim(), 10) || 0
}

function first(arr: string[] | undefined): string {
  return arr?.[0]?.trim() ?? ''
}

function mapItem(item: MolitItem, gu: string): ApartmentTransaction {
  const amount    = parseAmount(first(item.dealAmount))
  const area      = parseFloat(first(item.excluUseAr)) || 0
  const pricePerM2 = area > 0 ? Math.round(amount / area) : 0
  const year      = first(item.dealYear)
  const month     = first(item.dealMonth).padStart(2, '0')
  const day       = first(item.dealDay).padStart(2, '0')
  const lawdCd    = first(item.sggCd)
  const aptName   = first(item.aptNm)
  const floor     = first(item.floor)

  return {
    id:         `${lawdCd}-${aptName}-${year}${month}${day}-${floor}`,
    aptName,
    dong:       first(item.umdNm),
    gu,
    lawdCd,
    amount,
    area,
    floor:      parseInt(floor, 10) || 1,
    builtYear:  parseInt(first(item.buildYear), 10) || 2000,
    dealYear:   parseInt(year, 10),
    dealMonth:  parseInt(month, 10),
    dealDay:    parseInt(day, 10),
    dealDate:   `${year}-${month}-${day}`,
    lotNumber:  first(item.jibun) || undefined,
    pricePerM2,
  }
}

export async function fetchTransactionsFromApi(
  lawdCd: string,
  dealYmd: string, // YYYYMM
): Promise<ApartmentTransaction[]> {
  const apiKey = process.env.MOLIT_API_KEY

  // Explicit dev override: USE_MOCK_DATA=true in .env.local
  if (process.env.USE_MOCK_DATA === 'true') {
    return generateMockTransactions(lawdCd, dealYmd)
  }

  if (!apiKey) return []  // no key configured — return empty, don't fake data

  // Throws on API/network errors so the caller can avoid caching a failed
  // fetch as an empty result (which would block retries for 24 h after the
  // MOLIT daily quota resets).
  return fetchReal(apiKey, lawdCd, dealYmd)
}

async function fetchReal(
  apiKey: string,
  lawdCd: string,
  dealYmd: string,
): Promise<ApartmentTransaction[]> {
  const district = SEOUL_DISTRICTS.find(d => d.code === lawdCd)
  const gu       = district?.name ?? ''
  const results: ApartmentTransaction[] = []
  let pageNo = 1

  while (true) {
    const url = new URL(MOLIT_API_BASE)
    url.searchParams.set('serviceKey', apiKey)
    url.searchParams.set('LAWD_CD', lawdCd)
    url.searchParams.set('DEAL_YMD', dealYmd)
    url.searchParams.set('pageNo', String(pageNo))
    url.searchParams.set('numOfRows', '100')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`MOLIT API ${res.status}: ${await res.text()}`)

    const xml  = await res.text()
    const parsed = await parseStringPromise(xml)
    const body = parsed?.response?.body?.[0]

    if (!body) break

    const totalCount = parseInt(body.totalCount?.[0] ?? '0', 10)
    const itemsEl    = body.items?.[0]
    if (!itemsEl || itemsEl === '' || !itemsEl.item) break

    const items: MolitItem[] = Array.isArray(itemsEl.item)
      ? itemsEl.item
      : [itemsEl.item]

    results.push(...items.map(i => mapItem(i, gu)))

    if (results.length >= totalCount) break
    pageNo++
  }

  return results
}

// ────────────────────────────────────────────────────────────────
// Mock data — realistic Seoul apartment transactions
// Calibrated to match the actual Seoul market cycle:
//   2015-2019  steady growth
//   2020-2021  boom (low rates + pandemic demand)
//   2022       sharp correction (rate hikes)
//   2023       trough / slow recovery
//   2024-2026  high-price plateau, volume below normal
// ────────────────────────────────────────────────────────────────

const BASE_PRICE_PER_M2 = 1000 // 만원 — Seoul city-wide average (2021 peak basis)

// Price index relative to 2021 peak per year
const PRICE_CYCLE: Record<number, number> = {
  2015: 0.58, 2016: 0.62, 2017: 0.67, 2018: 0.73, 2019: 0.76,
  2020: 0.87, 2021: 1.00, 2022: 0.91, 2023: 0.86,
  2024: 0.95, 2025: 1.03, 2026: 1.05,
}

// Volume scale relative to 2021 per year (Seoul 연간 거래량 기반)
const VOLUME_CYCLE: Record<number, number> = {
  2015: 0.98, 2016: 1.05, 2017: 1.08, 2018: 0.92, 2019: 0.88,
  2020: 1.45, 2021: 1.25, 2022: 0.52, 2023: 0.62,
  2024: 0.82, 2025: 0.80, 2026: 0.72,
}

// Monthly seasonal multipliers (Jan=0 … Dec=11)
// Spring (Mar/Apr) and autumn (Oct) peak; Dec/Jan trough
const SEASONAL: number[] = [0.68, 0.72, 1.18, 1.22, 1.05, 0.92, 1.00, 0.95, 1.12, 1.18, 0.88, 0.62]

const TYPICAL_AREAS = [33, 49, 59, 74, 84, 99, 115, 135, 162]
const FLOORS = [3, 5, 7, 9, 11, 12, 14, 15, 17, 20, 22, 25, 28]

const APT_NAMES: Record<string, string[]> = {
  '11680': ['래미안대치팰리스', '도곡렉슬', '개포주공', '타워팰리스', '삼성힐스테이트', '대치아이파크'],
  '11650': ['반포자이', '아크로리버파크', '래미안퍼스티지', '반포리체', '서초포레스타', '방배그랑자이'],
  '11710': ['헬리오시티', '파크리오', '잠실엘스', '리센츠', '트리지움', '가락현대'],
  '11170': ['래미안용산', '용산파크웨이', '한강맨션', '이촌코오롱', '시티파크', '용산아이파크'],
  '11440': ['마포래미안', '공덕자이', '신촌그랑자이', '마포푸르지오', '염리삼성', '마포리버웨이'],
  '11200': ['왕십리자이', '센트라스', '성수아이파크', '뚝섬한강래미안', '서울숲리버뷰', '행당한진'],
}

const DONG_NAMES: Record<string, string[]> = {
  '11680': ['역삼동', '삼성동', '대치동', '논현동', '청담동', '신사동', '압구정동'],
  '11650': ['반포동', '서초동', '방배동', '잠원동', '양재동', '우면동'],
  '11710': ['잠실동', '신천동', '가락동', '문정동', '방이동', '오금동'],
  '11170': ['이촌동', '한남동', '용산동', '원효로', '효창동', '청파동'],
  '11440': ['공덕동', '마포동', '염리동', '신수동', '서교동', '합정동'],
}

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

export function generateMockTransactions(lawdCd: string, dealYmd: string): ApartmentTransaction[] {
  const year = parseInt(dealYmd.slice(0, 4), 10)
  const month = parseInt(dealYmd.slice(4, 6), 10)
  const districtMultiplier = PRICE_MULTIPLIERS[lawdCd] ?? 1.2
  const district = SEOUL_DISTRICTS.find(d => d.code === lawdCd)
  const gu = district?.name ?? '서울시'

  const aptPool = APT_NAMES[lawdCd] ?? [
    `${gu.slice(0, 2)} 래미안`, `${gu.slice(0, 2)} 힐스테이트`,
    `${gu.slice(0, 2)} 자이`, `${gu.slice(0, 2)} 푸르지오`,
    `${gu.slice(0, 2)} 아이파크`, `${gu.slice(0, 2)} e편한세상`,
  ]
  const dongPool = DONG_NAMES[lawdCd] ?? [`${gu.slice(0, 2)}동`, `신${gu.slice(0, 2)}동`]

  // Apply market cycle + seasonal multipliers so the chart shows realistic patterns
  const priceCycle  = PRICE_CYCLE[year]  ?? (year < 2015 ? 0.55 : 1.05)
  const volumeCycle = VOLUME_CYCLE[year] ?? (year < 2015 ? 0.90 : 0.72)
  const seasonal    = SEASONAL[month - 1] ?? 1.0

  // Base count per district: larger / more active districts get more
  const baseCount = 30 + districtMultiplier * 18 + (parseInt(lawdCd) % 25)
  const count = Math.max(3, Math.round(baseCount * volumeCycle * seasonal))

  const rng = seededRng(parseInt(lawdCd) * 31 + month * 7 + year)

  return Array.from({ length: count }, (_, i) => {
    const area = TYPICAL_AREAS[Math.floor(rng() * TYPICAL_AREAS.length)]
    // Price varies within ±22% of the cycle-adjusted mean
    const ppm2 = Math.round(BASE_PRICE_PER_M2 * districtMultiplier * priceCycle * (0.78 + rng() * 0.44))
    const amount = Math.round((area * ppm2) / 500) * 500 // round to 500만원
    const floor = FLOORS[Math.floor(rng() * FLOORS.length)]
    const builtYear = 1985 + Math.floor(rng() * 38)
    const day = 1 + Math.floor(rng() * 27)
    const aptName = aptPool[Math.floor(rng() * aptPool.length)]
    const dong = dongPool[Math.floor(rng() * dongPool.length)]

    return {
      id: `mock-${lawdCd}-${year}${month}-${i}`,
      aptName,
      dong,
      gu,
      lawdCd,
      amount,
      area,
      floor,
      builtYear,
      dealYear: year,
      dealMonth: month,
      dealDay: day,
      dealDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      pricePerM2: ppm2,
    }
  })
}
