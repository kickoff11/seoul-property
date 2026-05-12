/**
 * Housing Policy Data — 주택 정책 데이터
 *
 * Covers major housing-related policies active in 2025-2026.
 * Each policy is assessed for its impact on the property market
 * from a first-time buyer's perspective.
 *
 * Status definitions:
 *   announced   — policy declared but no legislation or implementation yet
 *   implementing — actively being rolled out; early effects possible
 *   evidenced   — measurable market impact can be observed in data
 *   stalled     — progress slower than expected or facing opposition
 *
 * priceImpact:
 *   bearish  — expected to push prices down (good for waiting buyers)
 *   bullish  — expected to push prices up (reason not to wait too long)
 *   neutral  — minimal direct price effect
 *   mixed    — conflicting forces; depends on district / timeline
 */

export interface HousingPolicy {
  id:          string
  name:        string          // 정책명
  category:    PolicyCategory
  status:      PolicyStatus
  announced:   string          // YYYY-MM
  priceImpact: PriceImpact
  goal:        string          // What it aims to achieve
  mechanism:   string          // How it works
  ifSuccess:   string          // If fully implemented, price effect
  evidence:    string          // Current observable evidence
  timelineNote: string         // When effects would materialise
  certainty:   'high' | 'medium' | 'low'  // confidence in stated impact
}

export type PolicyCategory =
  | 'demand_suppression'   // policies reducing buyer demand / speculation
  | 'supply_boost'         // policies increasing housing supply
  | 'market_diversion'     // policies diverting capital away from real estate
  | 'renter_protection'    // jeonse / rental reform
  | 'financing'            // LTV / DSR / mortgage regulations

export type PolicyStatus   = 'announced' | 'implementing' | 'evidenced' | 'stalled'
export type PriceImpact    = 'bearish' | 'bullish' | 'neutral' | 'mixed'

// ─── Policy data ────────────────────────────────────────────────

