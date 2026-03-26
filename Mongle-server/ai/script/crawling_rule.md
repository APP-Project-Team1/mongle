Mongle-server\ai\script\crawl_kakao.py 파일을 활용해서 카카오 크롤링을 하려고 하는데 결혼식장, 스튜디오, 드레스, 메이크업, 패키지(스튜디오, 드레스, 메이크업 패키지), 영상 및 본식 스냅 각 카테고리별로 아래에 적힌 형식에 맞게 별도 파일을 생성해서 hall_vendors.json, studio_vendors.json, dress_vendors.json, makeup_vendors.json, package_vendors.json, video_snap.json 이렇게 개별적으로 만들어줘.

//hall_vendors.json 형식
{
"basic_info": {
"vendor_id": "hall_1426961148",
"source": "kakao",
"source_id": "1426961148",
"name": "예시 웨딩홀",
"category": "wedding_hall",
"raw_category": "가정,생활 > 결혼 > 예식장",
"region": "서울",
"district": "강남구",
"neighborhood": "청담동",
"address": "서울 강남구 청담동 00-00",
"phone": "02-0000-0000",
"website_url": "http://example.com",
"source_url": "http://place.map.kakao.com/1426961148",
"lat": 37.000000,
"lng": 127.000000,
"status": "active"
},
"search_filters": {
"hall_type": "hotel",
"available_wedding_types": ["호텔웨딩", "채플웨딩"],
"style_concepts": ["모던", "클래식", "럭셔리"],
"district": "강남구",
"guest_capacity_min": 100,
"guest_capacity_max": 300,
"guaranteed_guest_count_min": 150,
"guaranteed_guest_count_max": 250,
"meal_price_per_person": 120000,
"rental_fee_base": 7000000,
"parking_available": true,
"season_recommended": ["봄", "가을"],
"meal_type": "뷔페",
"price_level": "high"
},
"details": {
"hall_type": "호텔",
"hall_count": 2,
"has_ceremony_and_banquet": true,
"banquet_separated": false,
"ceremony_time_minutes": 60,
"available_times": ["11:00", "13:00", "15:00", "17:00"],
"bride_room_available": true,
"dress_room_available": true,
"makeup_room_available": true,
"parking_available": true,
"parking_capacity": 250,
"meal_type": "뷔페",
"meal_note": "한식/양식 혼합",
"specialties": ["대형 하객 수용", "고급 연출", "식사 만족도"],
"recommended_for": ["호텔 예식을 원하는 커플", "200명 이상 하객 예정 커플"]
},
"pricing": {
"currency": "KRW",
"meal_price_per_person": 120000,
"meal_price_weekday": 110000,
"meal_price_weekend": 120000,
"rental_fee_base": 7000000,
"rental_fee_weekday": 6000000,
"rental_fee_weekend": 7000000,
"minimum_total_estimate": 25000000,
"estimate_basis": "보증인원 150명 기준",
"price_note": "청담/호텔 기준 합리적 더미값 (정확한 확인 필요)"
},
"content": {
"short_description": "청담 지역의 고급 호텔형 웨딩홀",
"review_summary_positive": ["홀 분위기가 고급스러움", "식사 만족도가 높음"],
"review_summary_negative": ["주말 예약 경쟁이 높음"],
"tags": ["청담", "호텔", "럭셔리", "대형 예식"],
"search_text": "예시 웨딩홀은 서울 강남구 청담동에 위치한 호텔형 웨딩홀이다. 모던, 클래식, 럭셔리 스타일의 예식에 적합하며 100명에서 300명 규모 예식이 가능하다. 인당 기본 식대는 12만원, 기본 대관료는 700만원이다."
},
"quality_control": {
"is_dummy_enriched": true,
"dummy_fields": [
"meal_price_per_person",
"rental_fee_base",
"minimum_total_estimate"
],
"verification_notes": [
"정확한 견적은 업체 확인 필요"
],
"last_updated_at": "2026-03-26T00:00:00Z"
}
}

