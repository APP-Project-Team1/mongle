# 웨딩 카테고리별 더미 데이터 주입 규칙

## 목적

이 문서는 카카오 API 기반 크롤링 데이터에 누락된 값을 보완하기 위해
사용하는 **더미 데이터 주입 규칙**을 정의한다.

원칙은 다음과 같다.

1.  실제 크롤링 원본값이 있으면 원본값을 우선 사용한다.
2.  원본값이 없을 때만 더미값을 주입한다.
3.  더미값은 지역, 카테고리, 분위기, 서비스 수준에 따라 **합리적인
    범위** 안에서 넣는다.
4.  더미값이 들어간 항목은 반드시 `quality_control`에 기록한다.
5.  사용자에게 노출될 수 있는 설명 필드에는 필요 시 `정확한 확인 필요`
    문구를 남긴다.

---

## 공통 규칙

### 1. 원본 우선 원칙

- 카카오 원본에 값이 있으면 그대로 사용한다.
- 값이 비어 있거나 `null` 이거나 신뢰하기 어려운 경우에만 더미값을
  넣는다.

### 2. 더미값 표시 원칙

숫자 필드는 숫자로 저장하고, 별도 note 필드에 추정 여부를 표시한다.

예시:

```json
{
  "meal_price_per_person": 120000,
  "price_note": "지역/카테고리 기준 더미 추정값 (정확한 확인 필요)"
}
```

### 3. quality_control 기록 원칙

더미값을 넣은 경우 아래처럼 기록한다.

```json
{
  "quality_control": {
    "is_dummy_enriched": true,
    "dummy_fields": ["meal_price_per_person", "rental_fee_base"],
    "verification_notes": ["가격은 지역/카테고리 기준 더미 보정", "정확한 견적은 업체 확인 필요"]
  }
}
```

### 4. 지역 가중치 원칙

가격 관련 더미값은 지역에 따라 기본 가중치를 둔다.

#### 최상위 가격권

- 청담동
- 압구정동
- 신사동 일부
- 호텔 예식장/프리미엄 웨딩 브랜드

#### 상위 가격권

- 강남구
- 서초구
- 용산구 일부
- 성수 인기 브랜드권

#### 중간 가격권

- 송파구
- 마포구
- 성동구
- 영등포구
- 경기 성남/분당 일부

#### 보통 가격권

- 그 외 서울권
- 수도권 일반 지역

### 5. 가격 레벨 분류 기준

- `low`
- `mid`
- `mid_high`
- `high`
- `premium`

권장 사용 방식:

- 청담 + 호텔/수입/프리미엄 키워드 포함: `premium`
- 강남권 + 럭셔리 키워드 포함: `high`
- 일반 서울권: `mid` 또는 `mid_high`
- 수도권 일반: `mid`

---

## 공통 필드 더미 규칙

### description / short_description

원본 소개 문구가 없으면 카테고리 + 지역 + 스타일 기반으로 작성한다.

형식:

- 웨딩홀: `강남권 예식에 적합한 호텔형 웨딩홀`
- 스튜디오: `세련된 웨딩 촬영을 제공하는 강남권 스튜디오`
- 드레스: `청담권 고급 웨딩드레스 셀렉이 가능한 드레스샵`
- 메이크업: `청담권 웨딩 전문 메이크업샵`

### tags

태그는 최대 4\~6개 정도만 넣는다.

우선순위:

1.  지역
2.  카테고리
3.  스타일/무드
4.  가격대 또는 강점

예시:

- `청담`, `호텔`, `럭셔리`, `대형 예식`
- `강남`, `스튜디오`, `화보형`, `야간촬영`

### review_summary

실제 리뷰가 없는 경우 과장하지 않고 일반적인 수준으로 작성한다.

권장 형식:

- positive: 1\~2개
- negative: 1개

예시:

- positive: `분위기가 세련됨`, `상담 응대가 무난함`
- negative: `정확한 실제 후기 확인 필요`

