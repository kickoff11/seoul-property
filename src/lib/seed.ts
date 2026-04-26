/**
 * Seed / refresh the local SQLite cache from the MOLIT API.
 *
 * All 25 districts for a given month are fetched in parallel, then we
 * move to the next month. This turns the initial seed from ~150 sequential
 * HTTP calls (~60 s) down to 6 parallel rounds of 25 (~10 s).
 *
 * Refresh strategy:
 *  - Empty DB: fetch last `months` months for all districts.
 *  - Non-empty DB: refresh only the most recent 2 months, but at most once
 *    per hour per process (the 24 h isCached TTL prevents redundant API calls).
 */

import { fetchTransactionsFromApi } from './molit-api'
import { isCached, saveTransactions, getTotalCount } from './db'
import { SEOUL_DISTRICTS } from './seoul-districts'

const REFRESH_INTERVAL_MS = 60 * 60 * 1_000   // 1 hour between refreshes
let lastRefreshedAt = 0

export async function ensureSeeded(months = 6): Promise<void> {
  if (getTotalCount() === 0) {
    await seedMonths(months)
    lastRefreshedAt = Date.now()
    return
  }

  if (Date.now() - lastRefreshedAt > REFRESH_INTERVAL_MS) {
    lastRefreshedAt = Date.now()   // set before await to prevent concurrent races
    await seedMonths(2)
  }
}

async function seedMonths(months: number): Promise<void> {
  const now = new Date()

  for (let m = 0; m < months; m++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`

    // Fetch all 25 districts for this month in parallel
    await Promise.all(
      SEOUL_DISTRICTS.map(async district => {
        if (!isCached(district.code, ymd)) {
          const txs = await fetchTransactionsFromApi(district.code, ymd)
          saveTransactions(txs, district.code, ymd)
        }
      })
    )
  }
}
