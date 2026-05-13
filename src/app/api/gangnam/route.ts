export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/seed'
import {
  getMonthlyTrends,
  getDistrictPriceTiersByMonth,
  getDistrictTopApts,
} from '@/lib/db'
import { buildTrends } from '@/lib/analysis'

const POLICY_MONTH = '2025-10' // 10·15 대출규제 시행
const POLICY_DATE  = '2025-10-01'

function fmt2(n: number) { return String(n).padStart(2, '0') }

/** Symmetric window: same number of complete months on each side of the policy. */
function symmetricWindow(): { preStart: string; postEnd: string; windowMonths: number } {
  const policyBase = new Date(POLICY_DATE)
  const now = new Date()
  // Complete months elapsed since policy month (exclude current partial month)
  const windowMonths =
    (now.getFullYear() - policyBase.getFullYear()) * 12 +
    (now.getMonth()    - policyBase.getMonth())

  const preStartDate = new Date(policyBase)
  preStartDate.setMonth(preStartDate.getMonth() - windowMonths)
  const preStart = `${preStartDate.getFullYear()}-${fmt2(preStartDate.getMonth() + 1)}-01`

  const postEndDate = new Date(policyBase)
  postEndDate.setMonth(postEndDate.getMonth() + windowMonths)
  const postEnd = `${postEndDate.getFullYear()}-${fmt2(postEndDate.getMonth() + 1)}-01`

  return { preStart, postEnd, windowMonths }
}

export async function GET(req: NextRequest) {
  ensureSeeded()

  const lawdCd = req.nextUrl.searchParams.get('lawdCd') ?? '11680'
  const { preStart, postEnd, windowMonths } = symmetricWindow()

  const trendRows  = getMonthlyTrends(lawdCd)
  const trends     = buildTrends(trendRows)
  const priceTiers = getDistrictPriceTiersByMonth(lawdCd)
  const topApts    = getDistrictTopApts(lawdCd, POLICY_DATE, preStart, postEnd, 12).map(a => ({
    ...a,
    avgAmountBefore: a.avgAmountBefore !== null ? Math.round(a.avgAmountBefore) : null,
    avgAmountAfter:  a.avgAmountAfter  !== null ? Math.round(a.avgAmountAfter)  : null,
    maxAmount:       Math.round(a.maxAmount),
  }))

  // Pre/post policy comparison
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
    topAptsWindowMonths: windowMonths,
    prePolicy,
    postPolicy,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
