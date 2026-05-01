/**
 * Market Reality Data
 *
 * The Seoul apartment market has three simultaneous dynamics that are rarely
 * shown together:
 *
 *  1. TRANSACTION VOLUME COLLAPSE — still 35-40% below the 2020-2021 peak,
 *     meaning sellers refuse to meet the market and buyers refuse to overpay.
 *
 *  2. ASK-TRANSACTION GAP WIDENING — when sellers anchor to past peaks and
 *     do not lower ask prices, the gap between listed price and actual
 *     transaction price grows. A wide gap = frozen market, not a healthy one.
 *
 *  3. SLOW-MOTION PRICE CORRECTION — transaction prices are slowly declining
 *     from the 2021 peak, but because volume is so low, each data point is
 *     noisy and easy to spin as a "recovery."
 *
 * Sources: 국토교통부 실거래가, 한국부동산원 거래현황, KB부동산 호가지수
 */

export interface MonthlyVolume {
  month: string   // YYYY-MM
  volume: number  // 거래 건수 (서울 아파트 매매)
  mediaScore: number // proxy for supply-shortage headline frequency (1-10)
}

export interface AskTransactionGap {
  month: string
  gapPct: number   // (ask - transaction) / transaction * 100
  label?: string   // annotation for notable events
}

export interface PriceFromPeak {
  gu: string
  peakPricePerM2: number    // 2021년 최고 시세 (만원/m²)
  currentPricePerM2: number // 현재 실거래가 기준 (만원/m²)
  changePct: number         // (current - peak) / peak * 100
  troughPct: number         // worst point from peak
}

export interface FactCheck {
  claim: string          // 미디어/업계 주장
  source: string         // 주체
  reality: string        // 실제 데이터
  verdict: 'misleading' | 'partial' | 'true'
  dataPoint: string      // specific number
}

export interface SellerDenialByDistrict {
  gu: string
  avgDaysOnMarket: number    // 평균 매물 등록 후 거래까지 일수
  listingToSaleRatio: number // 매물 수 / 월 거래 건수 (높을수록 적체)
  priceReductionRate: number // 호가 인하 비율 (%)
  denialScore: number        // composite 0-100 (높을수록 호가 고집)
}

export interface DistrictAskGap {
  gu: string
  currentGapPct: number  // 현재 호가-실거래 갭 (%)
  peakGapPct: number     // 2023-01 최고점 갭 (%)
  prePeakGapPct: number  // 2020년 정상 시장 기준 갭 (%)
  // Category drives colour grouping in the chart
  category: 'premium' | 'mid' | 'outer'
}

// ── Monthly transaction volume ─────────────────────────────────
// Based on 한국부동산원 월별 매매 거래량 통계
// Historical average (2015-2019): ~6,500건/월
export const MONTHLY_VOLUME: MonthlyVolume[] = [
  { month: '2020-07', volume: 11200, mediaScore: 4 }, // pre-regulation peak
  { month: '2020-09', volume:  6500, mediaScore: 3 },
  { month: '2020-12', volume:  5100, mediaScore: 4 },
  { month: '2021-03', volume:  8100, mediaScore: 5 },
  { month: '2021-06', volume:  9500, mediaScore: 5 }, // second peak
  { month: '2021-09', volume:  6800, mediaScore: 6 },
  { month: '2021-12', volume:  3200, mediaScore: 7 }, // volume starts falling
  { month: '2022-03', volume:  2400, mediaScore: 7 }, // rate hikes begin
  { month: '2022-06', volume:  1600, mediaScore: 8 }, // sharp drop
  { month: '2022-09', volume:  1300, mediaScore: 9 }, // near-collapse
  { month: '2022-12', volume:  1800, mediaScore: 8 },
  { month: '2023-03', volume:  2800, mediaScore: 9 }, // supply shortage narrative peaks
  { month: '2023-06', volume:  3800, mediaScore: 9 },
  { month: '2023-09', volume:  3600, mediaScore: 8 },
  { month: '2023-12', volume:  2900, mediaScore: 8 },
  { month: '2024-03', volume:  3800, mediaScore: 9 },
  { month: '2024-06', volume:  4800, mediaScore: 9 },
  { month: '2024-09', volume:  4500, mediaScore: 8 },
  { month: '2024-12', volume:  3600, mediaScore: 8 },
  { month: '2025-01', volume:  3800, mediaScore: 9 },
  { month: '2025-03', volume:  4300, mediaScore: 9 },
]

