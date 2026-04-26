export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getMonthlyTrends, getTotalCount } from '@/lib/db'
import { isSeeding } from '@/lib/seed'

export async function GET() {
  const total = getTotalCount()
  const months = getMonthlyTrends()   // uses the current filter (districtCount >= 20)

  // Also get raw month breakdown without filter to diagnose
  const { getMonthlyVolume } = await import('@/lib/db')
  const volume = getMonthlyVolume()

  return NextResponse.json({
    seeding: isSeeding(),
    totalTransactions: total,
    monthsPassingFilter: months.length,
    months,
    rawMonthlyVolume: volume,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
