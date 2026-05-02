/**
 * Seed / refresh the local SQLite cache from the MOLIT API.
 *
 * Two-phase strategy:
 *  1. Fast seed  — 12 most recent months, 25 concurrent per month.
 *                  Dashboard usable within ~5–10 s of cold start.
 *  2. Lazy seed  — after fast seed, quietly extends back to HISTORY_MONTHS
 *                  (10 years) using batches of LAZY_CONCURRENCY (5) with a
 *                  short pause between months so the MOLIT API isn't hammered.
 *
 * isSeeding() only reflects the fast seed so the dashboard spinner doesn't
 * stay up while history is being backfilled.
 */

import { fetchTransactionsFromApi } from './molit-api'
import { getCachedDistricts, saveTransactions, getTotalCount } from './db'
import { SEOUL_DISTRICTS } from './seoul-districts'

const REFRESH_INTERVAL_MS = 60 * 60 * 1_000
const FAST_MONTHS         = 12    // initial fast seed depth
const HISTORY_MONTHS      = 120   // target history for heatmap (10 years)
const FAST_CONCURRENCY    = 5     // districts per batch during fast seed (avoids MOLIT 429s)
const LAZY_CONCURRENCY    = 3     // districts per batch during lazy backfill
const FAST_PAUSE_MS       = 150   // ms between months during fast seed
const LAZY_PAUSE_MS       = 400   // ms between months during lazy backfill

let lastRefreshedAt = 0
let activeSeed: Promise<void> | null = null   // fast seed — blocks spinner
let historyRunning  = false                    // lazy backfill — silent

// ── Public API ────────────────────────────────────────────────

export function ensureSeeded(): void {
  if (activeSeed) return   // fast seed already in progress

  const count = getTotalCount()

  if (count === 0) {
    // Cold start: fast seed first, then kick off silent history backfill
    activeSeed = seedMonths(FAST_MONTHS, FAST_CONCURRENCY)
      .then(() => {
        lastRefreshedAt = Date.now()
        startHistoryBackfill()
      })
      .catch(err => console.error('[seed] fast seed failed', err))
      .finally(() => { activeSeed = null })
    return
  }

  // Warm DB: hourly refresh of last 2 months
  if (Date.now() - lastRefreshedAt > REFRESH_INTERVAL_MS) {
    lastRefreshedAt = Date.now()
    activeSeed = seedMonths(2, FAST_CONCURRENCY)
      .catch(err => console.error('[seed] refresh failed', err))
      .finally(() => { activeSeed = null })
  }
}

/** True only while the fast seed is running — drives the dashboard spinner */
export function isSeeding(): boolean {
  return activeSeed !== null
}

// ── Core seeding ──────────────────────────────────────────────

/**
 * Seed `months` months back from today, using up to `concurrency` parallel
 * district calls per month.
 */
async function seedMonths(months: number, concurrency: number): Promise<void> {
  const now = new Date()
  for (let m = 0; m < months; m++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
    const cached  = getCachedDistricts(ymd)
    const toFetch = SEOUL_DISTRICTS.filter(d => !cached.has(d.code))
    await runBatched(toFetch, concurrency, async district => {
      try {
        const txs = await fetchTransactionsFromApi(district.code, ymd)
        saveTransactions(txs, district.code, ymd)
      } catch (err) {
        console.warn(`[seed] skipping ${district.name} ${ymd}:`, (err as Error).message)
      }
    })
    if (toFetch.length > 0) {
      await new Promise(r => setTimeout(r, FAST_PAUSE_MS))
    }
  }
}

// ── Lazy history backfill ─────────────────────────────────────

function startHistoryBackfill(): void {
  if (historyRunning) return
  historyRunning = true
  backfillHistory()
    .catch(err => console.error('[seed] history backfill failed', err))
    .finally(() => { historyRunning = false })
}

async function backfillHistory(): Promise<void> {
  const now = new Date()
  for (let m = FAST_MONTHS; m < HISTORY_MONTHS; m++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
    const cached  = getCachedDistricts(ymd)
    const toFetch = SEOUL_DISTRICTS.filter(d => !cached.has(d.code))
    if (toFetch.length > 0) {
      await runBatched(toFetch, LAZY_CONCURRENCY, async district => {
        try {
          const txs = await fetchTransactionsFromApi(district.code, ymd)
          saveTransactions(txs, district.code, ymd)
        } catch (err) {
          console.warn(`[seed] history skip ${district.name} ${ymd}:`, (err as Error).message)
        }
      })
      // Brief pause between months to avoid flooding the MOLIT API
      await new Promise(r => setTimeout(r, LAZY_PAUSE_MS))
    }
  }
}

// ── Utility ───────────────────────────────────────────────────

/** Process `items` in parallel batches of `size`, awaiting each batch. */
async function runBatched<T>(
  items:   T[],
  size:    number,
  fn:      (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn))
  }
}
