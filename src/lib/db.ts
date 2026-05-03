/**
 * SQLite cache layer — stores fetched transactions locally so we don't
 * re-fetch the same month/district data on every request.
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { ApartmentTransaction } from '@/types'

// On Railway / any persistent-disk host: use project's data/ directory.
// On Vercel or other read-only filesystems: fall back to /tmp (ephemeral but
// survives within a warm function instance — data re-seeds on cold start).
const DATA_DIR = process.env.VERCEL
  ? '/tmp'
  : path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'cache.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('synchronous = NORMAL')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id            TEXT PRIMARY KEY,
      apt_name      TEXT NOT NULL,
      dong          TEXT NOT NULL,
      gu            TEXT NOT NULL,
      lawd_cd       TEXT NOT NULL,
      amount        INTEGER NOT NULL,
      area          REAL NOT NULL,
      floor         INTEGER,
      built_year    INTEGER,
      deal_year     INTEGER NOT NULL,
      deal_month    INTEGER NOT NULL,
      deal_day      INTEGER NOT NULL,
      deal_date     TEXT NOT NULL,
      price_per_m2  INTEGER NOT NULL,
      road_address  TEXT,
      lot_number    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_lawd_cd   ON transactions(lawd_cd);
    CREATE INDEX IF NOT EXISTS idx_deal_date ON transactions(deal_date);
    CREATE INDEX IF NOT EXISTS idx_apt_name  ON transactions(apt_name, dong);

    CREATE TABLE IF NOT EXISTS fetch_log (
      lawd_cd      TEXT NOT NULL,
      deal_ymd     TEXT NOT NULL,
      fetched_at   TEXT NOT NULL DEFAULT (datetime('now')),
      record_count INTEGER NOT NULL,
      PRIMARY KEY (lawd_cd, deal_ymd)
    );

    CREATE TABLE IF NOT EXISTS api_cache (
      cache_key  TEXT PRIMARY KEY,
      payload    TEXT NOT NULL,
      cached_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

// ── Cache check ────────────────────────────────────────────────

export function isCached(lawdCd: string, dealYmd: string): boolean {
  const row = getDb()
    .prepare('SELECT fetched_at, record_count FROM fetch_log WHERE lawd_cd = ? AND deal_ymd = ?')
    .get(lawdCd, dealYmd) as { fetched_at: string; record_count: number } | undefined
  if (!row) return false
  const ageMs = Date.now() - new Date(row.fetched_at).getTime()
  // Zero-record entries get a short TTL so a transient MOLIT outage or
  // exhausted daily quota doesn't suppress a district for a full day.
  const ttl = row.record_count > 0 ? 86_400_000 : 3_600_000
  return ageMs < ttl
}

// ── Writes ─────────────────────────────────────────────────────

export function saveTransactions(
  txs: ApartmentTransaction[],
  lawdCd: string,
  dealYmd: string,
) {
  const db = getDb()
  const ins = db.prepare(`
    INSERT OR REPLACE INTO transactions
      (id, apt_name, dong, gu, lawd_cd, amount, area, floor, built_year,
       deal_year, deal_month, deal_day, deal_date, price_per_m2, road_address, lot_number)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `)
  const log = db.prepare(`
    INSERT OR REPLACE INTO fetch_log (lawd_cd, deal_ymd, record_count)
    VALUES (?,?,?)
  `)

  db.transaction(() => {
    for (const t of txs) {
      ins.run(
        t.id, t.aptName, t.dong, t.gu, t.lawdCd,
        t.amount, t.area, t.floor, t.builtYear,
        t.dealYear, t.dealMonth, t.dealDay, t.dealDate,
        t.pricePerM2, t.roadAddress ?? null, t.lotNumber ?? null,
      )
    }
    log.run(lawdCd, dealYmd, txs.length)
  })()
}

// ── Reads ──────────────────────────────────────────────────────

function rowToTx(row: Record<string, unknown>): ApartmentTransaction {
  return {
    id:           row.id as string,
    aptName:      row.apt_name as string,
    dong:         row.dong as string,
    gu:           row.gu as string,
    lawdCd:       row.lawd_cd as string,
    amount:       row.amount as number,
    area:         row.area as number,
    floor:        row.floor as number,
    builtYear:    row.built_year as number,
    dealYear:     row.deal_year as number,
    dealMonth:    row.deal_month as number,
    dealDay:      row.deal_day as number,
    dealDate:     row.deal_date as string,
    pricePerM2:   row.price_per_m2 as number,
    roadAddress:  row.road_address as string | undefined,
    lotNumber:    row.lot_number as string | undefined,
  }
}

export function getTransactions(opts: {
  lawdCd?: string
  year?: number
  aptName?: string
  limit?: number
  offset?: number
} = {}): ApartmentTransaction[] {
  const conds: string[] = []
  const params: (string | number)[] = []

  if (opts.lawdCd)  { conds.push('lawd_cd = ?');         params.push(opts.lawdCd) }
  if (opts.year)    { conds.push('deal_year = ?');        params.push(opts.year) }
  if (opts.aptName) { conds.push('apt_name LIKE ?');      params.push(`%${opts.aptName}%`) }

  const where  = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const limit  = opts.limit  ?? 500
  const offset = opts.offset ?? 0

  const rows = getDb()
    .prepare(`SELECT * FROM transactions ${where} ORDER BY deal_date DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Record<string, unknown>[]

  return rows.map(rowToTx)
}

export function getTotalCount(): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) as n FROM transactions')
    .get() as { n: number }
  return row.n
}

export function getDistrictSummary() {
  return getDb().prepare(`
    SELECT
      lawd_cd          AS lawdCd,
      gu,
      COUNT(*)         AS count,
      AVG(amount)      AS avgAmount,
      AVG(price_per_m2) AS avgPricePerM2,
      MIN(amount)      AS minAmount,
      MAX(amount)      AS maxAmount
    FROM transactions
    GROUP BY lawd_cd
    ORDER BY avgPricePerM2 DESC
  `).all() as {
    lawdCd: string; gu: string; count: number
    avgAmount: number; avgPricePerM2: number
    minAmount: number; maxAmount: number
  }[]
}

export function getMonthlyVolume(): { month: string; volume: number }[] {
  const rows = getDb().prepare(`
    SELECT deal_year, deal_month, COUNT(*) as volume
    FROM transactions
    GROUP BY deal_year, deal_month
    ORDER BY deal_year, deal_month
  `).all() as { deal_year: number; deal_month: number; volume: number }[]

  return rows.map(r => ({
    month:  `${r.deal_year}-${String(r.deal_month).padStart(2, '0')}`,
    volume: r.volume,
  }))
}

export function getMonthlyVolumeByDistrict(): { gu: string; month: string; volume: number }[] {
  return getDb().prepare(`
    SELECT
      gu,
      deal_year || '-' || printf('%02d', deal_month) AS month,
      COUNT(*) AS volume
    FROM transactions
    GROUP BY gu, deal_year, deal_month
    ORDER BY deal_year, deal_month, gu
  `).all() as { gu: string; month: string; volume: number }[]
}

export function getMonthlyTrends(lawdCd?: string) {
  const having = lawdCd
    ? 'HAVING COUNT(*) >= 10'
    : 'HAVING COUNT(DISTINCT lawd_cd) >= 20'

  if (lawdCd) {
    return getDb().prepare(`
      SELECT * FROM (
        SELECT
          deal_year  AS dealYear,
          deal_month AS dealMonth,
          COUNT(*)                AS count,
          COUNT(DISTINCT lawd_cd) AS districtCount,
          AVG(amount)             AS avgAmount,
          AVG(price_per_m2)       AS avgPricePerM2,
          MIN(amount)             AS minAmount,
          MAX(amount)             AS maxAmount
        FROM transactions
        WHERE lawd_cd = ?
        GROUP BY deal_year, deal_month
        ${having}
        ORDER BY deal_year DESC, deal_month DESC
        LIMIT 24
      ) ORDER BY dealYear ASC, dealMonth ASC
    `).all(lawdCd) as {
      dealYear: number; dealMonth: number; count: number; districtCount: number
      avgAmount: number; avgPricePerM2: number; minAmount: number; maxAmount: number
    }[]
  }

  return getDb().prepare(`
    SELECT * FROM (
      SELECT
        deal_year  AS dealYear,
        deal_month AS dealMonth,
        COUNT(*)                AS count,
        COUNT(DISTINCT lawd_cd) AS districtCount,
        AVG(amount)             AS avgAmount,
        AVG(price_per_m2)       AS avgPricePerM2,
        MIN(amount)             AS minAmount,
        MAX(amount)             AS maxAmount
      FROM transactions
      GROUP BY deal_year, deal_month
      ${having}
      ORDER BY deal_year DESC, deal_month DESC
      LIMIT 24
    ) ORDER BY dealYear ASC, dealMonth ASC
  `).all() as {
    dealYear: number; dealMonth: number; count: number; districtCount: number
    avgAmount: number; avgPricePerM2: number; minAmount: number; maxAmount: number
  }[]
}

/**
 * Returns the median transaction price (만원) across all transactions in the
 * last `recentMonths` calendar months. Used for live PIR computation.
 * Returns null if there are fewer than 10 transactions (unreliable median).
 */
