export const dynamic = 'force-dynamic'
/**
 * /api/gaps — Ask price vs actual transaction price gap analysis.
 *
 * Live Naver scraping is attempted but Naver blocks automated requests, so
 * the response always includes the rich estimated gap dataset from KB부동산
 * indices as a reliable fallback.  The live comparison is shown when
 * available; the estimated data is shown regardless.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/seed'
import { getTransactions } from '@/lib/db'
import { fetchNaverListings, computePriceGaps } from '@/lib/naver-scraper'
import {
  DISTRICT_ASK_GAP,
  ASK_TRANSACTION_GAP,
} from '@/lib/market-reality'

export async function GET(req: NextRequest) {
  ensureSeeded()

  const lawdCd = req.nextUrl.searchParams.get('lawdCd') ?? '11680' // default: 강남구

  // Try live Naver scrape — silently falls back to [] if blocked
  const [listings, transactions] = await Promise.all([
    fetchNaverListings(lawdCd, 2).catch(() => []),
    Promise.resolve(getTransactions({ lawdCd, limit: 500 })),
  ])

  const liveGaps     = computePriceGaps(listings, transactions)
  const naverBlocked = listings.length === 0

  return NextResponse.json({
    // Live comparison (empty if Naver blocked)
    data:             liveGaps,
    listingCount:     listings.length,
    transactionCount: transactions.length,
    naverBlocked,
    lawdCd,

    // Estimated gap data — always available
    districtAskGap:   DISTRICT_ASK_GAP,
    askTransactionGap: ASK_TRANSACTION_GAP,
  })
}
