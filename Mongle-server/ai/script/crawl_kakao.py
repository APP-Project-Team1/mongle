# -*- coding: utf-8 -*-
import sys
import io
import requests
import json
import time
import os
import random
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from dotenv import load_dotenv

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
load_dotenv()

KAKAO_API_KEY = os.getenv("KAKAO_API_KEY")
REQUEST_TIMEOUT = 15

KEYWORDS = {
    "hall": ["서울 웨딩홀", "서울 스몰웨딩", "서울 야외웨딩", "서울 호텔웨딩", "서울 하우스웨딩"],
    "studio": ["서울 웨딩스튜디오", "서울 웨딩사진", "서울 웨딩촬영", "서울 가든스튜디오"],
    "dress": ["서울 웨딩드레스", "서울 드레스샵", "서울 수입드레스", "서울 턱시도"],
    "makeup": ["서울 웨딩메이크업", "서울 웨딩헤어", "서울 청담메이크업"],
    "package": ["서울 스드메", "서울 웨딩패키지"],
    "video_snap": ["서울 본식스냅", "서울 웨딩영상", "서울 웨딩DVD"],
}

SEOUL_DISTRICTS = [
    ("강남구", 37.5172, 127.0473),
    ("서초구", 37.4837, 127.0324),
    ("마포구", 37.5663, 126.9014),
    ("송파구", 37.5145, 127.1059),
    ("종로구", 37.5735, 126.9790),
    ("용산구", 37.5384, 126.9654),
    ("강서구", 37.5509, 126.8495),
    ("영등포구", 37.5263, 126.8963),
]

CATEGORY_ALLOW_RULES = {
    "hall": {
        "allow_keywords": ["웨딩", "예식", "컨벤션", "호텔", "하우스", "채플", "가든"],
        "allow_categories": ["예식장", "웨딩홀", "컨벤션", "호텔"],
        "deny_keywords": ["장례", "뷔페", "식당", "카페", "연회장", "파티룸", "펜션"],
    },
    "studio": {
        "allow_keywords": ["웨딩", "스튜디오", "촬영", "사진"],
        "allow_categories": ["웨딩스튜디오", "사진", "스튜디오"],
        "deny_keywords": ["증명사진", "여권사진", "셀프사진관", "포토이즘", "인생네컷"],
    },
    "dress": {
        "allow_keywords": ["웨딩", "드레스", "턱시도"],
        "allow_categories": ["웨딩드레스", "드레스"],
        "deny_keywords": ["파티드레스", "한복", "교복", "의류매장", "커튼"],
    },
    "makeup": {
        "allow_keywords": ["웨딩", "메이크업", "헤어", "뷰티"],
        "allow_categories": ["웨딩메이크업", "메이크업", "미용"],
        "deny_keywords": ["네일", "왁싱", "피부관리", "반영구", "속눈썹"],
    },
    "package": {
        "allow_keywords": ["스드메", "웨딩패키지", "웨딩", "패키지"],
        "allow_categories": ["웨딩", "결혼"],
        "deny_keywords": ["여행패키지", "허니문", "보험", "상조"],
    },
    "video_snap": {
        "allow_keywords": ["본식스냅", "웨딩영상", "웨딩dvd", "스냅", "영상", "웨딩"],
        "allow_categories": ["사진", "스튜디오", "웨딩"],
        "deny_keywords": ["cctv", "중고카메라", "렌탈", "유튜브편집학원"],
    },
}

OUTPUT_FILES = {
    "hall": "hall_vendors.json",
    "studio": "studio_vendors.json",
    "dress": "dress_vendors.json",
    "makeup": "makeup_vendors.json",
    "package": "package_vendors.json",
    "video_snap": "video_snap_vendors.json",
}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
)

session = requests.Session()
session.headers.update({"User-Agent": USER_AGENT})


def safe_get(url: str, **kwargs) -> Optional[requests.Response]:
    try:
        resp = session.get(url, timeout=REQUEST_TIMEOUT, **kwargs)
        if resp.status_code == 200:
            return resp
        return None
    except requests.RequestException:
        return None


def parse_address(address_name: str) -> Tuple[str, str, str]:
    parts = address_name.split()
    region = parts[0] if len(parts) > 0 else "서울"
    district = parts[1] if len(parts) > 1 else ""
    neighborhood = parts[2] if len(parts) > 2 else ""
    return region, district, neighborhood


def search_places(keyword: str, x: float, y: float, radius: int = 3000, page: int = 1) -> Dict[str, Any]:
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {"query": keyword, "x": x, "y": y, "radius": radius, "page": page, "size": 15}
    resp = safe_get(url, headers=headers, params=params)
    return resp.json() if resp is not None else {}


def round_price(value: int, unit: int = 10000) -> int:
    return int(round(value / unit) * unit)


def determine_price_level(district: str, neighborhood: str, name_or_desc: str) -> str:
    premium_keywords = ["호텔", "수입", "프리미엄", "럭셔리", "그랜드", "신라", "인터컨티넨탈", "조선", "포시즌"]
    is_premium = neighborhood in ["청담동", "압구정동", "신사동"] or any(k in name_or_desc for k in premium_keywords)
    is_high = district in ["강남구", "서초구"] and not is_premium
    is_mid_high = district in ["송파구", "마포구", "성동구", "영등포구", "용산구"]

    if is_premium:
        return "premium"
    if is_high:
        return "high"
    if is_mid_high:
        return "mid_high"
    return "mid"


