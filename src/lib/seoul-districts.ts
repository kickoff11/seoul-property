import { SeoulDistrict } from '@/types'

export const SEOUL_DISTRICTS: SeoulDistrict[] = [
  { name: '종로구',   nameEn: 'Jongno-gu',        code: '11110', lat: 37.5730, lng: 126.9794 },
  { name: '중구',     nameEn: 'Jung-gu',           code: '11140', lat: 37.5640, lng: 126.9975 },
  { name: '용산구',   nameEn: 'Yongsan-gu',        code: '11170', lat: 37.5384, lng: 126.9654 },
  { name: '성동구',   nameEn: 'Seongdong-gu',      code: '11200', lat: 37.5634, lng: 127.0371 },
  { name: '광진구',   nameEn: 'Gwangjin-gu',       code: '11215', lat: 37.5385, lng: 127.0823 },
  { name: '동대문구', nameEn: 'Dongdaemun-gu',     code: '11230', lat: 37.5744, lng: 127.0400 },
  { name: '중랑구',   nameEn: 'Jungnang-gu',       code: '11260', lat: 37.5953, lng: 127.0927 },
  { name: '성북구',   nameEn: 'Seongbuk-gu',       code: '11290', lat: 37.6066, lng: 127.0168 },
  { name: '강북구',   nameEn: 'Gangbuk-gu',        code: '11305', lat: 37.6396, lng: 127.0255 },
  { name: '도봉구',   nameEn: 'Dobong-gu',         code: '11320', lat: 37.6688, lng: 127.0471 },
  { name: '노원구',   nameEn: 'Nowon-gu',          code: '11350', lat: 37.6541, lng: 127.0567 },
  { name: '은평구',   nameEn: 'Eunpyeong-gu',      code: '11380', lat: 37.6176, lng: 126.9227 },
  { name: '서대문구', nameEn: 'Seodaemun-gu',      code: '11410', lat: 37.5791, lng: 126.9368 },
  { name: '마포구',   nameEn: 'Mapo-gu',           code: '11440', lat: 37.5663, lng: 126.9014 },
  { name: '양천구',   nameEn: 'Yangcheon-gu',      code: '11470', lat: 37.5170, lng: 126.8665 },
  { name: '강서구',   nameEn: 'Gangseo-gu',        code: '11500', lat: 37.5509, lng: 126.8496 },
  { name: '구로구',   nameEn: 'Guro-gu',           code: '11530', lat: 37.4954, lng: 126.8874 },
  { name: '금천구',   nameEn: 'Geumcheon-gu',      code: '11545', lat: 37.4600, lng: 126.9001 },
  { name: '영등포구', nameEn: 'Yeongdeungpo-gu',   code: '11560', lat: 37.5264, lng: 126.8962 },
  { name: '동작구',   nameEn: 'Dongjak-gu',        code: '11590', lat: 37.5124, lng: 126.9394 },
  { name: '관악구',   nameEn: 'Gwanak-gu',         code: '11620', lat: 37.4784, lng: 126.9516 },
  { name: '서초구',   nameEn: 'Seocho-gu',         code: '11650', lat: 37.4837, lng: 127.0324 },
  { name: '강남구',   nameEn: 'Gangnam-gu',        code: '11680', lat: 37.5172, lng: 127.0473 },
  { name: '송파구',   nameEn: 'Songpa-gu',         code: '11710', lat: 37.5145, lng: 127.1059 },
  { name: '강동구',   nameEn: 'Gangdong-gu',       code: '11740', lat: 37.5301, lng: 127.1238 },
]

export const DISTRICT_BY_CODE: Record<string, SeoulDistrict> = Object.fromEntries(
  SEOUL_DISTRICTS.map(d => [d.code, d])
)

// Price per m² multipliers relative to Seoul average (~1,000만원/m²)
// Based on 2024 실거래가 data
export const PRICE_MULTIPLIERS: Record<string, number> = {
  '11110': 2.2,  // 종로구
  '11140': 2.0,  // 중구
  '11170': 2.8,  // 용산구
  '11200': 1.9,  // 성동구
  '11215': 1.6,  // 광진구
  '11230': 1.2,  // 동대문구
  '11260': 1.0,  // 중랑구
  '11290': 1.1,  // 성북구
  '11305': 0.90, // 강북구
  '11320': 0.85, // 도봉구
  '11350': 0.95, // 노원구
  '11380': 1.1,  // 은평구
  '11410': 1.3,  // 서대문구
  '11440': 1.9,  // 마포구
  '11470': 1.4,  // 양천구
  '11500': 1.2,  // 강서구
  '11530': 1.0,  // 구로구
  '11545': 0.90, // 금천구
  '11560': 1.4,  // 영등포구
  '11590': 1.5,  // 동작구
  '11620': 1.1,  // 관악구
  '11650': 3.1,  // 서초구
  '11680': 3.4,  // 강남구
  '11710': 2.7,  // 송파구
  '11740': 2.0,  // 강동구
}

// Naver Land cortarNo mapping (Naver's own zone codes) for API calls
export const NAVER_CORTAR: Record<string, string> = {
  '11110': '1111000000', // 종로구
  '11140': '1114000000', // 중구
  '11170': '1117000000', // 용산구
  '11200': '1120000000', // 성동구
  '11215': '1121500000', // 광진구
  '11230': '1123000000', // 동대문구
  '11260': '1126000000', // 중랑구
  '11290': '1129000000', // 성북구
  '11305': '1130500000', // 강북구
  '11320': '1132000000', // 도봉구
  '11350': '1135000000', // 노원구
  '11380': '1138000000', // 은평구
  '11410': '1141000000', // 서대문구
  '11440': '1144000000', // 마포구
  '11470': '1147000000', // 양천구
  '11500': '1150000000', // 강서구
  '11530': '1153000000', // 구로구
  '11545': '1154500000', // 금천구
  '11560': '1156000000', // 영등포구
  '11590': '1159000000', // 동작구
  '11620': '1162000000', // 관악구
  '11650': '1165000000', // 서초구
  '11680': '1168000000', // 강남구
  '11710': '1171000000', // 송파구
  '11740': '1174000000', // 강동구
}
