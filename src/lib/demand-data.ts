/**
 * Seoul housing demand data — demographics, sentiment, rates, affordability
 *
 * Sources:
 *  - 통계청 KOSIS: population, households, marriages
 *  - KB부동산: 매수우위지수, 가격전망지수
 *  - 한국은행 ECOS: 기준금리, 주담대금리
 *  - 한국부동산원: 소비자 심리조사
 *
 * Optional live data: set KOSIS_API_KEY and BOK_API_KEY in .env.local
 */

import {
  DemographicPoint, SentimentPoint, InterestRatePoint, AffordabilityPoint,
} from '@/types'

// ── Demographics (통계청 기준) ────────────────────────────────
// population: 만명 | households: 만 가구 | marriages: 천 건
export const DEMOGRAPHIC_DATA: DemographicPoint[] = [
  { year: 2010, population: 1031.3, households: 386.4, singleHouseholdPct: 24.4, marriages: 65.2 },
  { year: 2011, population: 1024.9, households: 391.2, singleHouseholdPct: 25.1, marriages: 62.4 },
  { year: 2012, population: 1019.5, households: 395.8, singleHouseholdPct: 25.8, marriages: 59.8 },
  { year: 2013, population: 1014.4, households: 399.3, singleHouseholdPct: 26.5, marriages: 57.6 },
  { year: 2014, population: 1010.3, households: 402.1, singleHouseholdPct: 27.3, marriages: 55.9 },
  { year: 2015, population: 1002.2, households: 404.8, singleHouseholdPct: 29.5, marriages: 53.2 },
  { year: 2016, population:  993.1, households: 408.9, singleHouseholdPct: 30.2, marriages: 51.4 },
  { year: 2017, population:  985.7, households: 412.7, singleHouseholdPct: 30.9, marriages: 49.8 },
  { year: 2018, population:  976.6, households: 417.5, singleHouseholdPct: 31.8, marriages: 48.1 },
  { year: 2019, population:  972.9, households: 426.7, singleHouseholdPct: 33.4, marriages: 45.7 },
  { year: 2020, population:  966.8, households: 432.0, singleHouseholdPct: 33.9, marriages: 38.5 },
  { year: 2021, population:  950.9, households: 437.2, singleHouseholdPct: 34.5, marriages: 37.1 },
  { year: 2022, population:  942.8, households: 440.5, singleHouseholdPct: 35.1, marriages: 36.2 },
  { year: 2023, population:  938.7, households: 443.1, singleHouseholdPct: 35.8, marriages: 34.8 },
  { year: 2024, population:  936.0, households: 445.0, singleHouseholdPct: 36.3, marriages: 34.2 },
]

// ── Buyer sentiment (KB부동산 기준) ──────────────────────────
// buyerSentiment: 매수우위지수 — 0-200, 100=neutral, <100=seller's market
// priceExpectation: 가격전망지수 — >100=expecting price rise
export const SENTIMENT_DATA: SentimentPoint[] = [
  { month: '2021-01', buyerSentiment: 112, priceExpectation: 138 },
  { month: '2021-04', buyerSentiment: 121, priceExpectation: 145 },
  { month: '2021-07', buyerSentiment: 118, priceExpectation: 142 },
  { month: '2021-10', buyerSentiment: 108, priceExpectation: 131 },
  { month: '2022-01', buyerSentiment:  82, priceExpectation:  95 },
  { month: '2022-04', buyerSentiment:  64, priceExpectation:  78 },
  { month: '2022-07', buyerSentiment:  48, priceExpectation:  62 },
  { month: '2022-10', buyerSentiment:  35, priceExpectation:  45 },
  { month: '2023-01', buyerSentiment:  31, priceExpectation:  42 }, // trough
  { month: '2023-04', buyerSentiment:  45, priceExpectation:  58 },
  { month: '2023-07', buyerSentiment:  62, priceExpectation:  71 },
  { month: '2023-10', buyerSentiment:  55, priceExpectation:  65 },
  { month: '2024-01', buyerSentiment:  58, priceExpectation:  68 },
  { month: '2024-04', buyerSentiment:  67, priceExpectation:  74 },
  { month: '2024-07', buyerSentiment:  75, priceExpectation:  82 },
  { month: '2024-10', buyerSentiment:  71, priceExpectation:  78 },
  { month: '2025-01', buyerSentiment:  78, priceExpectation:  85 },
  { month: '2025-04', buyerSentiment:  83, priceExpectation:  89 },
]

