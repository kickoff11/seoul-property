import { NextResponse } from 'next/server'
import { HOUSING_POLICIES, SCENARIOS } from '@/lib/policy-data'

export async function GET() {
  return NextResponse.json({
    policies:  HOUSING_POLICIES,
    scenarios: SCENARIOS,
  })
}