def extract_text_blob(place: Dict[str, Any]) -> str:
    return " ".join(
        [
            place.get("place_name", ""),
            place.get("category_name", ""),
            place.get("road_address_name", ""),
            place.get("address_name", ""),
            place.get("place_url", ""),
        ]
    ).lower()


def should_keep_place(category: str, place: Dict[str, Any]) -> bool:
    rules = CATEGORY_ALLOW_RULES[category]
    blob = extract_text_blob(place)
    category_name = place.get("category_name", "").lower()
    name = place.get("place_name", "").lower()

    if any(deny.lower() in blob for deny in rules["deny_keywords"]):
        return False

    allow_hit = any(k.lower() in blob for k in rules["allow_keywords"])
    category_hit = any(k.lower() in category_name for k in rules["allow_categories"])

    if category in ["package", "video_snap"]:
        return allow_hit or category_hit

    if category == "studio" and "웨딩" not in blob and "웨딩" not in category_name:
        return False

    if category == "dress" and ("드레스" not in blob and "턱시도" not in blob):
        return False

    if category == "makeup" and ("메이크업" not in blob and "헤어" not in blob and "웨딩" not in blob):
        return False

    if category == "hall":
        wedding_like = ["웨딩", "예식", "컨벤션", "채플", "하우스", "호텔"]
        if not any(k in name or k in category_name for k in wedding_like):
            return False

    return allow_hit or category_hit


def get_base_info(place: Dict[str, Any], category: str) -> Dict[str, Any]:
    region, district, neighborhood = parse_address(place.get("address_name", ""))
    return {
        "vendor_id": f"{category}_{place['id']}",
        "source": "kakao",
        "source_id": place["id"],
        "name": place["place_name"],
        "category": category,
        "raw_category": place.get("category_name", ""),
        "region": region,
        "district": district,
        "neighborhood": neighborhood,
        "address": place.get("address_name", ""),
        "road_address": place.get("road_address_name", ""),
        "phone": place.get("phone", ""),
        "website_url": place.get("place_url", ""),
        "source_url": f"https://place.map.kakao.com/{place['id']}",
        "lat": float(place["y"]),
        "lng": float(place["x"]),
        "status": "active",
    }


def parse_first_float(text: str) -> Optional[float]:
    if not text:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)", text.replace(",", ""))
    return float(m.group(1)) if m else None


def parse_first_int(text: str) -> Optional[int]:
    if not text:
        return None
    m = re.search(r"(\d[\d,]*)", text)
    return int(m.group(1).replace(",", "")) if m else None


