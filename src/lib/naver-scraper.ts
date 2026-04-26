/**
 * Naver Real Estate listing scraper
 *
 * Fetches current asking prices from land.naver.com and compares them against
 * MOLIT actual transaction prices.  The gap between asking and actual is the
 * single clearest measure of market opacity.
 *
 * Naver's internal API is used (same endpoints the web/app client calls).
 * Rate-limited to 1 req/s to be respectful.
 */

import { NaverListing, PriceGap, ApartmentTransaction } from '@/types'
import { NAVER_CORTAR } from './seoul-districts'

const NAVER_BASE = 'https://m.land.naver.com'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Referer: 'https://m.land.naver.com/',
  Accept: 'application/json, text/plain, */*',
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Types matching Naver's response ───────────────────────────

interface NaverArticle {
  atclNm:    string  // 단지명
  dtlAdres?: string  // 상세주소
  rletTpNm:  string  // 매물유형
  tradTpNm:  string  // 거래유형
  prc:       number  // 가격 (만원)
  spc1:      string  // 공급면적
  spc2:      string  // 전용면적
  flrInfo:   string  // 층 정보
}

interface NaverArticleListResponse {
  isMoreData: boolean
  articleList?: NaverArticle[]
  body?: NaverArticle[]
}

/**
 * Fetch apartment sale listings for a Seoul district (구).
 * @param lawdCd  5-digit MOLIT district code (e.g. '11680' for 강남구)
 * @param maxPages how many pages to fetch (each page = 20 listings)
 */
export async function fetchNaverListings(
  lawdCd: string,
  maxPages = 3,
): Promise<NaverListing[]> {
  const cortarNo = NAVER_CORTAR[lawdCd]
  if (!cortarNo) return []

  const listings: NaverListing[] = []

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url =
        `${NAVER_BASE}/cluster/ajax/articleList` +
        `?cortarNo=${cortarNo}` +
        `&rletTpCd=APT` +
        `&tradTpCd=A1` +        // A1 = 매매
        `&order=rank` +
        `&page=${page}`

      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) break

      const data: NaverArticleListResponse = await res.json()
      const articles = data.articleList ?? data.body ?? []

      for (const a of articles) {
        const area = parseFloat(a.spc2) || parseFloat(a.spc1) || 0
        if (area < 10 || a.prc < 1000) continue // filter junk
        listings.push({
          aptName:      a.atclNm,
          dong:         a.dtlAdres?.split(' ').slice(-1)[0] ?? '',
          gu:           '',   // filled by caller if needed
          listingPrice: a.prc,
          area,
          floor:        a.flrInfo,
          source:       'naver',
        })
      }

      if (!data.isMoreData) break
      await sleep(1000) // be polite
    } catch {
      break // Naver blocks or network error — stop gracefully
    }
  }

  return listings
}

/**
 * Compare Naver listing prices with MOLIT transaction prices for the same
 * apartment complexes.  Returns complexes where the asking price is
 * significantly above the actual transaction price.
 */
export function computePriceGaps(
  listings: NaverListing[],
  transactions: ApartmentTransaction[],
): PriceGap[] {
  // Group transactions by apt name + area bucket
  const txMap = new Map<string, number[]>()
  for (const t of transactions) {
    const bucket = Math.round(t.area / 10) * 10 // bucket to nearest 10m²
    const key = `${t.aptName}||${bucket}`
    if (!txMap.has(key)) txMap.set(key, [])
    txMap.get(key)!.push(t.amount)
  }

  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length

  const gaps: PriceGap[] = []

  for (const l of listings) {
    const bucket = Math.round(l.area / 10) * 10
    const key = `${l.aptName}||${bucket}`
    const txAmounts = txMap.get(key)
    if (!txAmounts || txAmounts.length === 0) continue

    const avgTx = avg(txAmounts)
    const gapPct = ((l.listingPrice - avgTx) / avgTx) * 100

    gaps.push({
      aptName:              l.aptName,
      dong:                 l.dong,
      gu:                   l.gu,
      avgTransactionPrice:  Math.round(avgTx),
      avgListingPrice:      l.listingPrice,
      gapPct:               Math.round(gapPct * 10) / 10,
      area:                 l.area,
    })
  }

  // Sort by largest overpricing first
  return gaps
    .filter(g => g.gapPct > 5)
    .sort((a, b) => b.gapPct - a.gapPct)
    .slice(0, 30)
}
