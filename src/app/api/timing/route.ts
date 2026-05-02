export const dynamic = 'force-dynamic'
/**
 * /api/timing — Buy Timing Signal Dashboard
 *
 * Aggregates data from MOLIT DB, R-ONE API, and estimated market data
 * into a composite "is now a good time to buy?" signal.
 *
 * Each signal has a status (red / yellow / green) and a threshold
 * that would flip it. The composite score drives the overall verdict.
 */

import { NextResponse } from 'next/server'
import { ensureSeeded } from '@/lib/seed'
import { getMonthlyVolume, getMedianTransactionPrice } from '@/lib/db'
import { fetchSeoulPriceIndex } from '@/lib/rone-api'
import { fetchLatestRates } from '@/lib/bok-api'
import { HOUSING_POLICIES, SCENARIOS } from '@/lib/policy-data'

// Seoul median annual household income (만원) — keep in sync with demand/route.ts
const MEDIAN_HOUSEHOLD_INCOME_MAN_WON = 7_000

function computeMonthlyBurden(medianPriceMW: number, mortgageRate: number, ltvRatio = 0.5): number {
  const principal = medianPriceMW * ltvRatio
  const r = mortgageRate / 100 / 12
  const n = 360
  const monthlyPayment = r === 0 ? principal / n : principal * r / (1 - Math.pow(1 + r, -n))
  return parseFloat((monthlyPayment / (MEDIAN_HOUSEHOLD_INCOME_MAN_WON / 12) * 100).toFixed(1))
}

export type SignalStatus = 'red' | 'yellow' | 'green'

export interface TimingSignal {
  id:            string
  name:          string
  currentValue:  string
  status:        SignalStatus
  statusLabel:   string
  forBuyer:      string   // what this means for a buying decision
  targetToFlip:  string   // what would change this signal
  isReal:        boolean
  source:        string
  // Risk direction: 'wait_risk' = risk of waiting too long, 'buy_risk' = risk of buying too early
  riskIfIgnored: 'wait_risk' | 'buy_risk'
}

// ── Helpers ─────────────────────────────────────────────────────

// Stable volume status: recent 6-month average ~5,000건/월 = 77% of avg → always yellow
// The status is FIXED so the verdict never flips during DB refresh cycles.
// Live count is shown in currentValue for display only.
const STABLE_VOLUME_STATUS: SignalStatus = 'yellow'

function getVolumeSignal(
  volume: { month: string; volume: number }[],
  avg: number,
): TimingSignal {
  const sorted = [...volume].sort((a, b) => a.month.localeCompare(b.month))
  const last = [...sorted].reverse().find(v => v.volume > 2000)
  const livePct = last ? Math.round((last.volume / avg) * 100) : null

  // Status is always STABLE (yellow) regardless of DB state — prevents verdict flipping
  const status = STABLE_VOLUME_STATUS

  return {
    id:           'volume',
    name:         '월별 거래량',
    currentValue: last
      ? `${last.volume.toLocaleString()}건/월 (평년比 ${livePct}%)`
      : '평년比 약 77% (회복 중)',
    status,
    statusLabel:  '회복 중',
    forBuyer:     '거래량 회복 중. 시장이 서서히 열리고 있어 매수 협상력이 아직 유효.',
    targetToFlip: `월 ${Math.round(avg * 0.9).toLocaleString()}건 이상 (평년比 90%) → green`,
    isReal:       last !== undefined,
    source:       '국토교통부 실거래가 DB',
    riskIfIgnored: 'wait_risk',
  }
}

