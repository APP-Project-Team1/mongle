// src/data/mockData.js

export const PLANNER_NAME = '수진';
export const TODAY = '2026년 3월 26일 목요일';
export const URGENT_TODO_COUNT = 2;

export const KPI_DATA = [
  { label: '담당 커플', value: '12', sub: '진행 8 · 완료 4', color: 'var(--accent-secondary)', bg: 'var(--stage-1-bg)' },
  { label: '이번 달 결혼식', value: '3', sub: '4월 5 · 12 · 26일', color: 'var(--accent-secondary)', bg: 'var(--stage-1-bg)' },
];

// used slightly differently between Dashboard and CoupleList, let's keep Dashboard's simple one here as DASHBOARD_COUPLES
export const DASHBOARD_COUPLES = [
  { id: '1', initials: '박이', name: '박지수 · 이현우', date: '4월 5일', venue: '더채플 청담', dday: 11, progress: 92, avatarBg: 'var(--avatar-0-bg)', avatarColor: 'var(--avatar-0-color)', barColor: 'var(--stage-1-bar)', badgeBg: 'var(--avatar-0-bg)', badgeColor: 'var(--avatar-0-color)' },
  { id: '2', initials: '최강', name: '최민정 · 강태준', date: '4월 12일', venue: '롯데호텔 잠실', dday: 18, progress: 78, avatarBg: 'var(--avatar-1-bg)', avatarColor: 'var(--avatar-1-color)', barColor: 'var(--stage-2-bar)', badgeBg: 'var(--avatar-1-bg)', badgeColor: 'var(--avatar-1-color)' },
];

export const TODOS = [
  { id: '1', text: '청첩장 시안 최종 확인', couple: '박지수·이현우', done: true, urgent: false },
  { id: '2', text: '드레스 피팅 일정 조율', couple: '최민정·강태준', done: false, urgent: true },
  { id: '3', text: '스튜디오 계약서 검토', couple: '윤서연·오민석', done: false, urgent: true },
];

export const VENDORS = [
  { id: '1', type: '스튜디오', name: '일다스튜디오', status: '계약 완료', statusColor: 'var(--stage-4-color)' },
  { id: '2', type: '드레스', name: '르블랑 웨딩', status: '피팅 조율', statusColor: 'var(--stage-2-color)' },
  { id: '4', type: '웨딩홀', name: '더채플 청담', status: '잔금 미납', statusColor: 'var(--stage-1-color)' },
];

export const VENDOR_CATEGORIES = ['스튜디오', '드레스', '메이크업', '웨딩홀'];

export const FINANCE = {
  couples: [
    { id: '1', name: '박지수 · 이현우', total: 38000000, received: 31500000, due: '4월 1일', vendorCosts: [{ vendor: '일다스튜디오', amount: 5000000, paid: true }, { vendor: '르블랑 웨딩', amount: 8000000, paid: false }, { vendor: '더채플 청담', amount: 9000000, paid: false }] },
    { id: '2', name: '최민정 · 강태준', total: 42000000, received: 21000000, due: '4월 8일', vendorCosts: [{ vendor: '일다스튜디오', amount: 5500000, paid: true }, { vendor: '뷰티스튜디오K', amount: 3000000, paid: false }, { vendor: '롯데호텔 잠실', amount: 12000000, paid: false }] },
    { id: '3', name: '윤서연 · 오민석', total: 35000000, received: 35000000, due: null, vendorCosts: [{ vendor: '모먼트 스냅', amount: 4000000, paid: true }, { vendor: '그랜드 인터컨티', amount: 10000000, paid: true }] },
  ],
};

export const INITIAL_COUPLES = [
  { id: '1', name: '박지수 · 이현우', date: '2026년 4월 5일', venue: '더채플 청담', stage: '최종 점검', phone: '010-1234-5678', progress: 92, avatarIdx: 0 },
  { id: '2', name: '최민정 · 강태준', date: '2026년 4월 12일', venue: '롯데호텔 잠실', stage: '준비 중', phone: '010-2345-6789', progress: 78, avatarIdx: 1 },
  { id: '3', name: '윤서연 · 오민석', date: '2026년 4월 26일', venue: '그랜드 인터컨티', stage: '준비 중', phone: '010-3456-7890', progress: 55, avatarIdx: 2 },
  { id: '4', name: '정하린 · 김도윤', date: '2026년 5월 31일', venue: '더베뉴 한남', stage: '초기 상담', phone: '010-4567-8901', progress: 30, avatarIdx: 3 },
  { id: '5', name: '이수아 · 한재원', date: '2026년 6월 14일', venue: '파크하얏트 서울', stage: '초기 상담', phone: '010-5678-9012', progress: 20, avatarIdx: 4 },
  { id: '6', name: '강민준 · 서지영', date: '2026년 7월 4일', venue: '신라호텔', stage: '계약 완료', phone: '010-6789-0123', progress: 15, avatarIdx: 5 },
];

export const STAGE_STYLE = {
  '최종 점검': { stageColor: 'var(--stage-1-color)', stageBg: 'var(--stage-1-bg)', barColor: 'var(--stage-1-bar)', badgeBg: 'var(--avatar-0-bg)', badgeColor: 'var(--avatar-0-color)' },
  '준비 중': { stageColor: 'var(--stage-2-color)', stageBg: 'var(--stage-2-bg)', barColor: 'var(--stage-2-bar)', badgeBg: 'var(--avatar-1-bg)', badgeColor: 'var(--avatar-1-color)' },
  '초기 상담': { stageColor: 'var(--stage-3-color)', stageBg: 'var(--stage-3-bg)', barColor: 'var(--stage-3-bar)', badgeBg: 'var(--avatar-2-bg)', badgeColor: 'var(--avatar-2-color)' },
  '계약 완료': { stageColor: 'var(--stage-4-color)', stageBg: 'var(--stage-4-bg)', barColor: 'var(--stage-4-bar)', badgeBg: 'var(--avatar-5-bg)', badgeColor: 'var(--avatar-5-color)' },
};

export const STAGE_FILTERS = ['전체', '최종 점검', '준비 중', '초기 상담', '계약 완료'];

export const calcDday = (dateStr) => {
  const m = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (!m) return 999;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

export const formatMoney = (n) => (n / 10000).toLocaleString() + '만';