export const dynamic = 'force-dynamic'
/**
 * /api/demand
 *
 * Live data sources:
 *   기준금리        — BOK ECOS API (BOK_API_KEY required)
 *   주담대금리      — BOK ECOS API (BOK_API_KEY required)
 *   PIR / 월 상환  — computed from MOLIT median transaction price (live)
 *
 * Static sources (no free real-time API):
 *   매수심리지수     — KB부동산 보고서 기반 추정
 *   인구·가구수      — 통계청 (연간, 수동 업데이트)
 *
 * When BOK_API_KEY is not set, interest-rate data falls back to the
 * last known values in INTEREST_RATE_DATA.
 */

import { NextResponse } from 'next/server'
import {
  DEMOGRAPHIC_DATA, SENTIMENT_DATA, INTEREST_RATE_DATA,
  AFFORDABILITY_DATA, BUYER_AGE_DIST,
} from '@/lib/demand-data'
import { fetchBaseRateSeries, fetchMortgageRateSeries } from '@/lib/bok-api'
import { ensureSeeded } from '@/lib/seed'
import { getMedianTransactionPrice } from '@/lib/db'
import type { InterestRatePoint, AffordabilityPoint } from '@/types'

// Seoul median annual household income (만원) — 통계청 기준, 약 2% 인상/년
// Update this constant each year when 통계청 releases the annual income survey.
const MEDIAN_HOUSEHOLD_INCOME_MAN_WON = 7_000  // 7,000만원 = 70,000,000원 (2024 기준)

// Monthly burden: assumes 30-year loan at current mortgage rate, 50% LTV
function computeMonthlyBurden(
  medianPriceMW: number,   // 만원
  mortgageRate:  number,   // annual %, e.g. 3.45
  ltvRatio = 0.5,
): number {
  const principal = medianPriceMW * ltvRatio  // 만원
  const monthlyRate = mortgageRate / 100 / 12
  const n = 30 * 12  // 360 months
  // Annuity formula: M = P * r / (1 - (1+r)^-n)
  const monthlyPaymentMW = monthlyRate === 0
    ? principal / n
    : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n))
  const monthlyIncomeMW = MEDIAN_HOUSEHOLD_INCOME_MAN_WON / 12
  return parseFloat((monthlyPaymentMW / monthlyIncomeMW * 100).toFixed(1))
}

export async function GET() {
  ensureSeeded()

  // ── Live interest rates from BOK ──────────────────────────────
  const [baseRateRows, mortgageRateRows] = await Promise.all([
    fetchBaseRateSeries(60),
    fetchMortgageRateSeries(60),
  ])

  let interestRates: InterestRatePoint[]

  if (baseRateRows.length > 0) {
    // Merge BOK live series with static historical (pre-2020) and deduplicate
    const liveMap = new Map<string, { baseRate: number; mortgageRate?: number }>()
    for (const r of baseRateRows)    liveMap.set(r.month, { baseRate: r.value })
    for (const r of mortgageRateRows) {
      if (liveMap.has(r.month)) liveMap.get(r.month)!.mortgageRate = r.value
    }

    // Start from static data for pre-live history, then overlay live data
    const staticCutoff = baseRateRows[0]?.month ?? '2020-01'
    const staticHistory = INTEREST_RATE_DATA.filter(r => r.month < staticCutoff)

    const livePoints: InterestRatePoint[] = Array.from(liveMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        baseRate:     v.baseRate,
        // If mortgage series unavailable for this month, interpolate from nearby static
        mortgageRate: v.mortgageRate
          ?? INTEREST_RATE_DATA.findLast(r => r.month <= month)?.mortgageRate
          ?? 3.45,
      }))

    interestRates = [...staticHistory, ...livePoints]
  } else {
    // No BOK key / API down — use static data
    interestRates = INTEREST_RATE_DATA
  }

  // ── Live PIR from MOLIT median transaction price ───────────────
  const medianPriceMW = getMedianTransactionPrice(3)  // last 3 months
  const latestRate    = interestRates.at(-1)

  let affordability: AffordabilityPoint[]

  if (medianPriceMW !== null && latestRate) {
    const pir = parseFloat((medianPriceMW / MEDIAN_HOUSEHOLD_INCOME_MAN_WON).toFixed(1))
    const monthlyBurden = computeMonthlyBurden(medianPriceMW, latestRate.mortgageRate)
    const currentYear = new Date().getFullYear()

    // Append a current-year entry (or replace if same year already in static data)
    const baseAfford = AFFORDABILITY_DATA.filter(a => a.year < currentYear)
    affordability = [
      ...baseAfford,
      { year: currentYear, pir, monthlyBurden },
    ]
  } else {
    affordability = AFFORDABILITY_DATA
  }

  const latestAfford = affordability.at(-1)!
  const latestSentiment = SENTIMENT_DATA.at(-1)!

  return NextResponse.json({
    demographics:  DEMOGRAPHIC_DATA,
    sentiment:     SENTIMENT_DATA,
    interestRates,
    affordability,
    buyerAgeDistribution: BUYER_AGE_DIST,
    // Convenience fields for dashboard KPIs
    marketSummary: {
      latestSentiment,
      latestRate:   latestRate ?? INTEREST_RATE_DATA.at(-1)!,
      latestPir:    latestAfford,
      liveRates:    baseRateRows.length > 0,   // true = BOK API is live
      livePir:      medianPriceMW !== null,    // true = computed from MOLIT data
    },
  })
}
