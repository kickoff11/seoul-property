export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getComplexTransactions, getComplexMonthlyTrends } from '@/lib/db'

export async function GET(req: NextRequest) {
  const aptName = req.nextUrl.searchParams.get('name') ?? ''
  const gu      = req.nextUrl.searchParams.get('gu')   ?? undefined

  if (!aptName) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const transactions = getComplexTransactions(aptName, gu)
  const trends       = getComplexMonthlyTrends(aptName, gu)

  if (!transactions.length) {
    return NextResponse.json({ transactions: [], trends: [], summary: null })
  }

  const amounts   = transactions.map(t => t.amount)
  const ppm2s     = transactions.map(t => t.pricePerM2)
  const areas     = [...new Set(transactions.map(t => t.area))].sort((a, b) => a - b)
  const latest    = transactions[0]
  const sortedAmt = [...amounts].sort((a, b) => a - b)
  const mid       = Math.floor(sortedAmt.length / 2)
  const medianAmt = sortedAmt.length % 2 === 1
    ? sortedAmt[mid]
    : Math.round((sortedAmt[mid - 1] + sortedAmt[mid]) / 2)

  const summary = {
    aptName:     latest.aptName,
    gu:          latest.gu,
    dong:        latest.dong,
    builtYear:   latest.builtYear,
    roadAddress: latest.roadAddress ?? null,
    totalDeals:  transactions.length,
    avgAmount:   Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length),
    medianAmount: medianAmt,
    minAmount:   Math.min(...amounts),
    maxAmount:   Math.max(...amounts),
    avgPricePerM2: Math.round(ppm2s.reduce((s, v) => s + v, 0) / ppm2s.length),
    minPricePerM2: Math.min(...ppm2s),
    maxPricePerM2: Math.max(...ppm2s),
    latestDeal:  latest.dealDate,
    latestPrice: latest.amount,
    areaTypes:   areas,
  }

  return NextResponse.json({ transactions, trends, summary }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
