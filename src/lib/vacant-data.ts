/**
 * Mock data for vacancy detection.
 *
 * In production this would be derived from the MOLIT transaction DB by
 * querying complexes whose MAX(deal_date) is older than the threshold.
 * Because our seeded mock DB only covers the last 6 months, we supply
 * a static dataset so the page has meaningful content.
 *
 * Vacancy signals (any one of these can indicate a problem):
 *   - 장기 공실 (long-term vacancy)         — owner holds but doesn't rent/sell
 *   - 투기 목적 보유 (speculative holding)  — waiting for price recovery
 *   - 증여 대기 (pending gift transfer)     — avoiding transfer tax timing
 *   - 법적 분쟁 (legal dispute)             — ownership unclear
 */

export interface VacantComplex {
  aptName: string
  dong: string
  gu: string
  lawdCd: string
  lastDealDate: string   // YYYY-MM-DD
  monthsInactive: number
  totalDeals: number     // lifetime deals in DB
  avgArea: number        // m²
  lastAmount: number     // 만원
  suspicionFlag: 'high' | 'medium' | 'low'
  reason: string         // human-readable reason for suspicion
}

// Current date anchor: 2026-04
// Outer districts dominate — consistent with higher denial scores and price
// declines making sellers unwilling to transact at current market prices.
export const MOCK_VACANT_COMPLEXES: VacantComplex[] = [
  // ── 36개월 이상 (극히 높은 의심) ─────────────────────────────
  { aptName: '도봉아이파크',          dong: '창동',   gu: '도봉구',   lawdCd: '1132000000', lastDealDate: '2022-09-14', monthsInactive: 43, totalDeals:  9, avgArea: 84, lastAmount: 52000, suspicionFlag: 'high',   reason: '43개월 무거래 — 분양가 이하 시세 거부 의심' },
  { aptName: '노원두산위브',          dong: '월계동',  gu: '노원구',   lawdCd: '1135000000', lastDealDate: '2022-10-02', monthsInactive: 42, totalDeals:  7, avgArea: 76, lastAmount: 47000, suspicionFlag: 'high',   reason: '42개월 무거래 — 고점 매수 후 손절 거부' },
  { aptName: '강북롯데캐슬',          dong: '번동',   gu: '강북구',   lawdCd: '1130000000', lastDealDate: '2022-11-18', monthsInactive: 41, totalDeals: 12, avgArea: 59, lastAmount: 41000, suspicionFlag: 'high',   reason: '41개월 무거래 — 상속 후 매각 보류 추정' },
  { aptName: '은평뉴타운e편한세상',   dong: '진관동',  gu: '은평구',   lawdCd: '1138000000', lastDealDate: '2023-01-07', monthsInactive: 39, totalDeals:  5, avgArea: 105, lastAmount: 68000, suspicionFlag: 'high',  reason: '39개월 무거래 — 대형 평수, 증여 검토 의심' },
  { aptName: '성북래미안',            dong: '석관동',  gu: '성북구',   lawdCd: '1129000000', lastDealDate: '2023-01-22', monthsInactive: 39, totalDeals:  8, avgArea: 67, lastAmount: 55000, suspicionFlag: 'high',   reason: '39개월 무거래 — 역세권 아님, 가격 고집' },
  { aptName: '도봉힐스테이트',        dong: '방학동',  gu: '도봉구',   lawdCd: '1132000000', lastDealDate: '2023-02-14', monthsInactive: 38, totalDeals:  6, avgArea: 84, lastAmount: 48000, suspicionFlag: 'high',   reason: '38개월 무거래 — 전세사기 분쟁 단지 인접' },

  // ── 24–36개월 (높은 의심) ──────────────────────────────────────
  { aptName: '노원벽산블루밍',        dong: '상계동',  gu: '노원구',   lawdCd: '1135000000', lastDealDate: '2023-04-03', monthsInactive: 36, totalDeals: 14, avgArea: 72, lastAmount: 44000, suspicionFlag: 'high',   reason: '36개월 무거래 — 재건축 기대로 매도 보류' },
  { aptName: '강북삼성',              dong: '미아동',  gu: '강북구',   lawdCd: '1130000000', lastDealDate: '2023-05-11', monthsInactive: 35, totalDeals: 10, avgArea: 58, lastAmount: 38000, suspicionFlag: 'high',   reason: '35개월 무거래 — 구축 단지, 호가 인하 거부' },
  { aptName: '은평센트레빌',          dong: '응암동',  gu: '은평구',   lawdCd: '1138000000', lastDealDate: '2023-06-28', monthsInactive: 34, totalDeals: 11, avgArea: 84, lastAmount: 61000, suspicionFlag: 'medium', reason: '34개월 무거래 — 호가 주변 시세比 18% 높음' },
  { aptName: '양천목동우성',          dong: '목동',   gu: '양천구',   lawdCd: '1147000000', lastDealDate: '2023-07-19', monthsInactive: 33, totalDeals:  3, avgArea: 132, lastAmount: 121000, suspicionFlag: 'high', reason: '33개월 무거래 — 대형 평수, 재건축 기대 보유' },
  { aptName: '강서가양대우',          dong: '가양동',  gu: '강서구',   lawdCd: '1150000000', lastDealDate: '2023-08-04', monthsInactive: 32, totalDeals: 18, avgArea: 59, lastAmount: 51000, suspicionFlag: 'medium', reason: '32개월 무거래 — 전세→매매 전환 실패 후 공실' },
  { aptName: '도봉신동아파밀리에',    dong: '도봉동',  gu: '도봉구',   lawdCd: '1132000000', lastDealDate: '2023-09-01', monthsInactive: 31, totalDeals:  7, avgArea: 76, lastAmount: 43000, suspicionFlag: 'medium', reason: '31개월 무거래 — 임대 실패 후 장기 공실 추정' },
  { aptName: '성북길음뉴타운래미안',  dong: '길음동',  gu: '성북구',   lawdCd: '1129000000', lastDealDate: '2023-10-17', monthsInactive: 30, totalDeals: 22, avgArea: 84, lastAmount: 64000, suspicionFlag: 'medium', reason: '30개월 무거래 — 대단지 내 소형 동, 접근성 낮음' },
  { aptName: '영등포당산현대',        dong: '당산동',  gu: '영등포구', lawdCd: '1156000000', lastDealDate: '2023-10-30', monthsInactive: 30, totalDeals:  9, avgArea: 67, lastAmount: 72000, suspicionFlag: 'medium', reason: '30개월 무거래 — 재건축 추진위 분쟁으로 매수자 기피' },
  { aptName: '노원공릉두산',          dong: '공릉동',  gu: '노원구',   lawdCd: '1135000000', lastDealDate: '2023-11-08', monthsInactive: 29, totalDeals: 13, avgArea: 58, lastAmount: 36000, suspicionFlag: 'medium', reason: '29개월 무거래 — 소형 구축, 전세가율 하락으로 수요 감소' },

  // ── 18–24개월 (중간 의심) ──────────────────────────────────────
  { aptName: '강북수유벽산',          dong: '수유동',  gu: '강북구',   lawdCd: '1130000000', lastDealDate: '2023-12-14', monthsInactive: 28, totalDeals: 16, avgArea: 72, lastAmount: 46000, suspicionFlag: 'medium', reason: '28개월 무거래 — 단지 내 법적 분쟁 1건 계류 중' },
  { aptName: '동작상도래미안',        dong: '상도동',  gu: '동작구',   lawdCd: '1159000000', lastDealDate: '2024-01-22', monthsInactive: 27, totalDeals: 21, avgArea: 84, lastAmount: 79000, suspicionFlag: 'medium', reason: '27개월 무거래 — 호가 주변 시세比 15% 높음' },
  { aptName: '은평대조현대',          dong: '대조동',  gu: '은평구',   lawdCd: '1138000000', lastDealDate: '2024-02-09', monthsInactive: 26, totalDeals:  8, avgArea: 59, lastAmount: 49000, suspicionFlag: 'low',    reason: '26개월 무거래 — 소단지(84세대), 자연 저거래' },
  { aptName: '성북종암삼성',          dong: '종암동',  gu: '성북구',   lawdCd: '1129000000', lastDealDate: '2024-03-05', monthsInactive: 25, totalDeals:  6, avgArea: 76, lastAmount: 58000, suspicionFlag: 'low',    reason: '25개월 무거래 — 소규모 단지, 거래 희소성 자연 발생' },
  { aptName: '도봉방학한신',          dong: '방학동',  gu: '도봉구',   lawdCd: '1132000000', lastDealDate: '2024-03-19', monthsInactive: 25, totalDeals: 11, avgArea: 67, lastAmount: 40000, suspicionFlag: 'medium', reason: '25개월 무거래 — 고점 대비 -38% 시세에도 매도 거부' },
  { aptName: '강서화곡우성',          dong: '화곡동',  gu: '강서구',   lawdCd: '1150000000', lastDealDate: '2024-04-01', monthsInactive: 24, totalDeals: 19, avgArea: 59, lastAmount: 47000, suspicionFlag: 'medium', reason: '24개월 무거래 — 대단지이나 특정 동 집중 공실' },
  { aptName: '양천신정현대',          dong: '신정동',  gu: '양천구',   lawdCd: '1147000000', lastDealDate: '2024-04-14', monthsInactive: 24, totalDeals: 14, avgArea: 84, lastAmount: 82000, suspicionFlag: 'low',    reason: '24개월 무거래 — 재건축 기대 보유, 매도 의사 없음' },
  { aptName: '노원하계청구',          dong: '하계동',  gu: '노원구',   lawdCd: '1135000000', lastDealDate: '2024-05-07', monthsInactive: 23, totalDeals:  9, avgArea: 58, lastAmount: 39000, suspicionFlag: 'low',    reason: '23개월 무거래 — 자연 저거래, 이상 징후 낮음' },
  { aptName: '영등포문래자이',        dong: '문래동',  gu: '영등포구', lawdCd: '1156000000', lastDealDate: '2024-06-03', monthsInactive: 22, totalDeals: 27, avgArea: 84, lastAmount: 89000, suspicionFlag: 'low',    reason: '22개월 무거래 — 대단지 중 특정 평수, 일시적 공백' },
  { aptName: '성북돈암삼성',          dong: '돈암동',  gu: '성북구',   lawdCd: '1129000000', lastDealDate: '2024-06-21', monthsInactive: 22, totalDeals: 12, avgArea: 67, lastAmount: 56000, suspicionFlag: 'low',    reason: '22개월 무거래 — 임대 전환 후 매매 일시 중단 추정' },
  { aptName: '강북우이한화',          dong: '우이동',  gu: '강북구',   lawdCd: '1130000000', lastDealDate: '2024-07-14', monthsInactive: 21, totalDeals:  7, avgArea: 76, lastAmount: 44000, suspicionFlag: 'low',    reason: '21개월 무거래 — 소단지, 지역 자연 저거래' },
  { aptName: '도봉창동우성',          dong: '창동',   gu: '도봉구',   lawdCd: '1132000000', lastDealDate: '2024-08-09', monthsInactive: 20, totalDeals: 23, avgArea: 59, lastAmount: 42000, suspicionFlag: 'low',    reason: '20개월 무거래 — GTX 기대로 매도 보류 추정' },
  { aptName: '동작노량진금호어울림',  dong: '노량진동', gu: '동작구',  lawdCd: '1159000000', lastDealDate: '2024-08-27', monthsInactive: 20, totalDeals: 16, avgArea: 59, lastAmount: 67000, suspicionFlag: 'low',    reason: '20개월 무거래 — 재개발 인접, 이전 기대 보유' },
  { aptName: '은평불광현대',          dong: '불광동',  gu: '은평구',   lawdCd: '1138000000', lastDealDate: '2024-09-15', monthsInactive: 19, totalDeals:  8, avgArea: 72, lastAmount: 52000, suspicionFlag: 'low',    reason: '19개월 무거래 — 소단지, 자연 거래 공백' },
  { aptName: '강서방화대우',          dong: '방화동',  gu: '강서구',   lawdCd: '1150000000', lastDealDate: '2024-10-02', monthsInactive: 18, totalDeals: 11, avgArea: 59, lastAmount: 44000, suspicionFlag: 'low',    reason: '18개월 무거래 — 기준 초과, 추가 모니터링 필요' },
]