실제 리뷰가 전혀 없으면 negative에 아래 문구 사용 가능:

- `후기 데이터 부족으로 정확한 확인 필요`

---

## 1. 웨딩홀 더미 데이터 규칙

### 대상 주요 필드

- `hall_type`
- `guest_capacity_min`
- `guest_capacity_max`
- `guaranteed_guest_count_min`
- `guaranteed_guest_count_max`
- `meal_price_per_person`
- `rental_fee_base`
- `minimum_total_estimate`
- `available_wedding_types`
- `style_concepts`
- `parking_available`

### hall_type 추정 규칙

카카오 카테고리명, 이름, 설명에 따라 분류한다.

#### hotel

다음 키워드가 있으면 우선 `hotel`

- 호텔
- 호텔웨딩
- 그랜드
- 인터컨티넨탈
- 신라
- 조선
- 롯데

#### convention

다음 키워드가 있으면 `convention`

- 컨벤션
- 컨벤션홀
- 웨딩컨벤션

#### house

다음 키워드가 있으면 `house`

- 하우스
- 가든
- 채플하우스
- 단독홀

#### chapel

다음 키워드가 있으면 `chapel`

- 채플
- 성당 느낌
- 교회

없으면 기본값은 `wedding_hall_general`

### 스타일 추정 규칙

#### hotel

- `style_concepts`: `모던`, `클래식`, `럭셔리`
- `available_wedding_types`: `호텔웨딩`, `채플웨딩`

#### convention

- `style_concepts`: `모던`, `화려한`
- `available_wedding_types`: `컨벤션웨딩`, `대형예식`

#### house

- `style_concepts`: `내추럴`, `로맨틱`, `감성`
- `available_wedding_types`: `하우스웨딩`, `야외웨딩`

#### chapel

- `style_concepts`: `클래식`, `고급스러운`, `성스러운`
- `available_wedding_types`: `채플웨딩`

### 하객 수 추정 규칙

#### hotel

- `guest_capacity_min`: 100
- `guest_capacity_max`: 300
- `guaranteed_guest_count_min`: 150
- `guaranteed_guest_count_max`: 250

#### convention

- `guest_capacity_min`: 150
- `guest_capacity_max`: 500
- `guaranteed_guest_count_min`: 200
- `guaranteed_guest_count_max`: 400

#### house

- `guest_capacity_min`: 50
- `guest_capacity_max`: 150
- `guaranteed_guest_count_min`: 70
- `guaranteed_guest_count_max`: 120

#### chapel

- `guest_capacity_min`: 80
- `guest_capacity_max`: 250
- `guaranteed_guest_count_min`: 100
- `guaranteed_guest_count_max`: 200

### 식대 더미 규칙

#### premium

- `meal_price_per_person`: 110000 \~ 180000

#### high

- `meal_price_per_person`: 85000 \~ 130000

#### mid_high

- `meal_price_per_person`: 70000 \~ 95000

#### mid

- `meal_price_per_person`: 50000 \~ 80000

권장 세팅:

- 청담 + hotel: 120000 전후
- 강남 + hotel: 90000 \~ 120000
- 일반 서울 convention: 70000 \~ 90000
- house: 60000 \~ 100000

### 대관료 더미 규칙

#### premium

- `rental_fee_base`: 5000000 \~ 15000000

#### high

- `rental_fee_base`: 3000000 \~ 8000000

#### mid_high

- `rental_fee_base`: 1500000 \~ 5000000

#### mid

- `rental_fee_base`: 0 \~ 3000000

### 총액 추정 규칙

공식:

`minimum_total_estimate = (meal_price_per_person × guaranteed_guest_count_min) + rental_fee_base`

예시:

- 식대 120000원
- 보증인원 150명
- 대관료 7000000원

총액:

- `120000 × 150 + 7000000 = 25000000`

### 주차 더미 규칙

- hotel, convention: `parking_available = true`
- house: 기본 `true`, 단 소규모 느낌이면 `정확한 확인 필요` note 추가
- chapel: 기본 `true`