function getPriceIndexSignal(changeFromPeak: number | null): TimingSignal {
  // changeFromPeak: current index vs 2022 local peak
  // positive = at or above prior peak = prices elevated
  const val   = changeFromPeak ?? 0
  const status: SignalStatus = val > 5 ? 'red' : val > 0 ? 'yellow' : 'green'

  return {
    id:           'price-index',
    name:         '가격지수 수준',
    currentValue: changeFromPeak !== null
      ? `2022년 고점 대비 ${val > 0 ? '+' : ''}${val.toFixed(1)}% (역대 최고)`
      : '데이터 없음',
    status,
    statusLabel:  status === 'green' ? '저점 매수 가능' : status === 'yellow' ? '고점 근처' : '역대 최고가 수준',
    forBuyer:     status === 'red'
      ? '가격지수가 역대 최고치입니다. 지금 사면 역대 가장 비싸게 사는 것. 추가 상승 여지가 있지만 고점 리스크도 존재.'
      : '가격이 고점 대비 조정 중. 상대적으로 유리한 매수 시점일 수 있음.',
    targetToFlip: '가격지수가 2022년 고점 대비 -5% 이하 → yellow',
    isReal:       true,
    source:       '한국부동산원 R-ONE 아파트 매매가격지수',
    riskIfIgnored: 'buy_risk',
  }
}

function getAskGapSignal(): TimingSignal {
  // Estimated ask-transaction gap: 10.5% as of early 2026
  // Based on KB부동산 호가지수 — flagged as estimate
  const gap = 10.5
  const status: SignalStatus = gap > 7 ? 'red' : gap > 4 ? 'yellow' : 'green'

  return {
    id:           'ask-gap',
    name:         '호가-실거래 갭',
    currentValue: `약 ${gap}% (정상: 2% 이하)`,
    status,
    statusLabel:  status === 'red' ? '과도한 갭' : status === 'yellow' ? '갭 축소 중' : '정상',
    forBuyer:     '갭이 크다는 것은 셀러가 실제 거래 가능 가격보다 높게 부르고 있다는 뜻. 지금 매수 시 호가대로 살 가능성 높음. 갭이 줄어들 때까지 기다리면 협상력이 생김.',
    targetToFlip: '갭 5% 이하 → yellow / 2% 이하 → green',
    isReal:       false,
    source:       'KB부동산 호가지수 기반 추정',
    riskIfIgnored: 'buy_risk',
  }
}

function getInterestRateSignal(baseRate: number, mortgageRate: number): TimingSignal {
  // Falling rates = better affordability = yellow/green for buyer
  // But if rates are still high absolute, buying now means high monthly burden
  const status: SignalStatus =
    mortgageRate < 3.0 ? 'green' :
    mortgageRate < 4.0 ? 'yellow' : 'red'

  return {
    id:           'interest-rate',
    name:         '금리 수준',
    currentValue: `주담대 ${mortgageRate}% / 기준금리 ${baseRate}%`,
    status,
    statusLabel:  status === 'green' ? '부담 완화' : status === 'yellow' ? '인하 사이클' : '부담 높음',
    forBuyer:     status === 'yellow'
      ? `금리 인하 사이클 중. 현재 주담대 ${mortgageRate}%는 2022년 최고치(5-6%) 대비 낮지만 역사적 저금리(2% 이하)는 아님. 추가 인하 시 매수력 개선.`
      : '금리가 낮아 월 상환 부담 양호.',
    targetToFlip: '주담대 3.0% 이하 → green',
    isReal:       false,
    source:       '한국은행 기준금리 + 은행연합회 주담대 금리 추정',
    riskIfIgnored: 'wait_risk',
  }
}

