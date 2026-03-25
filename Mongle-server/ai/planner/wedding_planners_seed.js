// wedding_planners_seed.js
const fs = require('fs');

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sampleMany(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, fixed = 1) {
  return Number((Math.random() * (max - min) + min).toFixed(fixed));
}

const names = [
  '김서연',
  '이하린',
  '박지우',
  '최민서',
  '정수빈',
  '한유진',
  '오채린',
  '서은아',
  '윤가은',
  '신하율',
  '강다은',
  '조예린',
  '임소윤',
  '장하린',
  '문지안',
  '권나연',
  '송유나',
  '백하은',
  '전채원',
  '류아린',
  '김다희',
  '이수아',
  '박하연',
  '최예나',
  '정유리',
  '한지민',
  '오세린',
  '서하늘',
  '윤소정',
  '신지우',
  '강수연',
  '조은별',
  '임가영',
  '장예림',
  '문서희',
  '권도연',
  '송나리',
  '백유진',
  '전하린',
  '류채은',
  '김지원',
  '이예진',
  '박서윤',
  '최가은',
  '정다인',
  '한예림',
  '오시은',
  '서나연',
  '윤채아',
  '신유빈',
];

const brandPrefixes = [
  '라루체',
  '메종',
  '블룸',
  '아르떼',
  '루미에르',
  '모먼트',
  '화이트',
  '디어',
  '플로라',
  '엘르',
  '벨라',
  '로맨틱',
  '오브',
  '세레나',
  '비쥬',
];

const brandSuffixes = [
  '웨딩',
  '웨딩랩',
  '브라이드',
  '플래닝',
  '하우스',
  '모먼트',
  '스튜디오',
  '컴퍼니',
  '컨설팅',
  '디렉트',
];

const titles = ['웨딩 플래너', '웨딩 디렉터', '수석 플래너', '웨딩 컨설턴트', '브라이덜 디렉터'];

const oneLiners = [
  '감성 야외 웨딩 전문',
  '예산 맞춤형 웨딩 플래닝',
  '호텔 웨딩 디테일에 강한 플래너',
  '트렌디하고 세련된 웨딩 연출',
  '신랑신부 취향 중심의 1:1 플래닝',
  '작지만 완성도 높은 스몰웨딩 전문',
  '럭셔리 웨딩부터 미니멀 웨딩까지',
  '준비 과정까지 편안한 웨딩 메이트',
  '실속과 분위기를 모두 잡는 웨딩 플래닝',
  '하우스웨딩 감성 연출 전문',
];

const specialtiesPool = [
  '스몰웨딩',
  '호텔웨딩',
  '야외웨딩',
  '하우스웨딩',
  '채플웨딩',
  '가든웨딩',
  '럭셔리웨딩',
  '셀프웨딩',
  '리마인드웨딩',
  '한옥웨딩',
];

const styleKeywordsPool = [
  '감성',
  '럭셔리',
  '미니멀',
  '트렌디',
  '로맨틱',
  '내추럴',
  '클래식',
  '세련된',
  '화려한',
  '모던',
  '따뜻한',
  '유니크',
];

const majorExperiencesPool = [
  '5성급 호텔 웨딩 제휴 경험',
  '유명 드레스샵 협업 진행',
  '웨딩 박람회 VIP 고객 전담',
  '브랜드 스냅 업체와 다수 협업',
  '야외 웨딩 전문 운영 경험',
  '하우스웨딩 기획 디렉팅 경험',
  '소규모 프라이빗 웨딩 다수 진행',
  '웨딩홀 비교 컨설팅 특화',
  '예산 최적화 플래닝 노하우 보유',
  '신혼여행 연계 상담 경험',
];