### 웨딩홀 예시 note 문구

- `청담/호텔 기준 더미 추정값 (정확한 확인 필요)`
- `보증인원 및 식대는 실제 상담 시 달라질 수 있음`

---

## 2. 스튜디오 더미 데이터 규칙

### 대상 주요 필드

- `style_concepts`
- `shoot_tones`
- `preferred_wedding_types`
- `specialties`
- `indoor_shoot`
- `outdoor_shoot`
- `price_min`
- `price_max`
- `retouched_photo_count`
- `shoot_duration_minutes`

### 스타일 추정 규칙

#### 강남/논현/청담권 기본값

- `style_concepts`: `모던`, `클래식`, `럭셔리`
- `shoot_tones`: `밝은톤`, `화보형`, `정적인`

#### 자연/감성 계열 이름 포함 시

키워드:

- 가든
- 포레스트
- 내추럴
- 감성

추가값:

- `style_concepts`: `내추럴`, `로맨틱`, `감성`
- `shoot_tones`: `부드러운톤`, `자연광`, `따뜻한`

### 촬영 타입 규칙

- 기본값: `indoor_shoot = true`
- 논현/강남 스튜디오는 기본적으로 `outdoor_shoot = true` 가능
- 명확한 정보 없으면 둘 다 `true`로 두고 note에 확인 필요 표시 가능

### specialties 추정 규칙

기본 추천 세트 중 2\~3개 사용:

- `인물중심`
- `배경중심`
- `야간촬영`
- `자연광촬영`
- `감성연출`
- `화보형연출`

### 가격 더미 규칙

#### premium

- `price_min`: 2500000 \~ 4500000
- `price_max`: 4000000 \~ 7000000

#### high

- `price_min`: 1800000 \~ 3000000
- `price_max`: 3000000 \~ 5000000

#### mid_high

- `price_min`: 1200000 \~ 2200000
- `price_max`: 2200000 \~ 3800000

#### mid

- `price_min`: 800000 \~ 1500000
- `price_max`: 1500000 \~ 2500000

### 보정/촬영 시간 규칙

- `retouched_photo_count`: 기본 10 \~ 30
- `shoot_duration_minutes`: 기본 180 \~ 300
- 강남/럭셔리 계열이면 20장 / 240분 정도로 시작해도 무난

### 스튜디오 예시 note 문구

- `강남권/럭셔리 스타일 기준 더미 추정값 (정확한 확인 필요)`
- `패키지 구성 및 보정 장수는 실제 업체 확인 필요`

---

## 3. 드레스 더미 데이터 규칙

### 대상 주요 필드

- `dress_styles`
- `dress_moods`
- `imported_brands_available`
- `custom_made_available`
- `fitting_available`
- `fitting_fee`
- `rental_price_min`
- `rental_price_max`
- `purchase_price_min`
- `purchase_price_max`

### 스타일 추정 규칙

기본 드레스 라인:

- `머메이드`
- `A라인`
- `벨라인`

기본 무드:

- `우아한`
- `로맨틱`
- `럭셔리`

### 청담/수입 계열 규칙

다음 중 하나라도 만족하면 상향:

- 지역이 청담동
- 이름/설명에 `수입`, `브랜드`, `럭셔리`, `프리미엄`

권장 설정:

- `imported_brands_available = true`
- `price_level = high` 또는 `premium`

### 가격 더미 규칙

#### premium

- `rental_price_min`: 2500000 \~ 4500000
- `rental_price_max`: 4000000 \~ 7000000
- `purchase_price_min`: 5000000 \~ 10000000
- `purchase_price_max`: 8000000 \~ 15000000

#### high

- `rental_price_min`: 1500000 \~ 3000000
- `rental_price_max`: 3000000 \~ 5000000
- `purchase_price_min`: 3000000 \~ 8000000
- `purchase_price_max`: 6000000 \~ 12000000

#### mid_high