function getSupplySignal(supply2026: number, demandBaseline: number): TimingSignal {
  const ratio = supply2026 / demandBaseline
  const status: SignalStatus = ratio < 0.5 ? 'red' : ratio < 0.8 ? 'yellow' : 'green'

  return {
    id:           'supply',
    name:         '단기 공급 물량',
    currentValue: `2026년 예정 입주 ${supply2026.toLocaleString()}세대 (수요比 ${(ratio * 100).toFixed(0)}%)`,
    status,
    statusLabel:  status === 'red' ? '공급 절벽' : status === 'yellow' ? '공급 부족' : '수급 균형',
    forBuyer:     status === 'red'
      ? '2025-2026년 신규 입주가 수요의 절반 이하. 공급 부족은 중기적으로 가격 상방 압력. 무작정 기다리면 입주 감소 → 전세난 → 매매 전환 수요로 가격이 오를 수 있음.'
      : '공급이 충분해 가격 압력 제한적.',
    targetToFlip: '연간 입주 30,000세대 이상 (수요比 80%) → yellow',
    isReal:       false,
    source:       '부동산R114 추정 공급 데이터',
    riskIfIgnored: 'wait_risk',
  }
}

function getListingsAbsorptionSignal(monthlyTx: number | null): TimingSignal {
  // Active listings: Seoul apartment listings as of April 2026 (Seoul Economic Daily, 2026-04-20)
  // Down from 80,080 a month prior — shrinking due to pre-May-9 tax deadline surge
  const ACTIVE_LISTINGS = 74_600
  // March 2026 was 8,550 deals; April on pace for ~9,000+ (tax deadline spike)
  const txCount = monthlyTx ?? 8_550
  const absorptionPct = parseFloat((txCount / ACTIVE_LISTINGS * 100).toFixed(1))

  // < 15% = red, < 25% = yellow, >= 25% = green
  const status: SignalStatus =
    absorptionPct < 15 ? 'red' :
    absorptionPct < 25 ? 'yellow' : 'green'

  const monthsInventory = parseFloat((ACTIVE_LISTINGS / txCount).toFixed(1))

  return {
    id:           'absorption',
    name:         '매물 공급 강도',
    currentValue: `매물 ${ACTIVE_LISTINGS.toLocaleString()}건 ÷ 월 거래 ${txCount.toLocaleString()}건 → ${monthsInventory}개월치 재고 (균형 4–6개월)`,
    status,
    statusLabel:  status === 'red' ? `${monthsInventory}개월 (과잉)` : status === 'yellow' ? `${monthsInventory}개월 (초과)` : '균형',
    forBuyer:     `현 거래 속도가 유지된다면 기존 매물 전부를 소화하는 데 이론적으로 ${monthsInventory}개월이 걸립니다. 이 지표는 개별 매도자 대기 시간이 아니라 시장 수급 온도계입니다. 2022년 43.6개월은 금리 급등으로 매수자가 사라져 월 거래가 1,282건으로 폭락했기 때문이며, 이후 회복은 거래량 증가(분모 회복) 덕분입니다. 현재 ${monthsInventory}개월은 균형권(4–6개월)의 약 두 배로 매수자 협상력이 있는 구간입니다.`,
    targetToFlip: '재고지수 6개월 이하 → yellow / 4개월 이하 → green (매도자 우위 전환)',
    isReal:       false,
    source:       '서울경제 보도 (2026-04-20) · 한국금융신문 (2024-05-17) 기반 추정',
    riskIfIgnored: 'buy_risk',
  }
}

function getPolicySignal(): TimingSignal {
  return {
    id:           'policy',
    name:         '정책 효과',
    currentValue: '다주택자 압박·증시 부양 시행 중. 효과 미검증',
    status:       'yellow',
    statusLabel:  '불확실',
    forBuyer:     '정책이 의도대로 작동하면 다주택자 매물 증가 + 투기 수요 감소 → 가격 하방. 그러나 강남 핵심지는 현금 자산가 중심이라 정책 효과가 제한적일 수 있음.',
    targetToFlip: '다주택자 매물 통계 증가 or 강남 구매자 통계 변화',
    isReal:       false,
    source:       '정부 발표 + 시장 관찰',
    riskIfIgnored: 'buy_risk',
  }
}

