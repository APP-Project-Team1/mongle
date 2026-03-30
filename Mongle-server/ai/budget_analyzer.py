import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# CATEGORIES: wedding_hall, studio, dress, makeup, snapshot, package

class BudgetAnalyzer:
    def __init__(self, all_vendors: List[Dict[str, Any]], all_packages: List[Dict[str, Any]]):
        self.all_vendors = all_vendors
        self.all_packages = all_packages

    def calculate_style_similarity(self, tags_a: List[str], tags_b: List[str]) -> float:
        if not tags_a or not tags_b:
            return 0.5
        set_a = set(tags_a)
        set_b = set(tags_b)
        intersection = set_a.intersection(set_b)
        union = set_a.union(set_b)
        if not union:
            return 0.5
        return len(intersection) / len(union)

    def find_best_replacement(self, category: str, current_price: float, style_tags: List[str], target_price: float, locked_ids: List[str]) -> Optional[Dict[str, Any]]:
        candidates = [v for v in self.all_vendors if v["category"] == category and v["vendor_id"] not in locked_ids]
        if not candidates:
            return None
        
        # Sort by: 1. Price within target, 2. Style similarity
        suitable = [v for v in candidates if v["price_min"] <= target_price]
        if not suitable:
            # If no one is under target, just pick the cheapest available among those cheaper than current
            suitable = [v for v in candidates if v["price_min"] < current_price]
            if not suitable:
                suitable = sorted(candidates, key=lambda x: x["price_min"])[:3]
        
        ranked = []
        for v in suitable:
            sim = self.calculate_style_similarity(style_tags, v.get("style_tags", []))
            # Score: High is better.
            price_score = 1.0 - (v["price_min"] / current_price) if current_price > 0 else 0
            # Higher weight on price_score (0.7) for better budget optimization
            score = (sim * 0.3) + (price_score * 0.7)
            ranked.append((score, v))
        
        ranked.sort(key=lambda x: x[0], reverse=True)
        return ranked[0][1] if ranked else None

    async def analyze(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        total_budget = input_data["totalBudget"]
        current_selection = input_data["selectedVendors"] # {category: vendor_id} or {category: {id, price}}
        priorities = input_data.get("categoryPriorities", {}) # {category: 'high'|'mid'|'low'}
        locked_categories = input_data.get("lockedCategories", [])
        contracted_ids = input_data.get("contractedVendorIds", [])
        
        current_vendors = []
        current_total = 0
        
        for cat, val in current_selection.items():
            vid = val if isinstance(val, str) else val.get("id")
            # If the value is a string, we don't have the price, so we rely on DB price.
            # If it's an object, we use the provided price as fallback if DB search fails.
            vprice_fallback = 0 if isinstance(val, str) else val.get("price", 0)
            
            vendor = next((v for v in self.all_vendors if v["vendor_id"] == vid), None)
            if vendor:
                current_vendors.append(vendor)
                current_total += vendor["price_min"]
            else:
                # Fallback for dummy vendors or missing IDs
                fallback = {
                    "vendor_id": vid or f"dummy_{cat}",
                    "name": f"현재 {cat}",
                    "category": cat,
                    "price_min": vprice_fallback,
                    "style_tags": []
                }
                current_vendors.append(fallback)
                current_total += vprice_fallback
        
        overflow = current_total - total_budget
        
        # Even if not overflow, user requested optimization
        # But we primarily focus on cases where budget is exceeded

        # Generate 3 Plans
        minimal_plan = self.build_minimal_change_plan(current_vendors, overflow, locked_categories, contracted_ids)
        balanced_plan = self.build_balanced_plan(current_vendors, overflow, priorities, locked_categories, contracted_ids)
        aggressive_plan = self.build_aggressive_plan(current_vendors, overflow, locked_categories, contracted_ids)

        # Generate Explanations via LLM
        plans = [minimal_plan, balanced_plan, aggressive_plan]
        # Filter out plans with no changes if any
        active_plans = [p for p in plans if p and p.get("changes")]
        
        if not active_plans:
             return {
                "status": "success",
                "overflow": overflow,
                "current_total": current_total,
                "plans": [],
                "message": "현재 조건에서 더 이상 추천할 대안이 없습니다. 예산이 넉넉하거나 모든 항목이 잠겨있을 수 있습니다."
            }

        tasks = [self.generate_explanation(p, input_data) for p in active_plans]
        explanations = await asyncio.gather(*tasks)

        for i, p in enumerate(active_plans):
            p["explanation"] = explanations[i]

        return {
            "status": "success",
            "overflow": overflow,
            "current_total": current_total,
            "plans": active_plans
        }

    def build_minimal_change_plan(self, current_vendors, overflow, locked_cats, contracted_ids):
        changeable = [v for v in current_vendors if v["category"] not in locked_cats and v["vendor_id"] not in contracted_ids]
        changeable.sort(key=lambda x: x["price_min"], reverse=True)
        
        changes = []
        saved = 0
        target_to_save = max(overflow, 0)
        
        for v in changeable:
            if saved >= target_to_save and saved > 0: break
            target = v["price_min"] * 0.75
            best = self.find_best_replacement(v["category"], v["price_min"], v.get("style_tags", []), target, [])
            if best and best["vendor_id"] != v["vendor_id"]:
                changes.append({"category": v["category"], "from": v, "to": best})
                saved += (v["price_min"] - best["price_min"])
        
        return {
            "type": "minimal",
            "title": "최소 변경안",
            "changes": changes,
            "totalSaved": saved,
            "finalTotal": sum(v["price_min"] for v in current_vendors) - saved
        }

    def build_balanced_plan(self, current_vendors, overflow, priorities, locked_cats, contracted_ids):
        changeable = [v for v in current_vendors if v["category"] not in locked_cats and v["vendor_id"] not in contracted_ids]
        priority_map = {"low": 0, "mid": 1, "high": 2}
        changeable.sort(key=lambda x: (priority_map.get(priorities.get(x["category"], "mid"), 1), x["price_min"]), reverse=False)

        changes = []
        saved = 0
        target_to_save = max(overflow, 0)

        for v in changeable:
            if saved >= target_to_save and saved > 0: break
            prio = priorities.get(v["category"], "mid")
            target_factor = 0.6 if prio == "low" else 0.85
            target = v["price_min"] * target_factor
            best = self.find_best_replacement(v["category"], v["price_min"], v.get("style_tags", []), target, [])
            if best and best["vendor_id"] != v["vendor_id"]:
                changes.append({"category": v["category"], "from": v, "to": best})
                saved += (v["price_min"] - best["price_min"])

        return {
            "type": "balanced",
            "title": "균형 절감안",
            "changes": changes,
            "totalSaved": saved,
            "finalTotal": sum(v["price_min"] for v in current_vendors) - saved
        }

    def build_aggressive_plan(self, current_vendors, overflow, locked_cats, contracted_ids):
        changeable = [v for v in current_vendors if v["category"] not in locked_cats and v["vendor_id"] not in contracted_ids]
        
        changes = []
        saved = 0
        for v in changeable:
            target = v["price_min"] * 0.5
            best = self.find_best_replacement(v["category"], v["price_min"], v.get("style_tags", []), target, [])
            if best and best["vendor_id"] != v["vendor_id"]:
                changes.append({"category": v["category"], "from": v, "to": best})
                saved += (v["price_min"] - best["price_min"])

        return {
            "type": "aggressive",
            "title": "최대 절감안",
            "changes": changes,
            "totalSaved": saved,
            "finalTotal": sum(v["price_min"] for v in current_vendors) - saved
        }

    async def generate_explanation(self, plan: Dict[str, Any], context: Dict[str, Any]) -> str:
        if not plan["changes"]:
            return "현재 조건에서 더 이상 조정 가능한 항목이 없습니다."
        
        change_summary = ", ".join([f"{c['category']}({c['from']['name']} -> {c['to']['name']})" for c in plan["changes"]])
        
        prompt = f"""
웨딩 예산 최적화 추천안에 대한 친절한 설명을 작성해줘.
추천안 타입: {plan['title']}
주요 변경 사항: {change_summary}
총 절감액: {plan['totalSaved']}만원
최종 예산 합계: {plan['finalTotal']}만원 (사용자 목표: {context['totalBudget']}만원)

규칙:
- 2~3문장으로 짧고 친절하게 작성.
- 왜 이 항목들을 선택했는지 (변경 수 최소화, 중요도 고려 등)를 포함.
- 한국어로 작성.
"""
        try:
            res = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}]
            )
            return res.choices[0].message.content.strip()
        except:
            return f"{plan['title']}입니다. {len(plan['changes'])}개 항목을 조정하여 예산 목표에 맞췄습니다."

