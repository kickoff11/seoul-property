export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getMonthlyTrends, getTotalCount, getMonthlyVolume } from '@/lib/db'
import { isSeeding } from '@/lib/seed'

export async function GET() {
  const total = getTotalCount()
  const months = getMonthlyTrends()
  const volume = getMonthlyVolume()

  return NextResponse.json({
    seeding: isSeeding(),
    totalTransactions: total,
    monthsPassingFilter: months.length,
    months,
    rawMonthlyVolume: volume,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
