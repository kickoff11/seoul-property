export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { isSeeding } from '@/lib/seed'

export async function GET() {
  const db = getDb()

  const months = db.prepare(`
    SELECT
      deal_year || '-' || printf('%02d', deal_month) AS month,
      COUNT(*)                AS txCount,
      COUNT(DISTINCT lawd_cd) AS districtCount
    FROM transactions
    GROUP BY deal_year, deal_month
    ORDER BY deal_year DESC, deal_month DESC
  `).all()

  const total = db.prepare(`SELECT COUNT(*) as n FROM transactions`).get() as { n: number }
  const cached = db.prepare(`SELECT COUNT(*) as n FROM cache_log`).get() as { n: number }

  return NextResponse.json({
    seeding: isSeeding(),
    totalTransactions: total.n,
    cachedEntries: cached?.n ?? 'no cache_log table',
    months,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