export const HOUSING_POLICIES: HousingPolicy[] = [
  // ── Historical marker policies (match chart reference lines) ──────────────
  {
    id: '8-2-policy',
    name: '8·2 부동산 대책 (2017.08)',
    category: 'demand_suppression',
    status: 'evidenced',
    announced: '2017-08',
    priceImpact: 'bearish',
    goal: '강남·서울 전역 투기 과열 억제. 역대 가장 강력한 수요 억제책 중 하나.',
    mechanism: '서울 전역 투기과열지구 지정. 다주택자 양도세 중과(2주택+10%p, 3주택+20%p). LTV·DTI 40% 상한. 재건축 조합원 지위 양도 금지.',
    ifSuccess: '단기 거래량 급감, 투기 수요 억제. 실제로 2017년 말~2018년 초 서울 거래량이 월 8,000건→4,000건 수준으로 급감.',
    evidence: '시행 직후 강남구 거래량 60% 급감. 그러나 2018년 하반기부터 가격·거래량 모두 반등. 규제 비탄력적 수요(현금 자산가)의 한계 드러남.',
    timelineNote: '즉시 효과(거래량 급감)는 3-6개월. 그러나 1년 후 반등 — 근본 공급 부족은 해소 안 됨.',
    certainty: 'high',
  },
  {
    id: '12-16-policy',
    name: '12·16 부동산 대책 (2019.12)',
    category: 'financing',
    status: 'evidenced',
    announced: '2019-12',
    priceImpact: 'bearish',
    goal: '15억 초과 아파트 주담대 전면 금지로 고가 아파트 투기 차단.',
    mechanism: '시가 15억 초과 아파트 주담대 완전 금지. 9억 초과 분 LTV 20%로 강화. 다주택자 전세대출 보증 제한. 강남·서초·송파·마포 등 투기지역 추가 지정.',
    ifSuccess: '고가 아파트 현금 거래 외 매수 불가 → 투기 수요 원천 차단.',
    evidence: '2020년 상반기 강남구 거래량 급감. 그러나 코로나19 이후 유동성 장세(2020-2021)로 가격은 오히려 급등. 현금 부유층에 무력함 재확인.',
    timelineNote: '거래량 즉시 감소. 가격은 2020년 저금리·유동성으로 오히려 반등.',
    certainty: 'medium',
  },
  {
    id: '7-10-policy',
    name: '7·10 부동산 대책 (2020.07)',
    category: 'demand_suppression',
    status: 'evidenced',
    announced: '2020-07',
    priceImpact: 'bearish',
    goal: '다주택자 취득세·보유세 대폭 강화로 갭투자 근절.',
    mechanism: '3주택 이상 취득세 12%로 상향(기존 1-3%). 종합부동산세 최고세율 6%로 인상. 법인 주택 취득세 12% 일률 적용. 임대차 3법(계약갱신청구권·전월세상한제) 병행 시행.',
    ifSuccess: '다주택 보유 비용 급증 → 매물 증가 → 가격 안정.',
    evidence: '임대차 3법 시행 후 전세가격 역설적 급등(2020-2021). 다주택자 매물 일부 출회됐으나 저금리 수요가 흡수. 법인 보유 아파트는 단기 매물 증가 확인.',
    timelineNote: '임대차 3법 효과는 즉각적(전세가 급등). 다주택자 매물 효과는 1-2년 후 일부 확인.',
    certainty: 'medium',
  },
  {
    id: 'deregulation-2022',
    name: '부동산 규제 완화 (2022.06~)',
    category: 'demand_suppression',
    status: 'evidenced',
    announced: '2022-06',
    priceImpact: 'bullish',
    goal: '과도한 규제가 시장을 왜곡한다는 판단 하에 투기지역 지정 해제, 세금 완화.',
    mechanism: '서울 다수 구 투기과열지구 해제. 다주택자 취득세 중과 완화. 양도세 중과 한시 배제(1년). LTV 완화 및 특례보금자리론 출시.',
    ifSuccess: '매수 심리 회복, 거래량 정상화, 매물 출회 촉진.',
    evidence: '2022년 금리 급등과 맞물려 규제 완화에도 불구하고 가격·거래량 급락. 2023년 저점 형성 후 2024년부터 회복세.',
    timelineNote: '금리 인상 압력이 규제 완화 효과를 압도. 2024년 하반기부터 완화 효과 본격화.',
    certainty: 'medium',
  },
  {
    id: '10-15-loan-cap',
    name: '10·15 주택시장 안정화 대책 (2025.10)',
    category: 'financing',
    status: 'evidenced',
    announced: '2025-10',
    priceImpact: 'bearish',
    goal: '고가 주택 담보대출 한도를 가격 구간별로 차등 적용해 현금 외 매수 억제.',
    mechanism: '15억 이하 → 주담대 6억 한도. 15-25억 → 4억 한도. 25억 초과 → 2억 한도. 서울 전역 투기과열지구 지정. DSR 규제 유지.',
    ifSuccess: '고가 아파트(강남권 대부분) 현금 비중 급증 필요 → 투기 수요 억제 → 거래량 감소 → 호가 조정.',
    evidence: '시행 직후 강남구 거래량 감소 확인 중. 25억 초과 구간 거래 비중 변화 추적 필요. 현금 자산가에는 효과 제한적일 수 있음.',
    timelineNote: '거래량 즉시 영향. 가격에 반영되는 데는 3-6개월 이상 소요 예상.',
    certainty: 'medium',
  },
  {
    id: 'cgt-exemption-end',
    name: '양도세 면제 종료 (2026.05)',
    category: 'demand_suppression',
    status: 'announced',
    announced: '2026-01',
    priceImpact: 'mixed',
    goal: '한시 양도세 면제 혜택 종료로 매물 출회 여부 확인.',
    mechanism: '다주택자 양도세 중과 한시 배제가 2026년 5월 종료. 이후 2주택자 +10%p, 3주택자 +20%p 중과 재적용. 종료 전 매각 유인 존재.',
    ifSuccess: '면제 종료 전 매물 출회 증가 → 단기 거래량 증가 → 공급 확대.',
    evidence: '2026년 상반기 다주택자 매물 출회 여부 확인 필요. 역대 유사 사례에서 면제 종료 직전 1-2개월 거래량 급증 패턴 반복.',
    timelineNote: '2026년 3-5월 매물 집중 출회 예상. 이후 6월부터 거래량 급감 가능.',
    certainty: 'medium',
  },
  // ── Current policies ────────────────────────────────────────────────────
  {
    id: 'stock-market-promotion',
    name: '자본시장 활성화 — 부동산 → 주식 자금 유도',
    category: 'market_diversion',
    status: 'implementing',
    announced: '2025-01',
    priceImpact: 'bearish',
    goal: '가계 여유 자금을 부동산이 아닌 주식·채권 시장으로 유도해 자산 버블을 분산.',
    mechanism: '증시 세제 혜택 확대, ISA·연금 투자 한도 상향, 기업 밸류업 프로그램으로 주식 투자 매력 제고.',
    ifSuccess: '부동산 투자 수요 일부 분산 → 갭투자·다주택 보유 유인 약화 → 호가 압력 완화.',
    evidence: '2025년 KOSPI 상승 및 개인 직접투자 증가. 그러나 부동산 거래량에 대한 직접적 상관관계는 아직 통계적으로 미검증.',
    timelineNote: '효과가 부동산 거래량 감소로 나타나려면 수년 단위의 심리 변화가 필요. 단기 영향 제한적.',
    certainty: 'low',
  },
  {
    id: 'multiowner-exclusion',
    name: '다주택자 정책 참여 배제',
    category: 'demand_suppression',
    status: 'implementing',
    announced: '2025-02',
    priceImpact: 'bearish',
    goal: '주택 정책 결정 과정에서 다주택 보유자의 이해관계 충돌 방지.',
    mechanism: '주택 정책 자문위원회·심의기구에서 2주택 이상 보유자 참여 제한. 정책 방향을 실수요자·무주택자 중심으로 전환.',
    ifSuccess: '보유세 강화, 임대사업자 특혜 축소 등 다주택자에 불리한 정책 강도 증가 → 매물 증가 압력.',
    evidence: '위원회 구성 개편 발표. 구체적 정책 변화는 아직 법령화 미완료. 다주택자 매도 움직임은 통계상 미미.',
    timelineNote: '정책 변화 → 과세 강화 → 매물 출회까지 최소 1-2년 소요.',
    certainty: 'medium',
  },
  {
    id: 'public-housing-supply',
    name: '공공주택 공급 확대 (3기 신도시 + 도심복합)',
    category: 'supply_boost',
    status: 'implementing',
    announced: '2023-06',
    priceImpact: 'bearish',
    goal: '서울 및 수도권 주택 공급 확대로 중장기 가격 안정.',
    mechanism: '공공주도 도심복합사업, 3기 신도시(하남·고양·인천 등) 분양 가속. 공공임대 비율 확대.',
    ifSuccess: '2027-2030년 이후 수도권 공급 본격화 → 신규 입주 물량 증가 → 가격 안정.',
    evidence: '3기 신도시 일부 분양 시작. 그러나 2025-2026 입주 물량은 역대 최저 수준. 단기 공급 부족은 변하지 않음.',
    timelineNote: '현재 발표된 물량이 실제 입주까지 평균 5-8년 소요. 2026년 이전 효과 없음.',
    certainty: 'medium',
  },
  {
    id: 'reconstruction-reform',
    name: '재건축·재개발 규제 조정',
    category: 'supply_boost',
    status: 'stalled',
    announced: '2023-09',
    priceImpact: 'mixed',
    goal: '정비사업 속도 향상으로 노후 주택 공급 확대.',
    mechanism: '안전진단 기준 완화, 초과이익환수 기준 상향, 신속통합기획 확대.',
    ifSuccess: '재건축 사업 속도 증가 → 2030년 이후 입주 물량 증가.',
    evidence: '일부 단지 안전진단 통과. 그러나 공사비 급등으로 사업성 악화. 조합-시공사 분쟁 증가. 실제 착공은 예상보다 지연.',
    timelineNote: '규제 완화 발표 → 착공 → 입주까지 7-10년. 2031년 이전 입주 물량 기여 제한적.',
    certainty: 'low',
  },
  {
    id: 'mortgage-regulation',
    name: '대출 규제 (스트레스 DSR · LTV 상한)',
    category: 'financing',
    status: 'evidenced',
    announced: '2024-09',
    priceImpact: 'bearish',
    goal: '과도한 레버리지를 통한 투기 수요 억제.',
    mechanism: '스트레스 DSR 2단계: 가산금리 적용으로 실질 대출 한도 약 10-15% 축소. 투기지역 LTV 40% 상한 유지.',
    ifSuccess: '레버리지 투자 수요 억제 → 투기성 거래 감소.',
    evidence: '2024년 9월 이후 서울 고가 아파트 거래 일부 감소. 그러나 현금 부유층 수요(강남)에는 효과 제한적.',
    timelineNote: '즉시 효과. 단, DSR 완화 시 빠른 수요 회복 가능.',
    certainty: 'high',
  },
  {
    id: 'jeonse-reform',
    name: '전세 제도 개편 및 사기 방지',
    category: 'renter_protection',
    status: 'implementing',
    announced: '2024-03',
    priceImpact: 'mixed',
    goal: '전세사기 근절, 임차인 보호 강화, 월세 전환 지원.',
    mechanism: '전세보증보험 의무화, 임대인 정보 공개 강화, 소액 전세 임차인 우선변제권 확대.',
    ifSuccess: '전세 수요 일부 월세 전환 → 전세금 레버리지(갭투자) 축소 → 매매 수요 감소.',
    evidence: '2023-2025년 역전세·전세사기 사례 급증 후 전세 수요 위축 확인. 전세가율 하락 지속(2021년 62% → 2025년 약 50%). 갭투자 수익성 저하.',
    timelineNote: '전세 기피 심리 이미 반영 중. 매매 수요에 대한 간접 효과는 수년 단위.',
    certainty: 'medium',
  },
]

