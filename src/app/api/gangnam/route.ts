export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureSeeded, isMockFallback } from '@/lib/seed'
import {
  getMonthlyTrends,
  getGangnamPriceTiersByMonth,
  getGangnamTopApts,
} from '@/lib/db'
import { buildTrends } from '@/lib/analysis'

const POLICY_MONTH = '2025-10' // 10·15 대출규제 시행

export async function GET() {
  ensureSeeded()

  const trendRows  = getMonthlyTrends('11680')
  const trends     = buildTrends(trendRows)
  const priceTiers = getGangnamPriceTiersByMonth()
  const topApts    = getGangnamTopApts(12).map(a => ({
    ...a,
    avgAmount:     Math.round(a.avgAmount),
    avgPricePerM2: Math.round(a.avgPricePerM2),
    maxAmount:     Math.round(a.maxAmount),
  }))

  // Pre/post policy comparison (use only months with enough data)
  const preMonths  = trends.filter(t => t.month < POLICY_MONTH)
  const postMonths = trends.filter(t => t.month >= POLICY_MONTH)

  function avg(arr: number[]) {
    return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
  }

  const prePolicy = {
    avgMonthly: avg(preMonths.map(t => t.transactionCount)),
    avgPrice:   avg(preMonths.map(t => t.avgPrice)),
    months:     preMonths.length,
  }
  const postPolicy = {
    avgMonthly: avg(postMonths.map(t => t.transactionCount)),
    avgPrice:   avg(postMonths.map(t => t.avgPrice)),
    months:     postMonths.length,
  }

  return NextResponse.json({
    trends,
    priceTiers,
    topApts,
    prePolicy,
    postPolicy,
    isMock: isMockFallback(),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