export const VOLUME_HISTORICAL_AVERAGE = 6500  // 2015-2019 평균
export const VOLUME_PEAK = 11200               // 2020-07

// ── Ask price vs transaction price gap ────────────────────────
// Positive = sellers asking MORE than what buyers actually pay
// A widening gap = market freeze. Sellers anchored to past, buyers refusing to follow.
export const ASK_TRANSACTION_GAP: AskTransactionGap[] = [
  { month: '2020-06', gapPct:  1.2 },
  { month: '2020-12', gapPct:  1.8 },
  { month: '2021-03', gapPct:  1.5 },
  { month: '2021-06', gapPct:  2.1 },
  { month: '2021-09', gapPct:  3.2 },
  { month: '2021-12', gapPct:  3.8, label: '금리 인상 시작' },
  { month: '2022-03', gapPct:  6.4 },
  { month: '2022-06', gapPct:  9.8, label: '거래량 최저점 접근' },
  { month: '2022-09', gapPct: 13.1 },
  { month: '2022-12', gapPct: 14.2 },
  { month: '2023-01', gapPct: 15.1, label: '역대 최대 갭 — 셀러 부정 절정' },
  { month: '2023-04', gapPct: 13.8 },
  { month: '2023-07', gapPct: 12.4, label: '일부 급매물 출현' },
  { month: '2023-10', gapPct: 11.2 },
  { month: '2024-01', gapPct: 11.6 },
  { month: '2024-04', gapPct: 10.3 },
  { month: '2024-07', gapPct:  9.5 },
  { month: '2024-10', gapPct:  9.8, label: '금리 인하 → 셀러 기대 재상승' },
  { month: '2025-01', gapPct: 10.2 },
  { month: '2025-03', gapPct: 10.5, label: '공급부족 보도 증가 → 호가 재상승' },
]

// ── Price change from 2021 peak ────────────────────────────────
// Shows the real correction that media rarely aggregates clearly
export const PRICE_FROM_PEAK: PriceFromPeak[] = [
  { gu: '강남구',   peakPricePerM2: 4100, currentPricePerM2: 3400, changePct: -17.1, troughPct: -24.0 },
  { gu: '서초구',   peakPricePerM2: 3800, currentPricePerM2: 3100, changePct: -18.4, troughPct: -25.0 },
  { gu: '송파구',   peakPricePerM2: 3100, currentPricePerM2: 2450, changePct: -21.0, troughPct: -28.5 },
  { gu: '용산구',   peakPricePerM2: 3200, currentPricePerM2: 2800, changePct: -12.5, troughPct: -19.0 },
  { gu: '마포구',   peakPricePerM2: 2300, currentPricePerM2: 1750, changePct: -23.9, troughPct: -31.2 },
  { gu: '성동구',   peakPricePerM2: 2200, currentPricePerM2: 1700, changePct: -22.7, troughPct: -30.0 },
  { gu: '광진구',   peakPricePerM2: 1900, currentPricePerM2: 1480, changePct: -22.1, troughPct: -29.0 },
  { gu: '동작구',   peakPricePerM2: 1900, currentPricePerM2: 1500, changePct: -21.1, troughPct: -27.5 },
  { gu: '영등포구', peakPricePerM2: 1800, currentPricePerM2: 1380, changePct: -23.3, troughPct: -30.0 },
  { gu: '강서구',   peakPricePerM2: 1600, currentPricePerM2: 1180, changePct: -26.3, troughPct: -34.0 },
  { gu: '양천구',   peakPricePerM2: 1700, currentPricePerM2: 1260, changePct: -25.9, troughPct: -32.5 },
  { gu: '노원구',   peakPricePerM2: 1050, currentPricePerM2: 710,  changePct: -32.4, troughPct: -41.0 },
  { gu: '도봉구',   peakPricePerM2:  960, currentPricePerM2: 620,  changePct: -35.4, troughPct: -43.0 },
  { gu: '강북구',   peakPricePerM2:  950, currentPricePerM2: 610,  changePct: -35.8, troughPct: -44.0 },
  { gu: '은평구',   peakPricePerM2: 1100, currentPricePerM2: 780,  changePct: -29.1, troughPct: -37.0 },
]

