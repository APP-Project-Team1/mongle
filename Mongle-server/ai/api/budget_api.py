from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ai.budget_analyzer import BudgetAnalyzer, load_sample_data
import os
import json

router = APIRouter()

# Schema for the request
class BudgetOptimizeRequest(BaseModel):
    totalBudget: float # unit: 10k KRW (만원)
    selectedVendors: Dict[str, Any] # category: vendor_id (str) or {id, price} (dict)
    categoryPriorities: Dict[str, str] # category: high/mid/low
    lockedCategories: List[str]
    contractedVendorIds: List[str]

# Global cache for data (for demo purposes)
VENDORS_CACHE = load_sample_data()

@router.post("/budget/optimize")
async def optimize_budget(req: BudgetOptimizeRequest):
    try:
        analyzer = BudgetAnalyzer(VENDORS_CACHE, [])
        result = await analyzer.analyze(req.dict())
        return result
    except Exception as e:
        print(f"Error optimizing budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/budget/vendors")
async def get_budget_vendors():
    # Helper to get available vendors for the optimization UI selection
    return VENDORS_CACHE