// ─── Summary helpers ─────────────────────────────────────────────

export const POLICY_STATUS_LABEL: Record<PolicyStatus, string> = {
  announced:    '발표',
  implementing: '시행 중',
  evidenced:    '효과 확인',
  stalled:      '지연',
}

export const POLICY_STATUS_COLOR: Record<PolicyStatus, string> = {
  announced:    'text-blue-400 bg-blue-950/40 border-blue-700/40',
  implementing: 'text-amber-400 bg-amber-950/40 border-amber-700/40',
  evidenced:    'text-emerald-400 bg-emerald-950/40 border-emerald-700/40',
  stalled:      'text-slate-400 bg-slate-800/60 border-slate-600/40',
}

export const PRICE_IMPACT_LABEL: Record<PriceImpact, string> = {
  bearish: '가격 하방 압력',
  bullish: '가격 상방 압력',
  neutral: '중립',
  mixed:   '혼합 (불확실)',
}

export const PRICE_IMPACT_COLOR: Record<PriceImpact, string> = {
  bearish: 'text-emerald-400',  // good for buyers (lower prices)
  bullish: 'text-rose-400',     // bad for waiting buyers
  neutral: 'text-slate-400',
  mixed:   'text-amber-400',
}

// ─── Scenario data ───────────────────────────────────────────────