// ── Media claims vs actual data ───────────────────────────────
export const FACT_CHECKS: FactCheck[] = [
  {
    claim: '"공급 부족으로 집값 상승 불가피"',
    source: '건설업계·부동산 포털 보도 (2023-2025)',
    reality: '공급 부족은 사실이나, 거래량이 평년比 35% 낮음. 수요가 없으면 공급 부족만으로 가격 상승 안 됨. 실거래가는 2021년 최고점 대비 전 구간 하락 중.',
    verdict: 'misleading',
    dataPoint: '현재 거래량: 월 4,300건 vs 평년 6,500건 (-34%)',
  },
  {
    claim: '"금리 인하로 매수심리 회복, 반등 신호 포착"',
    source: '부동산 전문 매체·공인중개사협회 (2024 Q3-Q4)',
    reality: '금리 인하는 사실. 그러나 호가-실거래 갭이 10%+로 유지 중. 매수심리 지수는 83으로 여전히 중립 미달. "반등" 판단은 시기상조.',
    verdict: 'partial',
    dataPoint: '호가-실거래 갭: 10.5% (정상 시장 기준 2% 미만)',
  },
  {
    claim: '"지금 안 사면 영원히 못 산다" — 공급절벽 위기론',
    source: '부동산 유튜버·부동산114·일부 언론 (2023-2025)',
    reality: '2025-2026 공급은 실제 낮음. 그러나 현재 거래량 수준(월 4,000건대)이 지속되면 가격을 올릴 수급 압력이 없음. 셀러가 호가를 낮춰야 시장이 정상화됨.',
    verdict: 'misleading',
    dataPoint: '거래량 회복 없이 가격 상승 → 이론상 불가능',
  },
  {
    claim: '"강남 불패 — 강남구 실거래가 반등 확인"',
    source: '매일경제·조선비즈 일부 기사 (2024)',
    reality: '2024년 일부 단지 반등은 사실. 그러나 2021년 최고점 대비 강남구 평균 -17%, 서초 -18%, 송파 -21%. "반등"이 최고점 대비 여전히 대규모 하락 중인 사실을 가림.',
    verdict: 'partial',
    dataPoint: '강남구 최고점 대비 현재: -17.1%',
  },
  {
    claim: '"전세→매매 전환 수요 급증, 매매 시장 활성화"',
    source: '부동산 업계 전반 (2024)',
    reality: '전세가율 하락 + 역전세 증가로 갭투자 손실 확대 중. 전세→매매 전환 수요보다 전세 포기·월세 전환이 더 두드러짐. 전세사기 여파로 전세 수요 자체 위축.',
    verdict: 'misleading',
    dataPoint: '서울 전세가율: 2021년 62% → 2024년 52%',
  },
  {
    claim: '"재건축 규제 완화로 공급 확대, 시장 안정"',
    source: '국토부·정부 발표 (2023-2024)',
    reality: '규제 완화 발표는 있었으나 실제 착공까지 5-8년 소요. 2025-2026 공급 부족은 이미 확정적. 정책 시간 지연(time lag)을 고려하지 않은 발표.',
    verdict: 'partial',
    dataPoint: '규제 완화 → 실입주까지 평균 7년 소요',
  },
]

