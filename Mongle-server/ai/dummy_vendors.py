import json
import os

BASE = os.path.dirname(__file__)

with open(os.path.join(BASE, 'labeled_vendors.json'), encoding='utf-8') as f:
    VENDORS = json.load(f)

with open(os.path.join(BASE, 'planner', 'wedding_planners.json'), encoding='utf-8') as f:
    PLANNERS = json.load(f)


def get_vendors_by_filter(categories=None, style=None, region=None, budget_max=None):
    """
    나중에 Supabase 연동 시 이 함수 내부만 교체하면 됨.
    함수 시그니처(입력/출력 형태)는 절대 바꾸지 말 것.
    """
    # 플래너 쿼리 처리
    if categories and 'planner' in categories:
        results = PLANNERS
        if style:
            results = [p for p in results if any(s in p.get('style_keywords', []) for s in style)]
        if region:
            results = [p for p in results if any(region in r for r in p.get('activity_regions', []))]
        if budget_max:
            results = [p for p in results if p.get('base_price_krw', 0) <= budget_max * 10000]
        return sorted(results, key=lambda x: x.get('rating', 0), reverse=True)[:10]

    # 일반 업체 쿼리 처리
    results = VENDORS
    if categories:
        results = [v for v in results if v.get('category') in categories]
    if style:
        results = [v for v in results if any(s in v.get('style', []) for s in style)]
    if region:
        results = [v for v in results if region in v.get('region', '')]
    if budget_max:
        results = [v for v in results if v.get('price_min', 0) <= budget_max]

    return sorted(results, key=lambda x: x.get('rating') or 0, reverse=True)[:10]
