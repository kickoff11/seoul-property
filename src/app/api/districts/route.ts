import { NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/seed'
import { getDistrictSummary } from '@/lib/db'
import { DISTRICT_BY_CODE } from '@/lib/seoul-districts'

export async function GET() {
  await ensureSeeded()

  const rows = getDistrictSummary()
  const data = rows.map(r => ({
    ...r,
    avgAmount:     Math.round(r.avgAmount),
    avgPricePerM2: Math.round(r.avgPricePerM2),
    district:      DISTRICT_BY_CODE[r.lawdCd],
  }))

  return NextResponse.json({ data })
}