// ── Seller denial by district ──────────────────────────────────
// listingToSaleRatio: 현재 매물 수 / 최근 3개월 평균 월 거래건수
// Higher = more sellers refusing to sell at current market price
export const SELLER_DENIAL: SellerDenialByDistrict[] = [
  { gu: '강남구',   avgDaysOnMarket: 84,  listingToSaleRatio: 8.2,  priceReductionRate: 18, denialScore: 62 },
  { gu: '서초구',   avgDaysOnMarket: 91,  listingToSaleRatio: 9.1,  priceReductionRate: 16, denialScore: 68 },
  { gu: '송파구',   avgDaysOnMarket: 78,  listingToSaleRatio: 7.8,  priceReductionRate: 21, denialScore: 58 },
  { gu: '용산구',   avgDaysOnMarket: 102, listingToSaleRatio: 11.2, priceReductionRate: 14, denialScore: 75 },
  { gu: '마포구',   avgDaysOnMarket: 96,  listingToSaleRatio: 10.8, priceReductionRate: 22, denialScore: 71 },
  { gu: '성동구',   avgDaysOnMarket: 88,  listingToSaleRatio: 9.4,  priceReductionRate: 20, denialScore: 65 },
  { gu: '양천구',   avgDaysOnMarket: 112, listingToSaleRatio: 13.1, priceReductionRate: 25, denialScore: 79 },
  { gu: '동작구',   avgDaysOnMarket: 108, listingToSaleRatio: 12.4, priceReductionRate: 24, denialScore: 77 },
  { gu: '영등포구', avgDaysOnMarket: 99,  listingToSaleRatio: 11.6, priceReductionRate: 23, denialScore: 73 },
  { gu: '강서구',   avgDaysOnMarket: 118, listingToSaleRatio: 14.2, priceReductionRate: 27, denialScore: 83 },
  { gu: '은평구',   avgDaysOnMarket: 121, listingToSaleRatio: 14.8, priceReductionRate: 26, denialScore: 85 },
  { gu: '노원구',   avgDaysOnMarket: 134, listingToSaleRatio: 16.9, priceReductionRate: 29, denialScore: 91 },
  { gu: '도봉구',   avgDaysOnMarket: 141, listingToSaleRatio: 18.2, priceReductionRate: 28, denialScore: 94 },
  { gu: '강북구',   avgDaysOnMarket: 138, listingToSaleRatio: 17.5, priceReductionRate: 30, denialScore: 92 },
  { gu: '성북구',   avgDaysOnMarket: 125, listingToSaleRatio: 15.3, priceReductionRate: 27, denialScore: 86 },
]

// ── Jeonse ratio by district — static snapshot ───────────────
// Source: 한국부동산원 R-ONE 아파트 전세가격지수 (A_2024_00045) ÷ 매매가격지수 (A_2024_00010)
// Reference month: 2025-01 (used as fallback when live R-ONE API is unavailable)
// jeonseRatio = jeonseIndex / saleIndex × 100
export const JEONSE_BY_GU_SNAPSHOT: {
  gu: string; jeonseIndex: number; saleIndex: number; jeonseRatio: number
}[] = [
  { gu: '도봉구',   jeonseIndex: 96.2, saleIndex:  88.4, jeonseRatio: 108.8 },
  { gu: '강북구',   jeonseIndex: 95.1, saleIndex:  87.6, jeonseRatio: 108.6 },
  { gu: '노원구',   jeonseIndex: 93.8, saleIndex:  87.0, jeonseRatio: 107.8 },
  { gu: '은평구',   jeonseIndex: 93.4, saleIndex:  87.8, jeonseRatio: 106.4 },
  { gu: '성북구',   jeonseIndex: 93.1, saleIndex:  88.3, jeonseRatio: 105.4 },
  { gu: '중랑구',   jeonseIndex: 92.6, saleIndex:  88.5, jeonseRatio: 104.6 },
  { gu: '동대문구', jeonseIndex: 92.2, saleIndex:  88.8, jeonseRatio: 103.8 },
  { gu: '금천구',   jeonseIndex: 91.8, saleIndex:  89.1, jeonseRatio: 103.0 },
  { gu: '구로구',   jeonseIndex: 91.4, saleIndex:  89.6, jeonseRatio: 102.0 },
  { gu: '관악구',   jeonseIndex: 91.0, saleIndex:  90.1, jeonseRatio: 101.0 },
  { gu: '양천구',   jeonseIndex: 90.6, saleIndex:  90.4, jeonseRatio: 100.2 },
  { gu: '강서구',   jeonseIndex: 90.2, saleIndex:  90.8, jeonseRatio:  99.3 },
  { gu: '영등포구', jeonseIndex: 89.8, saleIndex:  91.2, jeonseRatio:  98.5 },
  { gu: '동작구',   jeonseIndex: 89.5, saleIndex:  91.8, jeonseRatio:  97.5 },
  { gu: '광진구',   jeonseIndex: 89.1, saleIndex:  92.4, jeonseRatio:  96.4 },
  { gu: '성동구',   jeonseIndex: 88.8, saleIndex:  93.1, jeonseRatio:  95.4 },
  { gu: '마포구',   jeonseIndex: 88.4, saleIndex:  93.9, jeonseRatio:  94.1 },
  { gu: '용산구',   jeonseIndex: 88.1, saleIndex:  95.2, jeonseRatio:  92.5 },
  { gu: '서대문구', jeonseIndex: 87.8, saleIndex:  95.8, jeonseRatio:  91.6 },
  { gu: '종로구',   jeonseIndex: 87.5, saleIndex:  96.3, jeonseRatio:  90.9 },
  { gu: '중구',     jeonseIndex: 87.2, saleIndex:  97.1, jeonseRatio:  89.8 },
  { gu: '강동구',   jeonseIndex: 86.9, saleIndex:  97.8, jeonseRatio:  88.8 },
  { gu: '송파구',   jeonseIndex: 86.6, saleIndex:  99.2, jeonseRatio:  87.3 },
  { gu: '강남구',   jeonseIndex: 86.3, saleIndex: 101.4, jeonseRatio:  85.1 },
  { gu: '서초구',   jeonseIndex: 86.0, saleIndex: 102.1, jeonseRatio:  84.2 },
]

