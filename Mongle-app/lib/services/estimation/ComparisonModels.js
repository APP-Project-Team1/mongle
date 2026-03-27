/**
 * Wedding Estimate Normalization Keys
 * Used to map various PDF field names to a standard internal key.
 */
export const NORMALIZATION_MAP = {
  totalPrice: ["총금액", "총액", "합계", "최종금액", "실결제금액", "예상 총액"],
  deposit: ["계약금", "예약금", "선입금"],
  balance: ["잔금", "중도금"],
  productName: ["상품명", "패키지명", "코스명"],
  includedItems: ["포함사항", "서비스항목", "기본구성"],
  excludedItems: ["불포함사항", "별도사항", "추가금"],
  optionsPrice: ["옵션가", "추가비용", "선택사항"],
  discountPrice: ["할인금액", "프로모션"],
  vatIncluded: ["부가세포함", "VAT포함", "세금포함"],
  capacity: ["인원", "수량", "보증인원"],
  duration: ["시간", "이용시간", "대관시간"],
  rawFilesIncluded: ["원본제공", "원본데이터", "데이터제공"],
  retouchedFilesIncluded: ["수정본제공", "보정본"],
  refundPolicy: ["환불규정", "취소규정"],
};

/**
 * @typedef {Object} EstimateItem
 * @property {string} vendorName - 업체명
 * @property {string} category - 카테고리 (웨딩홀/스튜디오/드레스 등)
 * @property {string} productName - 상품명
 * @property {number} totalPrice - 총 견적 금액
 * @property {number} deposit - 계약금
 * @property {number} balance - 잔금
 * @property {string[]} includedItems - 기본 포함 항목
 * @property {string[]} excludedItems - 불포함 항목
 * @property {number} optionsPrice - 옵션 추가 비용
 * @property {number} discountPrice - 할인 금액
 * @property {boolean} vatIncluded - VAT 포함 여부
 * @property {string} capacity - 인원/수량 기준
 * @property {string} duration - 이용 시간
 * @property {boolean} rawFilesIncluded - 원본 제공 여부
 * @property {boolean} retouchedFilesIncluded - 수정본 제공 여부
 * @property {string} refundPolicy - 환불/취소 규정
 * @property {string} remarks - 비고/특약
 * @property {number} confidence - 분석 신뢰도 (0~1)
 */

/**
 * @typedef {Object} ComparisonResult
 * @property {EstimateItem[]} items - 비교 대상 업체들
 * @property {number} userBudget - 사용자 예산
 * @property {Object} analysis - 분석 결과
 * @property {string} analysis.cheapestVendor - 최저가 업체명
 * @property {string} analysis.bestValueVendor - 가성비 최고 업체명
 * @property {string} analysis.riskVendor - 추가금 위험 높은 업체명
 * @property {Object[]} analysis.vendorScores - 업체별 점수/요약
 */