# Helper to load data from JSON strings/files
def load_sample_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.join(current_dir, "script", "vendors")
    vendors = []
    
    # Debug print to verify path
    if not os.path.exists(base_path):
        print(f"Warning: Vendor data path does not exist: {base_path}")
    else:
        print(f"Loading vendor data from: {base_path}")
    
    files = {
        "wedding_hall": "hall_vendors.json",
        "studio": "studio_vendors.json",
        "dress": "dress_vendors.json",
        "makeup": "makeup_vendors.json",
        "snapshot": "video_snap_vendors.json",
        "package": "package_vendors.json"
    }
    
    for cat, filename in files.items():
        path = os.path.join(base_path, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    for item in data:
                        basic = item.get("basic_info", {})
                        pricing = item.get("pricing", {})
                        
                        price = 0
                        if cat == "wedding_hall":
                            price = pricing.get("rental_fee_base", 0)
                        elif cat == "studio":
                            price = pricing.get("price_min", 0)
                        elif cat == "dress":
                            price = pricing.get("rental_price_min", 0)
                        elif cat == "makeup":
                            price = pricing.get("bride_hair_makeup_price", 0)
                        elif cat == "snapshot":
                            price = pricing.get("price_min", 0)
                        elif cat == "package":
                            price = pricing.get("price_min", 0)
                            
                        if not price:
                            price = pricing.get("base_price") or pricing.get("price_min") or 0
                            
                        # Extract style tags
                        tags = item.get("content", {}).get("tags", [])
                        filters = item.get("search_filters", {})
                        details = item.get("details", {})
                        for field in ["wedding_styles", "studio_styles", "dress_styles", "makeup_styles", "video_style", "photo_style", "style_concepts"]:
                            tags.extend(filters.get(field, []))
                            tags.extend(details.get(field, []))
                        
                        vendors.append({
                            "vendor_id": basic.get("vendor_id") or basic.get("source_id"),
                            "name": basic.get("name"),
                            "category": cat,
                            "price_min": price // 10000 if price else 0,
                            "style_tags": list(set(tags)),
                            "district": basic.get("district")
                        })
                except Exception as e:
                    print(f"Error parsing {filename}: {e}")
                    
    return vendors
