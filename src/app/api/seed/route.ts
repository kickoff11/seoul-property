import { NextRequest, NextResponse } from 'next/server'
import { fetchTransactionsFromApi } from '@/lib/molit-api'
import { isCached, saveTransactions, getTotalCount } from '@/lib/db'
import { SEOUL_DISTRICTS } from '@/lib/seoul-districts'

export async function GET(req: NextRequest) {
  const months = Math.min(
    parseInt(req.nextUrl.searchParams.get('months') ?? '24', 10),
    36,
  )

  const now = new Date()
  let fetched = 0
  let skipped = 0

  for (const district of SEOUL_DISTRICTS) {
    for (let m = 0; m < months; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`

      if (isCached(district.code, ymd)) {
        skipped++
        continue
      }

      const txs = await fetchTransactionsFromApi(district.code, ymd)
      saveTransactions(txs, district.code, ymd)
      fetched++
    }
  }

  return NextResponse.json({
    ok: true,
    months,
    fetched,
    skipped,
    totalRecords: getTotalCount(),
  })
}