export interface MarketScenario {
  id:          'bull' | 'bear' | 'base'
  label:       string
  probability: number  // rough %, adds to ~100
  thesis:      string
  keyAssumptions: string[]
  priceOutcome:   string   // qualitative price forecast
  triggerEvents:  string[] // what would confirm this scenario
  implication:    string   // what it means for a first-time buyer
}

export const SCENARIOS: MarketScenario[] = [
  {
    id: 'bull',
    label: '상승 시나리오 (강남 불패·공급 절벽)',
    probability: 35,
    thesis: '공급 절벽이 현실화되고, 금리 인하로 매수심리가 회복되며, 강남·마포 등 핵심지 가격은 재상승한다.',
    keyAssumptions: [
      '2025-2026 입주 물량 역대 최저(15,000-18,000세대) 지속',
      '기준금리 2.0% 이하로 추가 인하',
      '재건축 사업 지연으로 2030년 이전 신규 공급 없음',
      '다주택자 정책 효과 미미 — 강남 수요는 현금 자산가 중심으로 규제 비탄력적',
      '주식시장 부양 효과 제한적',
    ],
    priceOutcome: '핵심지(강남3구·마포·용산) +10~20%, 외곽지역 소폭 상승',
    triggerEvents: [
      '거래량이 월 7,000건 이상으로 회복',
      '강남구 신고가 거래 빈도 증가',
      'KOSPI 정체 or 하락 (주식 대안 매력 감소)',
      'BoK 금리 2.25% 이하 인하',
    ],
    implication: '기다릴수록 가격이 올라갑니다. 핵심지 구매를 고려한다면 대출 여력이 있을 때 움직이는 것이 유리할 수 있습니다. 단, 이 시나리오에서도 외곽 지역은 보합 예상.',
  },
  {
    id: 'bear',
    label: '하락 시나리오 (정책 + 인구 구조 복합)',
    probability: 30,
    thesis: '다주택자 압박 정책이 매물을 늘리고, 30대 핵심 수요층의 인구 감소와 소득 부담이 매수 기반을 약화시켜 가격이 조정된다.',
    keyAssumptions: [
      '다주택자 보유세·거래세 강화로 강제 매물 출현',
      '30대 혼인·출산 포기 → 주택 구매 수요 구조적 감소',
      '호가-실거래 갭(10%) 내에서 실제 거래가 형성 — 실질 가격 하락',
      '주식시장 부양 일부 성공 → 부동산 대체 투자 수요 분산',
      '전세 기피 지속 → 갭투자 청산 압력',
    ],
    priceOutcome: '서울 전체 -5~15%, 외곽 지역 -15~25%, 강남 보합~-5%',
    triggerEvents: [
      '호가-실거래 갭이 7% 이하로 축소 (셀러 태도 변화)',
      '다주택자 보유 물량 출회 증가 (매물 수 급등)',
      '30대 주택 매수 비중 지속 감소',
      '역전세·경매 건수 증가',
    ],
    implication: '기다리면 더 좋은 가격에 살 수 있습니다. 특히 외곽 지역 및 구축 아파트는 기다릴 유인이 큽니다. 강남 프리미엄은 이 시나리오에서도 부분적으로 유지될 수 있습니다.',
  },
  {
    id: 'base',
    label: '횡보 시나리오 (동결된 시장)',
    probability: 35,
    thesis: '셀러는 계속 버티고, 바이어는 계속 기다리며, 거래량은 평년의 80% 수준에서 안정된다. 가격은 보합.',
    keyAssumptions: [
      '현재의 셀러-바이어 교착 상태 지속',
      '금리 점진적 인하, 심리 조금씩 회복',
      '정책 효과는 애매 — 강한 방향성 없음',
      '공급 절벽 논의 vs 실수요 부재 균형',
    ],
    priceOutcome: '서울 전체 ±5% (지역별 차이 큼), 실질 가격은 물가 반영시 소폭 하락',
    triggerEvents: [
      '거래량 월 4,500-6,000건 범위에서 안정',
      '호가-실거래 갭 8-10% 유지',
      'R-ONE 가격지수 ±2% 이내 횡보',
    ],
    implication: '지금 사도, 기다려도 비슷한 결과. 개인 재정 상황과 거주 계획에 따라 결정하는 것이 합리적입니다. 단, 횡보 중에도 특정 단지·지역은 크게 움직일 수 있습니다.',
  },
]
