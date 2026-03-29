/**
 * 숫자를 3자리마다 콤마가 찍힌 문자열로 변환합니다.
 * @param {number | string} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || num === '') return '';
  const n = typeof num === 'string' ? parseInt(num.replace(/\D/g, '')) : num;
  if (isNaN(n)) return '';
  return new Intl.NumberFormat('ko-KR').format(n);
};

/**
 * 만원 단위 금액을 포맷팅합니다.
 * @param {number | string} val 
 * @returns {string}
 */
export const formatPrice = (val) => {
  if (!val) return '미정';
  return `${formatNumber(val)}만원`;
};

export const CATEGORY_MAP = {
  '웨딩홀': 'wedding_hall',
  '스튜디오': 'studio',
  '드레스': 'dress',
  '메이크업': 'makeup',
  '헤어 (추가 옵션)': 'makeup',
  '본식스냅': 'snapshot',
  '스드메 패키지': 'package',
};

export const CATEGORY_LABEL = Object.fromEntries(
  Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k])
);

export const formatTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));

  if (diffInMins < 1) return '방금 전';
  if (diffInMins < 60) return `${diffInMins}분 전`;

  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}일 전`;
};