//studio_vendors.json
{
"basic_info": {
"vendor_id": "studio_1426961148",
"source": "kakao",
"source_id": "1426961148",
"name": "클레스튜디오",
"category": "studio",
"raw_category": "가정,생활 > 결혼 > 웨딩스튜디오",
"region": "서울",
"district": "강남구",
"neighborhood": "논현동",
"address": "서울 강남구 논현동 57-6",
"phone": "02-514-3530",
"website_url": null,
"source_url": "http://place.map.kakao.com/1426961148",
"lat": 37.5137008805794,
"lng": 127.027473358377,
"status": "active"
},
"search_filters": {
"style_concepts": ["모던", "클래식", "럭셔리"],
"shoot_tones": ["밝은톤", "화보형", "정적인"],
"preferred_wedding_types": ["호텔웨딩", "채플웨딩"],
"specialties": ["인물중심", "배경중심", "야간촬영"],
"indoor_shoot": true,
"outdoor_shoot": true,
"district": "강남구",
"price_min": 1800000,
"price_max": 3500000,
"price_level": "mid_high"
},
"details": {
"style_concepts": ["모던", "클래식", "럭셔리"],
"shoot_tones": ["밝은톤", "화보형", "정적인"],
"preferred_wedding_types": ["호텔웨딩", "채플웨딩"],
"specialties": ["인물중심", "배경중심", "야간촬영"],
"indoor_shoot": true,
"outdoor_shoot": true,
"retouch_style": ["자연보정", "화사보정"],
"retouched_photo_count": 20,
"original_photo_provided": true,
"shoot_duration_minutes": 240,
"recommended_for": ["세련된 화보 스타일을 원하는 커플", "강남권 예식 예정 커플"]
},
"pricing": {
"currency": "KRW",
"price_min": 1800000,
"price_max": 3500000,
"pricing_type": "package",
"package_note": "촬영 패키지 기준 더미값 (정확한 확인 필요)",
"includes": ["촬영", "기본 보정", "원본 일부 제공"],
"excludes": ["드레스", "메이크업"],
"price_note": "강남권/럭셔리 스타일 기준 합리적 더미값 (정확한 확인 필요)"
},
"content": {
"short_description": "고급스러운 웨딩 촬영을 제공하는 강남권 스튜디오",
"review_summary_positive": ["사진 톤이 세련됨", "인물 보정 만족도 높음"],
"review_summary_negative": ["예약 경쟁이 있는 편"],
"tags": ["강남", "스튜디오", "럭셔리", "화보형"],
"search_text": "클레스튜디오는 서울 강남구 논현동에 위치한 웨딩 스튜디오로 모던, 클래식, 럭셔리 스타일 촬영에 강점이 있다. 밝은 톤과 화보형 촬영이 가능하며 인물 중심, 배경 중심, 야간 촬영에 적합하다. 예상 가격대는 180만원에서 350만원이다."
},
"quality_control": {
"is_dummy_enriched": true,
"dummy_fields": [
"price_min",
"price_max",
"retouched_photo_count",
"shoot_duration_minutes"
],
"verification_notes": [
"패키지 구성은 실제 업체 정책 확인 필요",
"가격은 지역/스타일 기준 보정"
],
"last_updated_at": "2026-03-26T00:00:00Z"
}
}

//dress_vendors.json
{
"basic_info": {
"vendor_id": "dress_1426961148",
"source": "kakao",
"source_id": "1426961148",
"name": "예시 드레스샵",
"category": "dress",
"raw_category": "가정,생활 > 결혼 > 웨딩드레스",
"region": "서울",
"district": "강남구",
"neighborhood": "청담동",
"address": "서울 강남구 청담동 00-00",
"phone": "02-0000-0000",
"website_url": null,
"source_url": "http://place.map.kakao.com/1426961148",
"lat": 37.000000,
"lng": 127.000000,
"status": "active"
},
"search_filters": {
"dress_styles": ["머메이드", "A라인", "벨라인"],
"dress_moods": ["우아한", "로맨틱", "럭셔리"],
"imported_brands_available": true,
"custom_made_available": false,
"fitting_available": true,
"district": "강남구",
"rental_price_min": 1500000,
"rental_price_max": 4000000,
"price_level": "high"
},
"details": {
"dress_styles": ["머메이드", "A라인", "벨라인"],
"dress_moods": ["우아한", "로맨틱", "럭셔리"],
"fabric_keywords": ["실크", "비즈", "레이스"],
"imported_brands_available": true,
"custom_made_available": false,
"fitting_available": true,
"fitting_fee": 50000,
"specialties": ["체형 보완 추천", "실크 드레스", "고급 수입 드레스"],
"recommended_for": ["호텔 웨딩 예정 신부", "럭셔리 스타일 선호 신부"]
},
"pricing": {
"currency": "KRW",
"rental_price_min": 1500000,
"rental_price_max": 4000000,
"purchase_price_min": 3000000,
"purchase_price_max": 8000000,
"pricing_type": "rental_or_purchase",
"price_note": "청담/수입 드레스샵 기준 합리적 더미값 (정확한 확인 필요)"
},
"content": {
"short_description": "청담권 고급 웨딩드레스 셀렉이 가능한 드레스샵",
"review_summary_positive": ["드레스 라인업이 다양함", "체형 추천이 좋음"],
"review_summary_negative": ["가격대가 높은 편"],
"tags": ["청담", "드레스", "수입드레스", "럭셔리"],
"search_text": "예시 드레스샵은 서울 강남구 청담동에 위치한 웨딩드레스 전문 업체다. 머메이드, A라인, 벨라인 드레스를 제공하며 우아하고 럭셔리한 무드에 적합하다. 수입 드레스 취급이 가능하며 예상 대여 가격은 150만원에서 400만원이다."
},
"quality_control": {
"is_dummy_enriched": true,
"dummy_fields": [
"rental_price_min",
"rental_price_max",
"purchase_price_min",
"purchase_price_max",
"fitting_fee"
],
"verification_notes": [
"실제 드레스 라인업 확인 필요",
"가격은 청담/수입 드레스 기준 보정"
],
"last_updated_at": "2026-03-26T00:00:00Z"
}
}

