export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/seed'
import { getMonthlyTrends } from '@/lib/db'
import { buildTrends } from '@/lib/analysis'

export async function GET(req: NextRequest) {
  ensureSeeded()

  const lawdCd = req.nextUrl.searchParams.get('lawdCd') ?? undefined
  const rows   = getMonthlyTrends(lawdCd)
  const data   = buildTrends(rows)

  return NextResponse.json({ data, lawdCd: lawdCd ?? 'all' }, { headers: { 'Cache-Control': 'no-store' } })
}
