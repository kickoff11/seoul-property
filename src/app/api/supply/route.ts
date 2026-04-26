export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ANNUAL_SUPPLY, SUPPLY_DEMAND, MAJOR_PROJECTS,
  DISTRICT_SUPPLY_2025_2027, ANNUAL_DEMAND_BASELINE,
} from '@/lib/supply-data'
import { ensureSeeded } from '@/lib/seed'
import { getDistrictSummary } from '@/lib/db'

export async function GET() {
  ensureSeeded()

  // Build a real avg price/m² lookup from MOLIT transaction data
  const summary = getDistrictSummary()
  const realPriceByGu: Record<string, number> = {}
  for (const row of summary) {
    realPriceByGu[row.gu] = Math.round(row.avgPricePerM2)
  }

  // Attach real market price to each project (from same 구 transactions)
  const projects = MAJOR_PROJECTS.map(p => ({
    ...p,
    avgTransactionPricePerM2: realPriceByGu[p.gu] ?? null,
  }))

  return NextResponse.json({
    annualSupply:         ANNUAL_SUPPLY,
    supplyDemand:         SUPPLY_DEMAND,
    majorProjects:        projects,
    districtSupply:       DISTRICT_SUPPLY_2025_2027,
    annualDemandBaseline: ANNUAL_DEMAND_BASELINE,
    realPriceByGu,
  })
}