// ── Interest rates (한국은행 기준금리 + 주담대 평균금리) ──────
export const INTEREST_RATE_DATA: InterestRatePoint[] = [
  { month: '2020-01', baseRate: 1.25, mortgageRate: 2.78 },
  { month: '2020-05', baseRate: 0.50, mortgageRate: 2.52 }, // COVID 역대 최저
  { month: '2021-01', baseRate: 0.50, mortgageRate: 2.65 },
  { month: '2021-08', baseRate: 0.75, mortgageRate: 3.12 }, // 첫 금리 인상
  { month: '2021-11', baseRate: 1.00, mortgageRate: 3.42 },
  { month: '2022-01', baseRate: 1.25, mortgageRate: 3.89 },
  { month: '2022-04', baseRate: 1.50, mortgageRate: 4.21 },
  { month: '2022-07', baseRate: 2.25, mortgageRate: 4.98 },
  { month: '2022-10', baseRate: 3.00, mortgageRate: 5.82 },
  { month: '2022-12', baseRate: 3.25, mortgageRate: 6.12 },
  { month: '2023-01', baseRate: 3.50, mortgageRate: 5.95 }, // 피크
  { month: '2023-06', baseRate: 3.50, mortgageRate: 4.65 },
  { month: '2023-12', baseRate: 3.50, mortgageRate: 4.42 },
  { month: '2024-01', baseRate: 3.50, mortgageRate: 4.32 },
  { month: '2024-07', baseRate: 3.50, mortgageRate: 4.18 },
  { month: '2024-10', baseRate: 3.25, mortgageRate: 4.05 }, // 첫 인하
  { month: '2024-11', baseRate: 3.00, mortgageRate: 3.85 },
  { month: '2025-01', baseRate: 2.75, mortgageRate: 3.62 },
  { month: '2025-04', baseRate: 2.50, mortgageRate: 3.45 },
]

// ── Affordability (주택구입부담지수) ─────────────────────────
// pir: Price-to-Income Ratio (서울 중위가격 / 중위가구소득)
// monthlyBurden: 월 주담대 상환액 / 월 소득 (%)
export const AFFORDABILITY_DATA: AffordabilityPoint[] = [
  { year: 2015, pir: 18.2, monthlyBurden: 38.5 },
  { year: 2016, pir: 19.8, monthlyBurden: 41.2 },
  { year: 2017, pir: 21.5, monthlyBurden: 43.8 },
  { year: 2018, pir: 24.7, monthlyBurden: 49.1 },
  { year: 2019, pir: 26.3, monthlyBurden: 51.4 },
  { year: 2020, pir: 28.9, monthlyBurden: 53.2 },
  { year: 2021, pir: 31.2, monthlyBurden: 57.8 }, // 역대 최고
  { year: 2022, pir: 27.4, monthlyBurden: 68.2 }, // 가격 하락 but 금리 급등
  { year: 2023, pir: 25.8, monthlyBurden: 64.5 },
  { year: 2024, pir: 27.1, monthlyBurden: 61.3 },
]

// ── Buyer age distribution ────────────────────────────────────
// % of apartment purchasers by age group (2023 기준)
export const BUYER_AGE_DIST = [
  { group: '20대', pct: 8.2,  label: '20s' },
  { group: '30대', pct: 29.4, label: '30s' },
  { group: '40대', pct: 28.1, label: '40s' },
  { group: '50대', pct: 21.3, label: '50s' },
  { group: '60대+', pct: 13.0, label: '60s+' },
]

// ── Current market summary ────────────────────────────────────
export const MARKET_SUMMARY = {
  latestSentiment: SENTIMENT_DATA[SENTIMENT_DATA.length - 1],
  latestRate:      INTEREST_RATE_DATA[INTEREST_RATE_DATA.length - 1],
  latestPir:       AFFORDABILITY_DATA[AFFORDABILITY_DATA.length - 1],
  populationTrend: '감소 (-0.3%/년)',
  householdTrend:  '증가 (+0.4%/년)',
  keyRisk:         '공급 부족 (2025-2026)',
  keyTailwind:     '금리 인하 사이클 진입',
}