//makeup_vendors.json
{
"basic_info": {
"vendor_id": "makeup_1426961148",
"source": "kakao",
"source_id": "1426961148",
"name": "예시 메이크업샵",
"category": "makeup",
"raw_category": "가정,생활 > 결혼 > 웨딩메이크업",
"region": "서울",
"district": "강남구",
"neighborhood": "청담동",
"address": "서울 강남구 청담동 00-00",
"phone": "02-0000-0000",
"website_url": null,
"source_url": "http://place.map.kakao.com/1426961148",
"lat": 37.000000,
"lng": 127.000000,
"status": "active"
},
"search_filters": {
"makeup_styles": ["내추럴", "화사한", "고급스러운"],
"hair_styles_supported": ["업스타일", "웨이브", "로우번"],
"shop_type": "청담샵",
"district": "강남구",
"bride_makeup_price": 350000,
"bride_hair_makeup_price": 500000,
"family_makeup_available": true,
"trial_makeup_available": true,
"price_level": "high"
},
"details": {
"makeup_styles": ["내추럴", "화사한", "고급스러운"],
"hair_styles_supported": ["업스타일", "웨이브", "로우번"],
"shop_type": "청담샵",
"family_makeup_available": true,
"trial_makeup_available": true,
"trial_makeup_price": 150000,
"artist_designation_available": true,
"specialties": ["피부 표현", "청순 메이크업", "호텔 예식 메이크업"],
"recommended_for": ["자연스럽고 고급스러운 메이크업을 원하는 신부", "청담권 예식 준비 고객"]
},
"pricing": {
"currency": "KRW",
"bride_makeup_price": 350000,
"bride_hair_price": 200000,
"bride_hair_makeup_price": 500000,
"family_makeup_price": 120000,
"trial_makeup_price": 150000,
"price_note": "청담 메이크업샵 기준 합리적 더미값 (정확한 확인 필요)"
},
"content": {
"short_description": "청담권 웨딩 전문 메이크업샵",
"review_summary_positive": ["피부 표현이 자연스러움", "헤어 완성도가 높음"],
"review_summary_negative": ["지정 아티스트 비용이 추가될 수 있음"],
"tags": ["청담", "메이크업", "헤어메이크업", "호텔웨딩"],
"search_text": "예시 메이크업샵은 서울 강남구 청담동에 위치한 웨딩 메이크업 전문 업체다. 내추럴하고 화사한 스타일에 강점이 있으며 업스타일, 웨이브, 로우번 헤어를 지원한다. 신부 헤어+메이크업 예상 가격은 50만원 수준이다."
},
"quality_control": {
"is_dummy_enriched": true,
"dummy_fields": [
"bride_makeup_price",
"bride_hair_price",
"bride_hair_makeup_price",
"family_makeup_price",
"trial_makeup_price"
],
"verification_notes": [
"아티스트 지정 비용 여부는 업체 확인 필요",
"가격은 청담 메이크업샵 기준 보정"
],
"last_updated_at": "2026-03-26T00:00:00Z"
}
}

