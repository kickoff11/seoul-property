export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/seed'
import { fetchTransactionsFromApi } from '@/lib/molit-api'
import { isCached, saveTransactions, getTransactions } from '@/lib/db'

export async function GET(req: NextRequest) {
  ensureSeeded()

  const p = req.nextUrl.searchParams
  const lawdCd  = p.get('lawdCd') ?? ''
  const year    = p.get('year')   ? parseInt(p.get('year')!)   : undefined
  const month   = p.get('month')  ? parseInt(p.get('month')!)  : undefined
  const aptName = p.get('aptName') ?? undefined
  const limit   = parseInt(p.get('limit') ?? '200')
  const offset  = parseInt(p.get('offset') ?? '0')

  // Fetch fresh data for a specific district+month if requested
  if (lawdCd && month && year) {
    const ymd = `${year}${String(month).padStart(2, '0')}`
    if (!isCached(lawdCd, ymd)) {
      const txs = await fetchTransactionsFromApi(lawdCd, ymd)
      saveTransactions(txs, lawdCd, ymd)
    }
  }

  const data = getTransactions({ lawdCd: lawdCd || undefined, year, aptName, limit, offset })

  return NextResponse.json({
    data,
    count: data.length,
    source: process.env.MOLIT_API_KEY ? 'molit-api' : 'mock',
  })
}