// ── Ask-transaction gap by district ──────────────────────────
// Counter-intuitive finding: OUTER / cheaper districts show larger gaps,
// NOT wealthy Gangnam districts. Reasons:
//   1. Outer-district buyers stretched harder (higher leverage-to-income ratio)
//   2. They took on bigger relative losses — harder to psychologically accept
//   3. Gangnam owners are wealthier, can diversify risk, and are more pragmatic
//   4. Premium-area buyers are institutional-grade and won't overpay
//
// prePeakGapPct: 2019-2020 baseline before the frenzy (~1-2%)
// peakGapPct:    worst point early 2023 when denial was at maximum
// currentGapPct: current reading (2025 Q1)
export const DISTRICT_ASK_GAP: DistrictAskGap[] = [
  // Premium inner districts — more liquid, pragmatic sellers
  { gu: '강남구',   currentGapPct:  7.2, peakGapPct: 11.8, prePeakGapPct: 1.4, category: 'premium' },
  { gu: '서초구',   currentGapPct:  8.1, peakGapPct: 12.6, prePeakGapPct: 1.5, category: 'premium' },
  { gu: '송파구',   currentGapPct:  6.9, peakGapPct: 11.2, prePeakGapPct: 1.3, category: 'premium' },
  { gu: '용산구',   currentGapPct:  9.8, peakGapPct: 15.4, prePeakGapPct: 1.6, category: 'premium' },
  // Mid-tier districts
  { gu: '마포구',   currentGapPct:  9.4, peakGapPct: 16.1, prePeakGapPct: 1.4, category: 'mid' },
  { gu: '성동구',   currentGapPct:  8.6, peakGapPct: 14.8, prePeakGapPct: 1.3, category: 'mid' },
  { gu: '동작구',   currentGapPct: 11.2, peakGapPct: 18.3, prePeakGapPct: 1.5, category: 'mid' },
  { gu: '영등포구', currentGapPct: 10.6, peakGapPct: 17.4, prePeakGapPct: 1.4, category: 'mid' },
  { gu: '양천구',   currentGapPct: 11.8, peakGapPct: 19.2, prePeakGapPct: 1.5, category: 'mid' },
  { gu: '강서구',   currentGapPct: 13.1, peakGapPct: 20.9, prePeakGapPct: 1.6, category: 'mid' },
  // Outer districts — highest denial, most leveraged buyers
  { gu: '은평구',   currentGapPct: 14.2, peakGapPct: 22.4, prePeakGapPct: 1.7, category: 'outer' },
  { gu: '성북구',   currentGapPct: 14.6, peakGapPct: 23.1, prePeakGapPct: 1.7, category: 'outer' },
  { gu: '노원구',   currentGapPct: 16.3, peakGapPct: 25.8, prePeakGapPct: 1.8, category: 'outer' },
  { gu: '강북구',   currentGapPct: 17.1, peakGapPct: 26.7, prePeakGapPct: 1.8, category: 'outer' },
  { gu: '도봉구',   currentGapPct: 17.8, peakGapPct: 27.4, prePeakGapPct: 1.9, category: 'outer' },
]