const reviewPool = [
  '진짜 친구처럼 세심하게 챙겨주셔서 너무 든든했어요.',
  '예산 안에서 최고의 선택지를 제안해주셔서 만족했습니다.',
  '준비 과정이 복잡할 줄 알았는데 정말 체계적으로 도와주셨어요.',
  '스타일 제안이 탁월해서 원하는 분위기를 정확히 구현했어요.',
  '당일 진행이 매끄러워서 아무 걱정 없이 결혼식 했습니다.',
  '응답이 빨라서 준비 내내 불안함이 없었어요.',
  '하나하나 취향을 반영해주셔서 만족도가 높았습니다.',
  '업체 추천 퀄리티가 좋고 강요가 없어서 편했어요.',
  '스몰웨딩인데도 정말 풍성하고 특별하게 만들어주셨어요.',
  '실무 경험이 많아서 판단이 빠르고 정확했습니다.',
];

const serviceScopePool = [
  '업체 추천',
  '일정 관리',
  '예산 관리',
  '당일 진행',
  '드레스/메이크업 상담',
  '웨딩홀 비교',
  '스냅/영상 업체 연계',
  '청첩장/답례품 가이드',
  '식순 컨설팅',
  '혼주 가이드',
];

const serviceFeaturesPool = [
  '1:1 맞춤 컨설팅',
  '비동행 진행 가능',
  '예산 최적화 전문',
  '실시간 카톡 상담',
  '야간 상담 가능',
  '체크리스트 제공',
  '웨딩홀 동행 가능',
  '계약서 검토 지원',
  '당일 긴급 대응',
  '신랑신부 성향 분석 기반 추천',
];

const regionsPool = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '대전',
  '광주',
  '제주',
  '전국',
  '해외',
];

const ctaPool = ['상담 신청', '카톡 문의', '견적 받기', '포트폴리오 보기', '1:1 상담 예약'];

function generateProfileImage(seed) {
  return `https://picsum.photos/seed/planner-${seed}/400/400`;
}

function generatePortfolioImages(seed) {
  return [
    `https://picsum.photos/seed/${seed}-1/1200/800`,
    `https://picsum.photos/seed/${seed}-2/1200/800`,
    `https://picsum.photos/seed/${seed}-3/1200/800`,
    `https://picsum.photos/seed/${seed}-4/1200/800`,
  ];
}

function generatePlanner(index) {
  const name = names[index % names.length];
  const brandName = `${sample(brandPrefixes)} ${sample(brandSuffixes)}`;
  const careerYears = randomInt(2, 12);
  const weddingsCompleted = randomInt(40, 350);
  const rating = randomFloat(4.3, 5.0, 1);
  const basePrice = randomInt(80, 300) * 10000;

  return {
    name,
    brand_name: brandName,
    title: sample(titles),
    profile_image_url: generateProfileImage(index + 1),
    one_liner: sample(oneLiners),
    specialties: sampleMany(specialtiesPool, randomInt(2, 4)),
    style_keywords: sampleMany(styleKeywordsPool, randomInt(2, 4)),
    career_years: careerYears,
    weddings_completed: weddingsCompleted,
    major_experiences: sampleMany(majorExperiencesPool, randomInt(2, 3)),
    rating,
    reviews: sampleMany(reviewPool, 2).map((content) => ({
      rating: randomFloat(4.5, 5.0, 1),
      content,
    })),
    base_price_krw: basePrice,
    service_scope: {
      included: sampleMany(serviceScopePool, randomInt(4, 7)),
      extra_cost_possible: Math.random() < 0.5,
    },
    portfolio_images: generatePortfolioImages(`planner-${index + 1}`),
    service_features: sampleMany(serviceFeaturesPool, randomInt(3, 5)),
    activity_regions: sampleMany(regionsPool, randomInt(1, 3)),
    cta: sample(ctaPool),
    created_at: new Date().toISOString(),
  };
}

function generatePlanners(count = 50) {
  return Array.from({ length: count }, (_, i) => generatePlanner(i));
}

const planners = generatePlanners(50);

fs.writeFileSync('wedding_planners.json', JSON.stringify(planners, null, 2), 'utf8');

console.log('wedding_planners.json 생성 완료');