export function getMedianTransactionPrice(recentMonths = 3): number | null {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - recentMonths)
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-01`

  const rows = getDb().prepare(`
    SELECT amount FROM transactions
    WHERE deal_date >= ?
    ORDER BY amount
  `).all(cutoffStr) as { amount: number }[]

  if (rows.length < 10) return null
  const mid = Math.floor(rows.length / 2)
  // Odd length: middle value; even: average of two middle values
  return rows.length % 2 === 1
    ? rows[mid].amount
    : Math.round((rows[mid - 1].amount + rows[mid].amount) / 2)
}

/** Returns the set of lawd_cd codes already cached for a given month. */
export function getCachedDistricts(dealYmd: string): Set<string> {
  // Successful fetches stay cached for 24 h. Empty results (likely a MOLIT
  // outage or exhausted daily quota) are retried after 1 h so newly
  // available data flows in promptly once the quota resets.
  const rows = getDb()
    .prepare(`SELECT lawd_cd FROM fetch_log
              WHERE deal_ymd = ?
                AND (
                  (record_count > 0  AND fetched_at > datetime('now', '-24 hours'))
                  OR
                  (record_count = 0  AND fetched_at > datetime('now', '-1 hour'))
                )`)
    .all(dealYmd) as { lawd_cd: string }[]
  return new Set(rows.map(r => r.lawd_cd))
}

// ── Gangnam-specific queries ───────────────────────────────────

/** Monthly transaction count split by price tier (15억 / 25억 thresholds). */
export function getDistrictPriceTiersByMonth(lawdCd: string): {
  month: string; under15: number; btw1525: number; over25: number; total: number
}[] {
  return getDb().prepare(`
    SELECT
      deal_year || '-' || printf('%02d', deal_month) AS month,
      SUM(CASE WHEN amount < 150000 THEN 1 ELSE 0 END)                      AS under15,
      SUM(CASE WHEN amount >= 150000 AND amount < 250000 THEN 1 ELSE 0 END) AS btw1525,
      SUM(CASE WHEN amount >= 250000 THEN 1 ELSE 0 END)                     AS over25,
      COUNT(*) AS total
    FROM transactions
    WHERE lawd_cd = ?
    GROUP BY deal_year, deal_month
    ORDER BY deal_year ASC, deal_month ASC
  `).all(lawdCd) as { month: string; under15: number; btw1525: number; over25: number; total: number }[]
}

/** Top apartments in a district by transaction count. */
export function getDistrictTopApts(lawdCd: string, limit = 12): {
  aptName: string; count: number; avgAmount: number; avgPricePerM2: number; maxAmount: number
}[] {
  return getDb().prepare(`
    SELECT apt_name AS aptName, COUNT(*) AS count,
      AVG(amount) AS avgAmount, AVG(price_per_m2) AS avgPricePerM2,
      MAX(amount) AS maxAmount
    FROM transactions
    WHERE lawd_cd = ?
    GROUP BY apt_name
    ORDER BY count DESC
    LIMIT ?
  `).all(lawdCd, limit) as { aptName: string; count: number; avgAmount: number; avgPricePerM2: number; maxAmount: number }[]
}

export function getCachedApi<T>(key: string, maxAgeMs: number): T | null {
  const row = getDb()
    .prepare(`SELECT payload, cached_at FROM api_cache WHERE cache_key = ?`)
    .get(key) as { payload: string; cached_at: string } | undefined
  if (!row) return null
  if (Date.now() - new Date(row.cached_at).getTime() > maxAgeMs) return null
  return JSON.parse(row.payload) as T
}

export function setCachedApi(key: string, payload: unknown): void {
  getDb()
    .prepare(`INSERT OR REPLACE INTO api_cache (cache_key, payload) VALUES (?, ?)`)
    .run(key, JSON.stringify(payload))
}

export function getInactiveComplexes(monthsThreshold = 18) {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - monthsThreshold)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return getDb().prepare(`
    SELECT
      apt_name    AS aptName,
      dong,
      gu,
      lawd_cd     AS lawdCd,
      MAX(deal_date) AS lastDealDate,
      COUNT(*)    AS totalDeals,
      AVG(area)   AS avgArea,
      amount      AS lastAmount
    FROM transactions
    GROUP BY apt_name, dong, gu, lawd_cd
    HAVING MAX(deal_date) < ?
    ORDER BY lastDealDate ASC
    LIMIT 60
  `).all(cutoffStr) as {
    aptName: string; dong: string; gu: string; lawdCd: string
    lastDealDate: string; totalDeals: number; avgArea: number; lastAmount: number
  }[]
}