//package_vendors.json
[
{
"basic_info": {
"package_id": "package_0001",
"name": "프리미엄 스드메 패키지",
"category": "package",
"region": "서울",
"district": "강남구",
"vendor_links": {
"studio_id": "studio_1426961148",
"dress_id": "dress_1426961148",
"makeup_id": "makeup_1426961148"
},
"status": "active"
},
"search_filters": {
"package_type": "스드메",
"region": "서울",
"district": "강남구",
"price_min": 2500000,
"price_max": 4500000,
"price_level": "high",
"includes_studio": true,
"includes_dress": true,
"includes_makeup": true,
"style_concepts": ["럭셔리", "모던"],
"recommended_for": ["호텔웨딩", "강남 예식"]
},
"details": {
"package_type": "스드메",
"includes": {
"studio": true,
"dress": true,
"makeup": true
},
"studio_details": {
"shoot_type": ["실내", "야외"],
"retouched_photos": 20
},
"dress_details": {
"dress_count": 2,
"tuxedo_included": true
},
"makeup_details": {
"bride_hair_makeup": true,
"trial_makeup": true
},
"specialties": ["고급 패키지", "청담 라인업"],
"recommended_for": ["럭셔리 웨딩 준비 커플"]
},
"pricing": {
"currency": "KRW",
"price_min": 2500000,
"price_max": 4500000,
"price_type": "package",
"additional_costs": [
"드레스 업그레이드 비용 발생 가능",
"촬영 추가 컷 비용 발생 가능"
],
"price_note": "강남/청담 기준 더미 추정값 (정확한 확인 필요)"
},
"content": {
"short_description": "스튜디오, 드레스, 메이크업이 포함된 통합 웨딩 패키지",
"tags": ["스드메", "패키지", "럭셔리", "강남"],
"search_text": "이 패키지는 스튜디오 촬영, 드레스, 메이크업이 포함된 스드메 패키지다. 강남 지역 기준으로 구성된 고급 패키지이며 가격대는 250만원에서 450만원 수준이다."
},
"quality_control": {
"is_dummy_enriched": true,
"dummy_fields": [
"price_min",
"price_max",
"retouched_photos",
"dress_count"
],
"verification_notes": [
"패키지 구성은 업체별 상이함",
"가격은 지역 기준 더미 보정"
],
"last_updated_at": "2026-03-26T00:00:00Z"
}
}
]

//video_snap.json
[
{
"basic_info": {
"vendor_id": "video_0001",
"name": "예시 영상/스냅 업체",
"category": "video_snap",
"region": "서울",
"district": "강남구",
"neighborhood": "청담동",
"phone": "02-0000-0000",
"website_url": null,
"status": "active"
},
"search_filters": {
"service_types": ["본식스냅", "웨딩영상"],
"video_style": ["감성", "시네마틱"],
"photo_style": ["자연스러운", "다큐형"],
"district": "강남구",
"price_min": 800000,
"price_max": 2500000,
"price_level": "mid_high",
"highlight_video_included": true,
"full_video_included": true
},
"details": {
"service_types": ["본식스냅", "웨딩영상"],
"photo_details": {
"photographer_count": 1,
"delivered_photos": 500,
"retouched_photos": 20
},
"video_details": {
"videographer_count": 1,
"highlight_video_duration_minutes": 3,
"full_video_included": true
},
"equipment_level": "전문 장비",
"specialties": ["감성 영상", "자연스러운 스냅"],
"recommended_for": ["감성적인 웨딩 기록을 원하는 커플"]
},
"pricing": {
"currency": "KRW",
"price_min": 800000,
"price_max": 2500000,
"pricing_type": "package",
"includes": [
"본식 촬영",
"보정 사진",
"하이라이트 영상"
],
"additional_costs": [
"촬영 인원 추가 비용",
"원본 전체 제공 비용"
],
"price_note": "강남/감성 영상 기준 더미 추정값 (정확한 확인 필요)"
},
"content": {
"short_description": "본식 스냅 및 웨딩 영상 촬영 전문 업체",
"tags": ["웨딩영상", "본식스냅", "감성", "시네마틱"],
"search_text": "이 업체는 본식 스냅과 웨딩 영상 촬영을 제공하며 감성적이고 시네마틱한 스타일에 강점이 있다. 가격대는 약 80만원에서 250만원 수준이다."
},
"quality_control": {
"is_dummy_enriched": true,
"dummy_fields": [
"price_min",
"price_max",
"delivered_photos",
"highlight_video_duration_minutes"
],
"verification_notes": [
"촬영 구성은 업체별 상이",
"가격은 지역 및 스타일 기준 더미 보정"
],
"last_updated_at": "2026-03-26T00:00:00Z"
}
}
]