def extract_image_urls_from_html(html: str) -> List[str]:
    image_urls = []

    meta_patterns = [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pat in meta_patterns:
        image_urls.extend(re.findall(pat, html, flags=re.I))

    json_url_patterns = [
        r'"imageUrl"\s*:\s*"([^"]+)"',
        r'"image_url"\s*:\s*"([^"]+)"',
        r'"thumbnailUrl"\s*:\s*"([^"]+)"',
        r'"thumbnail_url"\s*:\s*"([^"]+)"',
    ]
    for pat in json_url_patterns:
        image_urls.extend([u.encode("utf-8").decode("unicode_escape") for u in re.findall(pat, html)])

    seen = set()
    result = []
    for url in image_urls:
        if not url:
            continue
        if "kakaocdn" not in url and "daumcdn" not in url and "kakao" not in url:
            continue
        if url in seen:
            continue
        seen.add(url)
        result.append(url)
    return result[:10]


def extract_rating_and_reviews_from_html(html: str) -> Tuple[Optional[float], Optional[int]]:
    candidates_rating = []
    candidates_count = []

    rating_patterns = [
        r'"score"\s*:\s*"?(?P<v>\d+(?:\.\d+)?)"?',
        r'"rating"\s*:\s*"?(?P<v>\d+(?:\.\d+)?)"?',
        r'별점[^0-9]*(?P<v>\d+(?:\.\d+)?)',
        r'평점[^0-9]*(?P<v>\d+(?:\.\d+)?)',
    ]
    count_patterns = [
        r'"reviewCount"\s*:\s*"?(?P<v>\d[\d,]*)"?',
        r'"feedbackCount"\s*:\s*"?(?P<v>\d[\d,]*)"?',
        r'리뷰[^0-9]*(?P<v>\d[\d,]*)',
        r'후기[^0-9]*(?P<v>\d[\d,]*)',
    ]

    for pat in rating_patterns:
        for m in re.finditer(pat, html, flags=re.I):
            val = parse_first_float(m.group("v"))
            if val is not None and 0 <= val <= 5:
                candidates_rating.append(val)

    for pat in count_patterns:
        for m in re.finditer(pat, html, flags=re.I):
            val = parse_first_int(m.group("v"))
            if val is not None and 0 <= val <= 100000:
                candidates_count.append(val)

    rating = max(candidates_rating) if candidates_rating else None
    review_count = max(candidates_count) if candidates_count else None
    return rating, review_count


def scrape_kakao_place_assets(place_id: str) -> Dict[str, Any]:
    """
    Kakao Local Search API itself does not provide stable rating/review/image fields.
    This function tries to enrich data from the Kakao place detail page.
    It is best-effort and may need adjustment if the page structure changes.
    """
    url = f"https://place.map.kakao.com/{place_id}"
    resp = safe_get(url)
    if resp is None:
        return {
            "thumbnail_url": None,
            "image_urls": [],
            "rating_avg": None,
            "review_count": 0,
            "rating_info": {
                "rating_avg": None,
                "rating_scale": 5,
                "review_count": 0,
                "rating_display": "평점 없음",
                "rating_source": "unknown",
                "rating_confidence": "none",
                "rating_reliability": "none",
            },
            "asset_source": "none",
            "asset_note": "상세 페이지 수집 실패 또는 접근 제한",
        }

    html = resp.text
    image_urls = extract_image_urls_from_html(html)
    rating_avg, review_count = extract_rating_and_reviews_from_html(html)

    thumbnail_url = image_urls[0] if image_urls else None

    return {
        "thumbnail_url": thumbnail_url,
        "image_urls": image_urls,
        "rating_avg": rating_avg,
        "review_count": review_count or 0,
        "asset_source": "kakao_place_page",
        "asset_note": "상세 페이지 기반 추출값으로 구조 변경 시 재조정 필요",
    }



def make_rating_display(rating_avg: Optional[float], review_count: Optional[int]) -> str:
    if rating_avg is None and (review_count is None or review_count == 0):
        return "평점 없음"
    if rating_avg is not None and review_count and review_count > 0:
        return f"★ {rating_avg:.1f} ({review_count})"
    if rating_avg is not None:
        return f"★ {rating_avg:.1f}"
    return f"리뷰 {review_count}개"


def make_rating_reliability(rating_avg: Optional[float], review_count: Optional[int]) -> str:
    if rating_avg is None and (review_count is None or review_count == 0):
        return "none"
    if review_count is None:
        return "low"
    if review_count >= 10:
        return "high"
    if review_count >= 3:
        return "medium"
    return "low"

def fallback_review_summary(rating_avg: Optional[float], review_count: int) -> Dict[str, List[str]]:
    if review_count <= 0:
        return {
            "positive": ["후기 데이터 부족"],
            "negative": ["정확한 실제 후기 확인 필요"],
        }
    if rating_avg is not None and rating_avg >= 4.5:
        return {
            "positive": ["평점이 높은 편", "전반적 만족도가 좋은 편"],
            "negative": ["세부 후기 원문 확인 필요"],
        }
    if rating_avg is not None and rating_avg >= 4.0:
        return {
            "positive": ["전반적으로 무난한 평가", "기본 만족도 양호"],
            "negative": ["세부 후기 원문 확인 필요"],
        }
    return {
        "positive": ["리뷰 수집 완료"],
        "negative": ["평점 및 후기 원문 추가 확인 필요"],
    }


def attach_common_assets(record: Dict[str, Any], assets: Dict[str, Any]) -> Dict[str, Any]:
    rating_avg = assets["rating_avg"]
    review_count = assets["review_count"]

    record["content"]["thumbnail_url"] = assets["thumbnail_url"]
    record["content"]["image_urls"] = assets["image_urls"]
    record["content"]["rating_avg"] = rating_avg
    record["content"]["review_count"] = review_count
    record["content"]["rating_info"] = {
        "rating_avg": rating_avg,
        "rating_scale": 5,
        "review_count": review_count,
        "rating_display": make_rating_display(rating_avg, review_count),
        "rating_source": "kakao_place_page" if assets["asset_source"] == "kakao_place_page" else "unknown",
        "rating_confidence": "high" if rating_avg is not None else "none",
        "rating_reliability": make_rating_reliability(rating_avg, review_count),
    }

    if "review_summary_positive" not in record["content"] or "review_summary_negative" not in record["content"]:
        summary = fallback_review_summary(rating_avg, review_count)
        record["content"]["review_summary_positive"] = summary["positive"]
        record["content"]["review_summary_negative"] = summary["negative"]

    record["quality_control"]["asset_source"] = assets["asset_source"]
    record["quality_control"]["asset_note"] = assets["asset_note"]
    return record


def generate_hall(place: Dict[str, Any]) -> Dict[str, Any]:
    basic = get_base_info(place, "wedding_hall")
    name = basic["name"]

    hall_type = "wedding_hall_general"
    if any(k in name for k in ["호텔", "호텔웨딩", "그랜드", "인터컨티넨탈", "신라", "조선", "롯데"]):
        hall_type = "hotel"
    elif any(k in name for k in ["컨벤션", "컨벤션홀", "웨딩컨벤션"]):
        hall_type = "convention"
    elif any(k in name for k in ["하우스", "가든", "단독홀"]):
        hall_type = "house"
    elif any(k in name for k in ["채플", "성당", "교회"]):
        hall_type = "chapel"

    if hall_type == "hotel":
        styles = ["모던", "클래식", "럭셔리"]
        av_types = ["호텔웨딩", "채플웨딩"]
        cap_min, cap_max, g_min, g_max = 100, 300, 150, 250
    elif hall_type == "convention":
        styles = ["모던", "화려한"]
        av_types = ["컨벤션웨딩", "대형예식"]
        cap_min, cap_max, g_min, g_max = 150, 500, 200, 400
    elif hall_type == "house":
        styles = ["내추럴", "로맨틱", "감성"]
        av_types = ["하우스웨딩", "야외웨딩"]
        cap_min, cap_max, g_min, g_max = 50, 150, 70, 120
    elif hall_type == "chapel":
        styles = ["클래식", "고급스러운", "성스러운"]
        av_types = ["채플웨딩"]
        cap_min, cap_max, g_min, g_max = 80, 250, 100, 200
    else:
        styles = ["모던", "클래식"]
        av_types = ["일반웨딩"]
        cap_min, cap_max, g_min, g_max = 100, 300, 150, 250

    p_level = determine_price_level(basic["district"], basic["neighborhood"], name)

    if p_level == "premium":
        meal = round_price(random.randint(110, 180) * 1000, 10000)
        rental = round_price(random.randint(50, 150) * 100000, 500000)
    elif p_level == "high":
        meal = round_price(random.randint(85, 130) * 1000, 5000)
        rental = round_price(random.randint(30, 80) * 100000, 100000)
    elif p_level == "mid_high":
        meal = round_price(random.randint(70, 95) * 1000, 5000)
        rental = round_price(random.randint(15, 50) * 100000, 100000)
    else:
        meal = round_price(random.randint(50, 80) * 1000, 5000)
        rental = round_price(random.randint(0, 30) * 100000, 100000)

    min_total = (meal * g_min) + rental

    record = {
        "basic_info": basic,
        "search_filters": {
            "hall_type": hall_type,
            "available_wedding_types": av_types,
            "style_concepts": styles,
            "district": basic["district"],
            "guest_capacity_min": cap_min,
            "guest_capacity_max": cap_max,
            "guaranteed_guest_count_min": g_min,
            "guaranteed_guest_count_max": g_max,
            "meal_price_per_person": meal,
            "rental_fee_base": rental,
            "parking_available": True,
            "season_recommended": ["봄", "가을"],
            "meal_type": "뷔페",
            "price_level": p_level,
        },
        "details": {
            "hall_type": {"hotel": "호텔", "convention": "컨벤션", "house": "하우스", "chapel": "채플"}.get(hall_type, "일반웨딩홀"),
            "hall_count": 2 if hall_type in ["hotel", "convention"] else 1,
            "has_ceremony_and_banquet": True,
            "banquet_separated": hall_type in ["hotel", "convention"],
            "ceremony_time_minutes": 60,
            "available_times": ["11:00", "13:00", "15:00", "17:00"],
            "bride_room_available": True,
            "dress_room_available": True,
            "makeup_room_available": True,
            "parking_available": True,
            "parking_capacity": 250 if hall_type in ["hotel", "convention"] else 80,
            "meal_type": "뷔페",
            "meal_note": "한식/양식 혼합 (정확한 확인 필요)",
            "specialties": ["대형 하객 수용", "고급 연출"] if hall_type in ["hotel", "convention"] else ["감성 연출", "프라이빗"],
            "recommended_for": ["호텔 예식을 원하는 커플"] if hall_type == "hotel" else ["프라이빗 예식을 원하는 커플"],
        },
        "pricing": {
            "currency": "KRW",
            "meal_price_per_person": meal,
            "meal_price_weekday": max(meal - 10000, meal),
            "meal_price_weekend": meal,
            "rental_fee_base": rental,
            "rental_fee_weekday": int(rental * 0.8),
            "rental_fee_weekend": rental,
            "minimum_total_estimate": min_total,
            "estimate_basis": f"보증인원 {g_min}명 기준",
            "price_note": "지역/카테고리 기준 더미 추정값 (정확한 확인 필요)",
        },
        "content": {
            "short_description": f"{basic['region']} {basic['district']}에 위치한 예식장",
            "review_summary_positive": ["홀 분위기가 좋음", "식사 만족도가 높음"],
            "review_summary_negative": ["정확한 실제 후기 확인 필요"],
            "tags": [t for t in [basic["neighborhood"], "웨딩홀", av_types[0], styles[0]] if t],
            "thumbnail_url": None,
            "image_urls": [],
            "rating_avg": None,
            "review_count": 0,
            "rating_info": {
                "rating_avg": None,
                "rating_scale": 5,
                "review_count": 0,
                "rating_display": "평점 없음",
                "rating_source": "unknown",
                "rating_confidence": "none",
                "rating_reliability": "none",
            },
            "search_text": f"현재 등록된 데이터 기준 예상 식대는 {meal}원, 기본 대관료는 {rental}원입니다. 정확한 금액과 패키지 구성은 업체 상담 시 확인이 필요합니다.",
        },
        "quality_control": {
            "is_dummy_enriched": True,
            "dummy_fields": ["meal_price_per_person", "rental_fee_base", "minimum_total_estimate"],
            "verification_notes": ["가격은 지역/카테고리 기준 더미 보정", "정확한 견적은 업체 확인 필요"],
            "last_updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }
    return record


def generate_studio(place: Dict[str, Any]) -> Dict[str, Any]:
    basic = get_base_info(place, "studio")
    name = basic["name"]
    is_nature = any(k in name for k in ["가든", "포레스트", "내추럴", "감성"])

    if is_nature:
        styles = ["내추럴", "로맨틱", "감성"]
        tones = ["부드러운톤", "자연광", "따뜻한"]
    else:
        styles = ["모던", "클래식", "럭셔리"]
        tones = ["밝은톤", "화보형", "정적인"]

    p_level = determine_price_level(basic["district"], basic["neighborhood"], name)
    if p_level == "premium":
        p_min, p_max = random.randint(25, 45) * 100000, random.randint(40, 70) * 100000
    elif p_level == "high":
        p_min, p_max = random.randint(18, 30) * 100000, random.randint(30, 50) * 100000
    elif p_level == "mid_high":
        p_min, p_max = random.randint(12, 22) * 100000, random.randint(22, 38) * 100000
    else:
        p_min, p_max = random.randint(8, 15) * 100000, random.randint(15, 25) * 100000

    p_max = max(p_min + 500000, p_max)

    return {
        "basic_info": basic,
        "search_filters": {
            "style_concepts": styles,
            "shoot_tones": tones,
            "preferred_wedding_types": ["호텔웨딩", "하우스웨딩"],
            "specialties": ["인물중심", "배경중심", "야간촬영"],
            "indoor_shoot": True,
            "outdoor_shoot": True if basic["district"] in ["강남구", "서초구"] else False,
            "district": basic["district"],
            "price_min": p_min,
            "price_max": p_max,
            "price_level": p_level,
        },
        "details": {
            "style_concepts": styles,
            "shoot_tones": tones,
            "preferred_wedding_types": ["호텔웨딩", "채플웨딩"],
            "specialties": ["인물중심", "배경중심", "자연광촬영"],
            "indoor_shoot": True,
            "outdoor_shoot": True,
            "retouch_style": ["자연보정", "화사보정"],
            "retouched_photo_count": 20,
            "original_photo_provided": True,
            "shoot_duration_minutes": 240,
            "recommended_for": ["세련된 화보 스타일을 원하는 커플"],
        },
        "pricing": {
            "currency": "KRW",
            "price_min": p_min,
            "price_max": p_max,
            "pricing_type": "package",
            "package_note": "촬영 패키지 기준 더미값 (정확한 확인 필요)",
            "includes": ["촬영", "기본 보정", "원본 일부 제공"],
            "excludes": ["드레스", "메이크업"],
            "price_note": "지역/카테고리 기준 더미 추정값 (정확한 확인 필요)",
        },
        "content": {
            "short_description": "세련된 웨딩 촬영을 제공하는 스튜디오",
            "review_summary_positive": ["사진 톤이 세련됨", "인물 보정 만족도 높음"],
            "review_summary_negative": ["정확한 실제 후기 확인 필요"],
            "tags": [t for t in [basic["neighborhood"], "스튜디오", styles[0], tones[0]] if t],
            "thumbnail_url": None,
            "image_urls": [],
            "rating_avg": None,
            "review_count": 0,
            "rating_info": {
                "rating_avg": None,
                "rating_scale": 5,
                "review_count": 0,
                "rating_display": "평점 없음",
                "rating_source": "unknown",
                "rating_confidence": "none",
                "rating_reliability": "none",
            },
            "search_text": f"예상 가격대는 {p_min}원에서 {p_max}원 수준입니다. 정확한 금액과 패키지 구성은 업체 상담 시 확인이 필요합니다.",
        },
        "quality_control": {
            "is_dummy_enriched": True,
            "dummy_fields": ["price_min", "price_max", "retouched_photo_count", "shoot_duration_minutes"],
            "verification_notes": ["패키지 구성은 실제 업체 정책 확인 필요", "가격은 지역 기준 더미 보정"],
            "last_updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }


def generate_dress(place: Dict[str, Any]) -> Dict[str, Any]:
    basic = get_base_info(place, "dress")
    name = basic["name"]
    p_level = determine_price_level(basic["district"], basic["neighborhood"], name)
    is_imported = p_level in ["premium", "high"] or any(k in name for k in ["수입", "럭셔리", "브랜드"])

    if p_level == "premium":
        r_min, r_max = random.randint(25, 45) * 100000, random.randint(40, 70) * 100000
    elif p_level == "high":
        r_min, r_max = random.randint(15, 30) * 100000, random.randint(30, 50) * 100000
    elif p_level == "mid_high":
        r_min, r_max = random.randint(10, 20) * 100000, random.randint(20, 35) * 100000
    else:
        r_min, r_max = random.randint(7, 15) * 100000, random.randint(15, 25) * 100000

    r_max = max(r_min + 500000, r_max)
    fit_fee = random.randint(3, 10) * 10000 if p_level in ["premium", "high"] else 50000

    return {
        "basic_info": basic,
        "search_filters": {
            "dress_styles": ["머메이드", "A라인", "벨라인"],
            "dress_moods": ["우아한", "로맨틱", "럭셔리"],
            "imported_brands_available": is_imported,
            "custom_made_available": False,
            "fitting_available": True,
            "district": basic["district"],
            "rental_price_min": r_min,
            "rental_price_max": r_max,
            "price_level": p_level,
        },
        "details": {
            "dress_styles": ["머메이드", "A라인", "벨라인"],
            "dress_moods": ["우아한", "로맨틱", "럭셔리"],
            "fabric_keywords": ["실크", "비즈", "레이스"],
            "imported_brands_available": is_imported,
            "custom_made_available": False,
            "fitting_available": True,
            "fitting_fee": fit_fee,
            "specialties": ["체형 보완 추천", "고급 수입 드레스" if is_imported else "우아한 분위기"],
            "recommended_for": ["럭셔리 스타일 선호 신부" if is_imported else "다양한 디자인을 입어보고 싶은 신부"],
        },
        "pricing": {
            "currency": "KRW",
            "rental_price_min": r_min,
            "rental_price_max": r_max,
            "purchase_price_min": r_min * 2,
            "purchase_price_max": r_max * 2,
            "pricing_type": "rental_or_purchase",
            "price_note": "수입/지역 기준 더미 추정값 (정확한 확인 필요)",
        },
        "content": {
            "short_description": f"{basic['region']} {basic['district']}의 고급 웨딩드레스 셀렉샵",
            "review_summary_positive": ["드레스 라인업이 다양함"],
            "review_summary_negative": ["정확한 실제 후기 확인 필요"],
            "tags": [t for t in [basic["neighborhood"], "드레스", "수입드레스" if is_imported else "드레스샵"] if t],
            "thumbnail_url": None,
            "image_urls": [],
            "rating_avg": None,
            "review_count": 0,
            "rating_info": {
                "rating_avg": None,
                "rating_scale": 5,
                "review_count": 0,
                "rating_display": "평점 없음",
                "rating_source": "unknown",
                "rating_confidence": "none",
                "rating_reliability": "none",
            },
            "search_text": f"예상 대여 가격은 {r_min}원에서 {r_max}원 수준입니다. 정확한 피팅비 및 정책은 업체 상담이 필요합니다.",
        },
        "quality_control": {
            "is_dummy_enriched": True,
            "dummy_fields": ["rental_price_min", "rental_price_max", "purchase_price_min", "purchase_price_max", "fitting_fee"],
            "verification_notes": ["실제 드레스 라인업 확인 필요", "가격은 지역 기준 더미 보정"],
            "last_updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }


def generate_makeup(place: Dict[str, Any]) -> Dict[str, Any]:
    basic = get_base_info(place, "makeup")
    name = basic["name"]
    p_level = determine_price_level(basic["district"], basic["neighborhood"], name)
    is_chungdam = basic["neighborhood"] in ["청담동", "압구정동"] or basic["district"] == "강남구"

    if p_level == "premium":
        b_makeup, b_hair = random.randint(30, 50) * 10000, random.randint(18, 30) * 10000
    elif p_level == "high":
        b_makeup, b_hair = random.randint(22, 40) * 10000, random.randint(12, 25) * 10000
    elif p_level == "mid_high":
        b_makeup, b_hair = random.randint(15, 28) * 10000, random.randint(8, 18) * 10000
    else:
        b_makeup, b_hair = random.randint(10, 22) * 10000, random.randint(5, 12) * 10000

    b_hm_price = b_makeup + b_hair

    return {
        "basic_info": basic,
        "search_filters": {
            "makeup_styles": ["내추럴", "화사한", "고급스러운"],
            "hair_styles_supported": ["업스타일", "웨이브", "로우번"],
            "shop_type": "청담샵" if is_chungdam else "웨딩전문샵",
            "district": basic["district"],
            "bride_makeup_price": b_makeup,
            "bride_hair_makeup_price": b_hm_price,
            "family_makeup_available": True,
            "trial_makeup_available": True,
            "price_level": p_level,
        },
        "details": {
            "makeup_styles": ["내추럴", "화사한", "고급스러운"],
            "hair_styles_supported": ["업스타일", "웨이브", "로우번"],
            "shop_type": "청담샵" if is_chungdam else "웨딩전문샵",
            "family_makeup_available": True,
            "trial_makeup_available": True,
            "trial_makeup_price": max(b_makeup - 50000, 50000),
            "artist_designation_available": True,
            "specialties": ["피부 표현", "청순 메이크업", "호텔 예식 메이크업" if p_level in ["premium", "high"] else "맞춤 메이크업"],
            "recommended_for": ["자연스럽고 고급스러운 메이크업을 원하는 신부"],
        },
        "pricing": {
            "currency": "KRW",
            "bride_makeup_price": b_makeup,
            "bride_hair_price": b_hair,
            "bride_hair_makeup_price": b_hm_price,
            "family_makeup_price": round_price(int(b_makeup * 0.4), 10000),
            "trial_makeup_price": max(b_makeup - 50000, 50000),
            "price_note": "지역 기준 더미 추정값 (정확한 확인 필요)",
        },
        "content": {
            "short_description": "웨딩 전문 메이크업샵",
            "review_summary_positive": ["피부 표현이 자연스러움", "헤어 완성도가 높음"],
            "review_summary_negative": ["아티스트 지정 시 추가 비용 발생 가능"],
            "tags": [t for t in [basic["neighborhood"], "메이크업", "헤어메이크업"] if t],
            "thumbnail_url": None,
            "image_urls": [],
            "rating_avg": None,
            "review_count": 0,
            "rating_info": {
                "rating_avg": None,
                "rating_scale": 5,
                "review_count": 0,
                "rating_display": "평점 없음",
                "rating_source": "unknown",
                "rating_confidence": "none",
                "rating_reliability": "none",
            },
            "search_text": f"신부 헤어+메이크업 예상 가격은 {b_hm_price}원 수준입니다. 지정 비용 여부 등 정확한 확인이 필요합니다.",
        },
        "quality_control": {
            "is_dummy_enriched": True,
            "dummy_fields": ["bride_makeup_price", "bride_hair_price", "bride_hair_makeup_price", "family_makeup_price", "trial_makeup_price"],
            "verification_notes": ["아티스트 지정 비용 여부는 업체 확인 필요", "가격은 지역 메이크업샵 기준 보정"],
            "last_updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }


def generate_package(place: Dict[str, Any]) -> Dict[str, Any]:
    basic = get_base_info(place, "package")
    name = basic["name"]
    p_level = determine_price_level(basic["district"], basic["neighborhood"], name)

    if p_level == "premium":
        p_min, p_max = 4000000, 7000000
    elif p_level == "high":
        p_min, p_max = 2500000, 4500000
    else:
        p_min, p_max = 1500000, 3000000

    if basic["district"] == "강남구":
        p_min += 500000
        p_max += 500000
    if basic["neighborhood"] == "청담동":
        p_min += 500000
        p_max += 1000000

    return {
        "basic_info": basic,
        "search_filters": {
            "package_type": "스드메",
            "region": basic["region"],
            "district": basic["district"],
            "price_min": p_min,
            "price_max": p_max,
            "price_level": p_level,
            "includes_studio": True,
            "includes_dress": True,
            "includes_makeup": True,
            "style_concepts": ["럭셔리", "모던"] if p_level in ["high", "premium"] else ["내추럴", "모던"],
            "recommended_for": ["호텔웨딩", "강남 예식"] if p_level in ["high", "premium"] else ["일반웨딩"],
        },
        "details": {
            "package_type": "스드메",
            "includes": {"studio": True, "dress": True, "makeup": True},
            "studio_details": {"shoot_type": ["실내", "야외"], "retouched_photos": 20 if p_level in ["premium", "high"] else 10},
            "dress_details": {"dress_count": 2, "tuxedo_included": True},
            "makeup_details": {"bride_hair_makeup": True, "trial_makeup": True},
            "specialties": ["고급 패키지", "청담 라인업"] if p_level in ["premium", "high"] else ["가성비 패키지", "실속구성"],
            "recommended_for": ["럭셔리 웨딩 준비 커플"] if p_level in ["premium", "high"] else ["합리적인 가격을 원하는 커플"],
        },
        "pricing": {
            "currency": "KRW",
            "price_min": p_min,
            "price_max": p_max,
            "price_type": "package",
            "additional_costs": ["드레스 업그레이드 비용 발생 가능", "촬영 추가 컷 비용 발생 가능"],
            "price_note": "지역 기준 스드메 더미 추정값 (정확한 확인 필요)",
        },
        "content": {
            "short_description": "스튜디오, 드레스, 메이크업이 포함된 통합 웨딩 패키지",
            "review_summary_positive": ["구성 비교가 쉬운 편"],
            "review_summary_negative": ["실제 제휴 구성 확인 필요"],
            "tags": ["스드메", "패키지", "웨딩패키지", basic["district"]],
            "thumbnail_url": None,
            "image_urls": [],
            "rating_avg": None,
            "review_count": 0,
            "rating_info": {
                "rating_avg": None,
                "rating_scale": 5,
                "review_count": 0,
                "rating_display": "평점 없음",
                "rating_source": "unknown",
                "rating_confidence": "none",
                "rating_reliability": "none",
            },
            "search_text": f"가격대는 {p_min}원에서 {p_max}원 수준입니다. 정확한 패키지 구성은 업체에 문의 바랍니다.",
        },
        "quality_control": {
            "is_dummy_enriched": True,
            "dummy_fields": ["price_min", "price_max", "retouched_photos", "dress_count"],
            "verification_notes": ["패키지 구성은 업체별 상이함", "가격은 지역 기준 더미 보정"],
            "last_updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }


def generate_video_snap(place: Dict[str, Any]) -> Dict[str, Any]:
    basic = get_base_info(place, "video_snap")
    name = basic["name"]
    p_level = determine_price_level(basic["district"], basic["neighborhood"], name)

    if p_level in ["premium", "high"]:
        p_min, p_max = random.randint(20, 25) * 100000, random.randint(30, 40) * 100000
    else:
        p_min, p_max = random.randint(8, 12) * 100000, random.randint(15, 25) * 100000

    service_types = ["본식스냅", "웨딩영상"] if ("영상" in name or "dvd" in name.lower()) else ["본식스냅"]

    return {
        "basic_info": basic,
        "search_filters": {
            "service_types": service_types,
            "video_style": ["감성", "시네마틱"],
            "photo_style": ["자연스러운", "다큐형"],
            "district": basic["district"],
            "price_min": p_min,
            "price_max": p_max,
            "price_level": p_level,
            "highlight_video_included": True,
            "full_video_included": True,
        },
        "details": {
            "service_types": service_types,
            "photo_details": {"photographer_count": 1, "delivered_photos": 500, "retouched_photos": 20},
            "video_details": {"videographer_count": 1, "highlight_video_duration_minutes": 3, "full_video_included": True},
            "equipment_level": "전문 장비",
            "specialties": ["감성 영상", "자연스러운 스냅"],
            "recommended_for": ["감성적인 웨딩 기록을 원하는 커플"],
        },
        "pricing": {
            "currency": "KRW",
            "price_min": p_min,
            "price_max": p_max,
            "pricing_type": "package",
            "includes": ["본식 촬영", "보정 사진", "하이라이트 영상"],
            "additional_costs": ["촬영 인원 추가 비용", "원본 전체 제공 비용"],
            "price_note": "지역 기준 더미 추정값 (정확한 확인 필요)",
        },
        "content": {
            "short_description": "본식 스냅 및 웨딩 촬영 전문 업체",
            "review_summary_positive": ["감성 연출에 적합", "기록용 서비스 비교 가능"],
            "review_summary_negative": ["정확한 실제 후기 확인 필요"],
            "tags": ["웨딩영상", "본식스냅", "감성", basic["district"]],
            "thumbnail_url": None,
            "image_urls": [],
            "rating_avg": None,
            "review_count": 0,
            "rating_info": {
                "rating_avg": None,
                "rating_scale": 5,
                "review_count": 0,
                "rating_display": "평점 없음",
                "rating_source": "unknown",
                "rating_confidence": "none",
                "rating_reliability": "none",
            },
            "search_text": f"가격대는 약 {p_min}원에서 {p_max}원 수준입니다. 정확한 구성은 업체에 문의가 필요합니다.",
        },
        "quality_control": {
            "is_dummy_enriched": True,
            "dummy_fields": ["price_min", "price_max", "delivered_photos", "highlight_video_duration_minutes"],
            "verification_notes": ["촬영 구성은 업체별 상이", "가격은 지역 및 스타일 기준 더미 보정"],
            "last_updated_at": datetime.utcnow().isoformat() + "Z",
        },
    }


CATEGORY_MAP = {
    "hall": generate_hall,
    "studio": generate_studio,
    "dress": generate_dress,
    "makeup": generate_makeup,
    "package": generate_package,
    "video_snap": generate_video_snap,
}


def enrich_assets(record: Dict[str, Any]) -> Dict[str, Any]:
    place_id = record["basic_info"]["source_id"]
    assets = scrape_kakao_place_assets(place_id)
    return attach_common_assets(record, assets)


def process_category(category: str, keywords: List[str]) -> None:
    seen_ids = set()
    category_vendors = []

    print(f"===== {category} 수집 시작 =====")
    for keyword in keywords:
        for district_name, lat, lng in SEOUL_DISTRICTS:
            print(f"  검색 중: {keyword} / {district_name}")
            for page in range(1, 4):
                result = search_places(keyword, lng, lat, page=page)
                documents = result.get("documents", [])
                if not documents:
                    break

                for place in documents:
                    place_id = place["id"]
                    if place_id in seen_ids:
                        continue
                    if not should_keep_place(category, place):
                        continue

                    seen_ids.add(place_id)
                    try:
                        enriched_vendor = CATEGORY_MAP[category](place)
                        enriched_vendor = enrich_assets(enriched_vendor)
                        category_vendors.append(enriched_vendor)
                        print(f"    + 수집 완료: {place.get('place_name')}")
                    except Exception as e:
                        print(f"    ! 오류: {place.get('place_name')} / {e}")

                    time.sleep(0.2)

                time.sleep(0.3)
                if result.get("meta", {}).get("is_end"):
                    break

    out_name = OUTPUT_FILES.get(category, f"{category}_vendors.json")
    with open(out_name, "w", encoding="utf-8") as f:
        json.dump(category_vendors, f, ensure_ascii=False, indent=2)

    print(f"[{category}] 총 {len(category_vendors)}개 저장 완료 -> {out_name}")


def validate_env() -> None:
    if not KAKAO_API_KEY:
        raise RuntimeError("KAKAO_API_KEY가 .env에 없습니다.")


if __name__ == "__main__":
    validate_env()
    for cat, kws in KEYWORDS.items():
        process_category(cat, kws)
    print("모든 카테고리 크롤링 + 필터링 + 이미지/리뷰/평점 보강 + 더미 데이터 주입 완료!")
