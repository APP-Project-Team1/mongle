from typing import Any, List, Optional
from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool = True
    message: str
    data: Any


class DashboardSummary(BaseModel):
    total_budget: float = 0
    timeline_count: int = 0
    vendor_count: int = 0
    chat_count: int = 0


class DashboardBundle(BaseModel):
    projects: List[dict]
    timelines: List[dict]
    budgets: List[dict]
    vendors: List[dict]
    chats: List[dict]
    summary: DashboardSummary