- `rental_price_min`: 1000000 \~ 2000000
- `rental_price_max`: 2000000 \~ 3500000
- `purchase_price_min`: 2000000 \~ 5000000
- `purchase_price_max`: 4000000 \~ 8000000

#### mid

- `rental_price_min`: 700000 \~ 1500000
- `rental_price_max`: 1500000 \~ 2500000
- `purchase_price_min`: 1500000 \~ 4000000
- `purchase_price_max`: 3000000 \~ 6000000

### 피팅비 규칙

- 프리미엄/청담권: `30000 ~ 100000`
- 일반: `0 ~ 50000`

### 드레스 예시 note 문구

- `청담/수입 드레스샵 기준 더미 추정값 (정확한 확인 필요)`
- `실제 드레스 라인업 및 피팅 정책 확인 필요`

---

## 4. 메이크업 더미 데이터 규칙

### 대상 주요 필드

- `makeup_styles`
- `hair_styles_supported`
- `shop_type`
- `family_makeup_available`
- `trial_makeup_available`
- `artist_designation_available`
- `bride_makeup_price`
- `bride_hair_price`
- `bride_hair_makeup_price`
- `family_makeup_price`
- `trial_makeup_price`

### 스타일 추정 규칙

기본값:

- `makeup_styles`: `내추럴`, `화사한`, `고급스러운`
- `hair_styles_supported`: `업스타일`, `웨이브`, `로우번`

### 샵 유형 추정 규칙

- 청담/압구정/강남권이면 `shop_type = 청담샵` 또는 `프리미엄샵`
- 그 외 일반 지역이면 `웨딩전문샵`

### 서비스 더미 규칙

기본값:

- `family_makeup_available = true`
- `trial_makeup_available = true`
- `artist_designation_available = true`

정보가 부족하면 note 추가:

- `아티스트 지정 가능 여부는 정확한 확인 필요`

### 가격 더미 규칙

#### premium

- `bride_makeup_price`: 300000 \~ 500000
- `bride_hair_price`: 180000 \~ 300000
- `bride_hair_makeup_price`: 450000 \~ 700000
- `family_makeup_price`: 100000 \~ 180000
- `trial_makeup_price`: 120000 \~ 250000

#### high

- `bride_makeup_price`: 220000 \~ 400000
- `bride_hair_price`: 120000 \~ 250000
- `bride_hair_makeup_price`: 350000 \~ 550000
- `family_makeup_price`: 80000 \~ 150000
- `trial_makeup_price`: 100000 \~ 180000

#### mid_high

- `bride_makeup_price`: 150000 \~ 280000
- `bride_hair_price`: 80000 \~ 180000
- `bride_hair_makeup_price`: 250000 \~ 400000
- `family_makeup_price`: 60000 \~ 120000
- `trial_makeup_price`: 70000 \~ 150000

#### mid

- `bride_makeup_price`: 100000 \~ 220000
- `bride_hair_price`: 50000 \~ 120000
- `bride_hair_makeup_price`: 180000 \~ 300000
- `family_makeup_price`: 50000 \~ 100000
- `trial_makeup_price`: 50000 \~ 100000

### 메이크업 예시 note 문구

- `청담 메이크업샵 기준 더미 추정값 (정확한 확인 필요)`
- `아티스트 지정 비용 및 리허설 비용은 업체 확인 필요`

---

## 5. 랜덤 범위 사용 시 규칙

가격이 모두 똑같아 보이지 않게 하려면 범위 내 랜덤값을 사용할 수 있다.

단, 아래 규칙을 지킨다.

1.  1천원 단위보다 1만원 단위 또는 5만원 단위로 반올림한다.
2.  같은 업체 안에서는 가격 논리가 맞아야 한다.
3.  최소값과 최대값의 차이가 과도하지 않게 한다.

예시:

- 스튜디오 `price_min = 1900000`
- 스튜디오 `price_max = 3400000`

가능

예시:

- `price_min = 1300000`
- `price_max = 8900000`

비권장

