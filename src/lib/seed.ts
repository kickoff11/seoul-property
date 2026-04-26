/**
 * Seed / refresh the local SQLite cache from the MOLIT API.
 *
 * NEVER blocks the caller — always fires seeding in the background and
 * returns immediately. API routes should handle empty DB gracefully
 * (return empty arrays) and the frontend will auto-retry.
 *
 * Strategy:
 *  - Empty DB: kick off background seed for last `months` months
 *  - Non-empty DB: background refresh of last 2 months once per hour
 */

import { fetchTransactionsFromApi } from './molit-api'
import { isCached, saveTransactions, getTotalCount } from './db'
import { SEOUL_DISTRICTS } from './seoul-districts'

const REFRESH_INTERVAL_MS = 60 * 60 * 1_000
let lastRefreshedAt = 0
let activeSeed: Promise<void> | null = null   // prevent concurrent seeds

export function ensureSeeded(months = 6): void {
  if (activeSeed) return   // seed already running

  const count = getTotalCount()

  if (count === 0) {
    activeSeed = seedMonths(months)
      .then(() => { lastRefreshedAt = Date.now() })
      .catch(err => console.error('[seed] initial seed failed', err))
      .finally(() => { activeSeed = null })
    return
  }

  if (Date.now() - lastRefreshedAt > REFRESH_INTERVAL_MS) {
    lastRefreshedAt = Date.now()
    activeSeed = seedMonths(2)
      .catch(err => console.error('[seed] refresh failed', err))
      .finally(() => { activeSeed = null })
  }
}

/** True while the initial seed is in progress (DB still empty or filling) */
export function isSeeding(): boolean {
  return activeSeed !== null && getTotalCount() === 0
}

async function seedMonths(months: number): Promise<void> {
  const now = new Date()
  for (let m = 0; m < months; m++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
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
