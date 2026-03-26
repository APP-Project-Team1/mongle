import json
import os

BASE = os.path.dirname(__file__)
VENDORS_DIR = os.path.join(BASE, 'script', 'vendors')
PLANNER_FILE = os.path.join(BASE, 'planner', 'wedding_planners.json')

# JSON 파일명과 필터용 카테고리 이름 매핑
VENDOR_FILES = [
    ('hall',       'hall_vendors.json'),
    ('dress',      'dress_vendors.json'),
    ('studio',     'studio_vendors.json'),
    ('makeup',     'makeup_vendors.json'),
    ('package',    'package_vendors.json'),
    ('video_snap', 'video_snap_vendors.json'),
]

# basic_info.category → 필터 카테고리 정규화
RAW_CATEGORY_MAP = {
    'wedding_hall': 'hall',
    'dress':        'dress',
    'studio':       'studio',
    'makeup':       'makeup',
    'package':      'package',
    'video_snap':   'video_snap',
}


def _get_style(raw_cat, sf):
    """카테고리별 스타일 키워드 목록 반환"""
    if raw_cat in ('studio', 'hall', 'package'):
        return sf.get('style_concepts', [])
    if raw_cat == 'dress':
        return sf.get('dress_styles', []) + sf.get('dress_moods', [])
    if raw_cat == 'makeup':
        return sf.get('makeup_styles', [])
    if raw_cat == 'video_snap':
        return sf.get('video_style', []) + sf.get('photo_style', [])
    return []


def _price_wan(won):
    """원 → 만원 변환 (int)"""
    if not won:
        return 0
    return int(won) // 10000


def _get_prices(raw_cat, sf):
    """카테고리별 가격(만원 단위) 반환 → (price_min, price_max)"""
    if raw_cat == 'wedding_hall':
        return (
            _price_wan(sf.get('rental_fee_base')),
            _price_wan(sf.get('rental_fee_base')),
        )
    if raw_cat == 'dress':
        return (
            _price_wan(sf.get('rental_price_min')),
            _price_wan(sf.get('rental_price_max')),
        )
    if raw_cat == 'studio':
        return (
            _price_wan(sf.get('price_min')),
            _price_wan(sf.get('price_max')),
        )
    if raw_cat == 'makeup':
        p = _price_wan(sf.get('bride_makeup_price') or sf.get('bride_hair_makeup_price'))
        return (p, p)
    if raw_cat in ('package', 'video_snap'):
        return (
            _price_wan(sf.get('price_min')),
            _price_wan(sf.get('price_max')),
        )
    return (0, 0)


def _normalize(raw_cat, item):
    """중첩 구조 → 필터링/LLM 전달용 평탄화 dict"""
    bi = item.get('basic_info', {})
    sf = item.get('search_filters', {})
    dt = item.get('details', {})

    cat = RAW_CATEGORY_MAP.get(raw_cat, raw_cat)
    price_min, price_max = _get_prices(raw_cat, sf)

    result = {
        'vendor_id':   bi.get('vendor_id', ''),
        'name':        bi.get('name', ''),
        'category':    cat,
        'region':      bi.get('region', ''),
        'district':    bi.get('district', ''),
        'address':     bi.get('road_address') or bi.get('address', ''),
        'phone':       bi.get('phone', ''),
        'url':         bi.get('source_url', ''),
        'style':       _get_style(raw_cat, sf),
        'price_min':   price_min,
        'price_max':   price_max,
        'price_level': sf.get('price_level', ''),
    }

    # 카테고리별 LLM 컨텍스트용 추가 필드
    if raw_cat == 'wedding_hall':
        result.update({
            'hall_type':    sf.get('hall_type', ''),
            'capacity_min': sf.get('guest_capacity_min'),
            'capacity_max': sf.get('guest_capacity_max'),
            'meal_type':    sf.get('meal_type', ''),
            'meal_price_per_person_만원': _price_wan(sf.get('meal_price_per_person')),
            'available_times': dt.get('available_times', []),
        })
    elif raw_cat == 'dress':
        result.update({
            'dress_styles':  sf.get('dress_styles', []),
            'dress_moods':   sf.get('dress_moods', []),
            'custom_made':   sf.get('custom_made_available', False),
            'imported_brands': sf.get('imported_brands_available', False),
        })
    elif raw_cat == 'studio':
        result.update({
            'style_concepts': sf.get('style_concepts', []),
            'shoot_tones':    sf.get('shoot_tones', []),
        })
    elif raw_cat == 'makeup':
        result.update({
            'makeup_styles': sf.get('makeup_styles', []),
            'shop_type':     sf.get('shop_type', ''),
            'trial_available': sf.get('trial_makeup_available', False),
        })
    elif raw_cat == 'package':
        result.update({
            'package_type':    sf.get('package_type', ''),
            'includes_studio': sf.get('includes_studio', False),
            'includes_dress':  sf.get('includes_dress', False),
            'includes_makeup': sf.get('includes_makeup', False),
            'style_concepts':  sf.get('style_concepts', []),
        })
    elif raw_cat == 'video_snap':
        result.update({
            'service_types': sf.get('service_types', []),
            'video_style':   sf.get('video_style', []),
            'photo_style':   sf.get('photo_style', []),
        })

    return result


def _load_all_vendors():
    """모든 업체 JSON 파일을 읽어 정규화된 목록으로 반환"""
    all_vendors = []
    for cat_key, filename in VENDOR_FILES:
        filepath = os.path.join(VENDORS_DIR, filename)
        if not os.path.exists(filepath):
            continue
        with open(filepath, encoding='utf-8') as f:
            items = json.load(f)
        for item in items:
            raw_cat = item.get('basic_info', {}).get('category', cat_key)
            all_vendors.append(_normalize(raw_cat, item))
    return all_vendors


# 서버 시작 시 1회 로드
VENDORS = _load_all_vendors()

with open(PLANNER_FILE, encoding='utf-8') as f:
    PLANNERS = json.load(f)


def get_vendors_by_filter(categories=None, style=None, region=None, budget_max=None):
    """
    나중에 Supabase 연동 시 이 함수 내부만 교체하면 됨.
    함수 시그니처(입력/출력 형태)는 절대 바꾸지 말 것.
    """
    # 플래너 쿼리 처리
    if categories and 'planner' in categories:
        results = list(PLANNERS)
        if style:
            results = [p for p in results if any(s in p.get('style_keywords', []) for s in style)]
        if region:
            results = [p for p in results if any(region in r for r in p.get('activity_regions', []))]
        if budget_max:
            results = [p for p in results if p.get('base_price_krw', 0) <= budget_max * 10000]
        return sorted(results, key=lambda x: x.get('rating', 0), reverse=True)[:10]

    # 일반 업체 쿼리 처리
    results = list(VENDORS)
    if categories:
        results = [v for v in results if v.get('category') in categories]
    if style:
        results = [v for v in results if any(s in v.get('style', []) for s in style)]
    if region:
        results = [v for v in results if region in v.get('region', '')]
    if budget_max:
        results = [v for v in results if v.get('price_min', 0) <= budget_max]

    return sorted(results, key=lambda x: x.get('price_min') or 0)[:10]
