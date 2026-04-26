export interface ApartmentTransaction {
  id: string
  aptName: string       // 아파트명
  dong: string          // 법정동
  gu: string            // 구
  lawdCd: string        // 지역코드 (5자리)
  amount: number        // 거래금액 (만원)
  area: number          // 전용면적 (m²)
  floor: number         // 층
  builtYear: number     // 건축년도
  dealYear: number
  dealMonth: number
  dealDay: number
  dealDate: string      // YYYY-MM-DD
  roadAddress?: string
  lotNumber?: string
  pricePerM2: number    // 만원/m²
}

export interface SeoulDistrict {
  name: string          // 구 이름 (한글)
  nameEn: string        // Romanized
  code: string          // 5자리 법정동 코드
  lat: number
  lng: number
}

export interface DistrictSummary {
  lawdCd: string
  gu: string
  count: number
  avgAmount: number
  avgPricePerM2: number
  minAmount: number
  maxAmount: number
  district?: SeoulDistrict
}

export interface PriceTrend {
  month: string         // YYYY-MM
  avgPrice: number
  medianPrice: number
  transactionCount: number
  avgPricePerM2: number
}

export interface VacantComplex {
  aptName: string
  dong: string
  gu: string
  lawdCd: string
  lastDealDate: string
  monthsInactive?: number
  totalDeals: number
  avgArea: number
  lastAmount: number
  suspicionFlag?: string
  reason?: string
}

export interface NaverListing {
  aptName: string
  dong: string
  gu: string
  listingPrice: number  // 만원
  area: number
  floor: string
  source: 'naver'
}

export interface PriceGap {
  aptName: string
  dong: string
  gu: string
  avgTransactionPrice: number
  avgListingPrice: number
  gapPct: number        // (listing - transaction) / transaction * 100
  area: number
}

// ── Supply side ───────────────────────────────────────────────

export interface SupplyByYear {
  year: number
  units: number
  actual: boolean               // false = projected
  reconstructionUnits: number   // 재건축/재개발
  newBuildUnits: number         // 신규
}

export interface MajorProject {
  name: string
  nameShort: string             // for tight UI
  gu: string
  dong: string
  totalUnits: number
  generalSaleUnits?: number     // 일반 분양 세대수
  expectedYear: number
  type: '재건축' | '재개발' | '신규'
  status: '입주완료' | '입주예정' | '분양중' | '분양예정' | '시공중' | '계획중'
  developer: string
  brand?: string                // e.g. '디에이치', '래미안', '자이'

  // Location
  subway: string                // e.g. "2호선 강남역 도보 7분"
  schoolZone: string            // e.g. "강남8학군 (대치중)"
  riverView: boolean
  highlights: string[]          // 3-5 key selling points

  // Pricing (만원/m²)
  presalePrice?: number         // 분양가 (확정된 경우만)
  presalePriceNote?: string     // '확정' only — no estimates

  // Real market price pulled from MOLIT transaction DB (avg price/m² for the gu)
  avgTransactionPricePerM2?: number

  notes?: string
}

export interface SupplyDemandRatio {
  year: number
  supply: number
  demand: number
  ratio: number   // supply / demand — <1 = undersupply
}

// ── Demand side ───────────────────────────────────────────────

export interface DemographicPoint {
  year: number
  population: number          // 만명
  households: number          // 만 가구
  singleHouseholdPct: number  // %
  marriages: number           // 천 건
}

export interface SentimentPoint {
  month: string               // YYYY-MM
  buyerSentiment: number      // KB 매수우위지수: 0-200, 100 = neutral
  priceExpectation: number    // 0-200, >100 = expecting price rise
}

export interface InterestRatePoint {
  month: string
  baseRate: number            // 한국은행 기준금리 %
  mortgageRate: number        // 주담대 평균 %
}

export interface AffordabilityPoint {
  year: number
  pir: number                 // Price-to-Income Ratio
  monthlyBurden: number       // mortgage payment as % of avg household income
}
