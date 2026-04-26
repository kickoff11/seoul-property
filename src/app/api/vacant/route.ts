export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/seed'
import { getInactiveComplexes } from '@/lib/db'
import { monthsInactive } from '@/lib/analysis'
import { MOCK_VACANT_COMPLEXES } from '@/lib/vacant-data'

export async function GET(req: NextRequest) {
  ensureSeeded()

  const threshold = parseInt(req.nextUrl.searchParams.get('months') ?? '18')
  const rows      = getInactiveComplexes(threshold)

  if (rows.length > 0) {
    // Real DB data is available (production with actual MOLIT data)
    const data = rows.map(r => ({
      ...r,
      monthsInactive: monthsInactive(r.lastDealDate),
      avgArea: Math.round(r.avgArea),
    }))
    return NextResponse.json({ data, threshold, source: 'db' })
  }

  // DB only has recent mock data — fall back to static dataset
  const data = MOCK_VACANT_COMPLEXES.filter(c => c.monthsInactive >= threshold)
  return NextResponse.json({ data, threshold, source: 'mock' })
}