### 권장 후처리 규칙

- 식대: 5000원 또는 10000원 단위 반올림
- 대관료: 100000원 또는 500000원 단위 반올림
- 패키지: 100000원 단위 반올림
- 메이크업: 10000원 단위 반올림

---

## 6. 챗봇 응답용 안전 규칙

챗봇이 더미 데이터를 실제 확정 정보처럼 말하지 않도록 아래 규칙을 둔다.

### 응답 원칙

- 더미값이 포함된 항목은 `예상`, `추정`, `기준`, `정확한 확인 필요`
  같은 표현을 사용한다.
- 실제 원본값과 더미값을 구분할 수 있어야 한다.

### 권장 표현

- `현재 등록된 데이터 기준 예상 식대는 ...입니다.`
- `이 항목은 크롤링 원본이 없어 지역 기준으로 추정한 값입니다.`
- `정확한 금액과 패키지 구성은 업체 상담 시 확인이 필요합니다.`

### 피해야 할 표현

- `이 업체 식대는 무조건 12만원입니다.`
- `확정 대관료는 700만원입니다.`

---

## 7. 최종 적용 체크리스트

### 데이터 주입 전

- [ ] 원본값 존재 여부 확인
- [ ] 카테고리 분류 완료
- [ ] 지역 분류 완료
- [ ] 가격 레벨 산정 완료

### 데이터 주입 후

- [ ] 더미 필드 목록 기록
- [ ] note 문구 추가
- [ ] quality_control 업데이트
- [ ] search_text에 과장 표현 없는지 확인

### 사용자 노출 전

- [ ] 실제 확정값처럼 보이지 않는지 확인
- [ ] `정확한 확인 필요` 문구가 필요한 곳에 들어갔는지 확인
- [ ] 필터용 숫자 필드가 정상적으로 저장되었는지 확인

---

## 8. 권장 결론

실제 운영에서는 아래 순서로 처리하는 것을 권장한다.

1.  카카오 원본 수집
2.  카테고리 자동 분류
3.  지역 자동 분류
4.  가격 레벨 자동 부여
5.  누락 필드에 더미값 주입
6.  `quality_control` 기록
7.  챗봇용 `search_text` 생성
8.  사람이 표본 검수

이 문서는 초기 데이터셋 구축을 위한 기준이며, 실제 서비스 운영
단계에서는 제휴 업체 실측 데이터로 점진적으로 대체하는 것을 전제로 한다.

---

## 📦 패키지 (스드메) 더미 데이터 규칙

### 가격 범위

- 기본: 150만원 \~ 300만원
- 강남/청담: 250만원 \~ 450만원
- 프리미엄: 400만원 \~ 700만원

### 가격 보정

- 강남구: +50\~100만원
- 청담동: +100\~200만원
- 럭셔리 포함: +100만원
- 드레스 2벌 이상: +30만원
- 보정 20장 이상: +30만원

### 구성 기본값

- studio = true
- dress = true
- makeup = true

### 세부

- retouched_photos: 10\~30
- dress_count: 1\~3
- trial_makeup: 선택적

### note

- 패키지 구성 및 가격은 더미 추정값 (정확한 확인 필요)

---

## 🎥 영상 / 본식스냅 더미 데이터 규칙

### 가격 범위

- 스냅: 50만원 \~ 150만원
- 영상 포함: 80만원 \~ 250만원
- 프리미엄: 200만원 \~ 400만원

### 가격 보정

- 강남구: +30\~80만원
- 청담동: +50\~100만원
- 영상 포함: +30\~50만원
- 시네마틱 스타일: +50만원

### 촬영 구성

- delivered_photos: 300\~800
- retouched_photos: 10\~30
- highlight_video: 3\~5분
- full_video: 선택적

### 스타일

- video_style: 감성, 시네마틱, 다큐형
- photo_style: 자연스러운, 다큐형, 연출형

### note

- 촬영 구성 및 가격은 더미 추정값 (정확한 확인 필요)