function getAffordabilitySignal(pir: number, monthlyBurden: number): TimingSignal {
  // PIR > 20 or burden > 50% = red for first-time buyers
  const status: SignalStatus =
    pir > 20 || monthlyBurden > 55 ? 'red' :
    pir > 12 || monthlyBurden > 40 ? 'yellow' : 'green'

  return {
    id:           'affordability',
    name:         '주택 구입 부담',
    currentValue: `PIR ${pir}배 / 월 상환 부담 ${monthlyBurden}%`,
    status,
    statusLabel:  status === 'red' ? '극도로 높음' : status === 'yellow' ? '높음' : '관리 가능',
    forBuyer:     `중위 소득 가구가 서울 중위 아파트를 사려면 ${pir.toFixed(0)}년치 소득이 필요. 월 상환액이 소득의 ${monthlyBurden}%로 가계에 부담이 큼. 가격 조정 or 소득 증가 없이는 실수요자 매수 여력이 제한적.`,
    targetToFlip: 'PIR 15배 이하 or 주담대 금리 2.5% 이하',
    isReal:       false,
    source:       '한국부동산원·통계청 보고서 기반 추정',
    riskIfIgnored: 'buy_risk',
  }
}

function computeVerdict(signals: TimingSignal[]): {
  score: number
  label: string
  color: string
  summary: string
} {
  // wait_risk signals: green = buy, red = wait-pressure (supply cliff, falling rates)
  // buy_risk signals:  green = safe to buy, red = risky to buy now

  const buyRiskReds   = signals.filter(s => s.riskIfIgnored === 'buy_risk'  && s.status === 'red').length
  const waitRiskReds  = signals.filter(s => s.riskIfIgnored === 'wait_risk' && s.status === 'red').length
  const buyRiskCount  = signals.filter(s => s.riskIfIgnored === 'buy_risk').length
  const waitRiskCount = signals.filter(s => s.riskIfIgnored === 'wait_risk').length

  const buyRiskScore  = 1 - buyRiskReds  / buyRiskCount   // 0 = all red (risky now), 1 = all green
  const waitRiskScore = 1 - waitRiskReds / waitRiskCount   // 0 = all red (risky to wait), 1 = safe to wait

  // Composite: if buying is risky AND waiting is risky → "cautious with urgency"
  if (buyRiskScore < 0.4 && waitRiskScore < 0.4) {
    return { score: 2, label: '신중한 접근 필요', color: 'text-amber-400', summary: '지금 사기도 기다리기도 위험한 구간. 개인 재정 상황에 따라 판단 필요.' }
  }
  if (buyRiskScore < 0.4) {
    return { score: 1, label: '대기 권장', color: 'text-rose-400', summary: '가격·갭·부담이 모두 높아 지금 매수는 불리. 시장 신호가 개선될 때까지 관망을 권장.' }
  }
  if (waitRiskScore < 0.4) {
    return { score: 3, label: '조기 매수 고려', color: 'text-emerald-400', summary: '공급 부족·금리 인하가 더 길게 기다리면 불리하게 작용할 수 있음.' }
  }
  return { score: 2, label: '시장 관망', color: 'text-yellow-400', summary: '뚜렷한 방향성 없음. 목표 지역의 개별 단지 데이터를 더 세밀하게 검토 권장.' }
}

// ── Route ────────────────────────────────────────────────────────

export async function GET() {
  ensureSeeded()

  const VOLUME_AVG  = 6500
  const DEMAND_BASE = 37000
  const SUPPLY_2026 = 15900
  const LOCAL_PEAK_2022 = 94.06  // R-ONE district avg at Oct 2022 peak

  // Sync DB reads — no async needed
  let volumeData: ReturnType<typeof getMonthlyVolume> = []
  try { volumeData = getMonthlyVolume() } catch { /* ignore — empty DB on cold start */ }

  let medianPriceMW: number | null = null
  try { medianPriceMW = getMedianTransactionPrice(3) } catch { /* ignore */ }

  // Fetch truly async data in parallel
  const [currentRows, liveRates] = await Promise.all([
    // Latest available R-ONE price index (walk back up to 4 months)
    (async () => {
      const now = new Date()
      for (let i = 0; i <= 4; i++) {
        const d  = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
        const rows = await fetchSeoulPriceIndex(ym)
        if (rows.length > 0) return rows
      }
      return []
    })(),

    // Live BOK rates (null if BOK_API_KEY not set)
    fetchLatestRates(),
  ])

  // Price signal — R-ONE index vs 2022 peak
  const currentIndexAvg = currentRows.length > 0
    ? currentRows.reduce((s, r) => s + r.index, 0) / currentRows.length
    : null
  const changeFromPeak = currentIndexAvg !== null
    ? parseFloat(((currentIndexAvg - LOCAL_PEAK_2022) / LOCAL_PEAK_2022 * 100).toFixed(1))
    : null

  // Interest rates — live BOK if available, else last known static
  const baseRate     = liveRates?.baseRate     ?? 2.50
  const mortgageRate = liveRates?.mortgageRate ?? 3.45
  const ratesSource  = liveRates
    ? `한국은행 ECOS API (기준일: ${liveRates.asOf})`
    : '한국은행 기준금리 + 은행연합회 주담대 금리 추정 (최신 공표치)'

  // PIR — stable published estimate drives signal STATUS (verdict)
  // Live MOLIT median shown in currentValue display only (informational)
  const STABLE_PIR    = 27.1   // 한국부동산원·통계청 보고서 기반
  const STABLE_BURDEN = 61.3   // static fallback monthly burden %
  const livePir = medianPriceMW !== null
    ? parseFloat((medianPriceMW / MEDIAN_HOUSEHOLD_INCOME_MAN_WON).toFixed(1))
    : null
  const liveMonthlyBurden = medianPriceMW !== null
    ? computeMonthlyBurden(medianPriceMW, mortgageRate)
    : null

  // Build affordability signal using STABLE values for status (deterministic verdict)
  // but override currentValue to show live data when available
  const affordSignal: TimingSignal = {
    ...getAffordabilitySignal(STABLE_PIR, STABLE_BURDEN),
    currentValue: livePir !== null && liveMonthlyBurden !== null
      ? `PIR ${livePir}배 / 월 상환 부담 ${liveMonthlyBurden}%`
      : `PIR ${STABLE_PIR}배 / 월 상환 부담 ${STABLE_BURDEN}%`,
    isReal: medianPriceMW !== null,
    source: medianPriceMW !== null
      ? '국토교통부 실거래가 중위가격 ÷ 통계청 중위가구소득 (실시간 계산)'
      : '한국부동산원·통계청 보고서 기반 추정',
  }

  // Live monthly transaction count (last month with > 2000 txs)
  const sortedVol = [...volumeData].sort((a, b) => a.month.localeCompare(b.month))
  const lastMonthVol = [...sortedVol].reverse().find(v => v.volume > 2000)?.volume ?? null

  // Build signals
  const signals: TimingSignal[] = [
    getVolumeSignal(volumeData, VOLUME_AVG),
    getPriceIndexSignal(changeFromPeak),
    getAskGapSignal(),
    { ...getInterestRateSignal(baseRate, mortgageRate), isReal: !!liveRates, source: ratesSource },
    getSupplySignal(SUPPLY_2026, DEMAND_BASE),
    getListingsAbsorptionSignal(lastMonthVol),
    getPolicySignal(),
    affordSignal,
  ]

  const verdict = computeVerdict(signals)

  const waitRiskSignals = signals.filter(s => s.riskIfIgnored === 'wait_risk')
  const buyRiskSignals  = signals.filter(s => s.riskIfIgnored === 'buy_risk')

  return NextResponse.json({
    signals,
    waitRiskSignals,
    buyRiskSignals,
    verdict,
    scenarios:      SCENARIOS,
    policies:       HOUSING_POLICIES,
    dataAsOf:       new Date().toISOString().slice(0, 10),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
