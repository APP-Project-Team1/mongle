from typing import Any, Dict, List
from app.db.supabase import supabase


def _safe_data(response) -> List[Dict[str, Any]]:
    return response.data or []


def get_projects() -> List[Dict[str, Any]]:
    response = (
        supabase.table("projects")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return _safe_data(response)


def get_project_by_id(project_id: str) -> Dict[str, Any] | None:
    response = (
        supabase.table("projects")
        .select("*")
        .eq("id", project_id)
        .limit(1)
        .execute()
    )
    data = _safe_data(response)
    return data[0] if data else None


def get_project_timelines(project_id: str) -> List[Dict[str, Any]]:
    # 컬럼명이 date 가 아니면 event_date 등 실제 컬럼명으로 바꿔주세요.
    response = (
        supabase.table("timelines")
        .select("*")
        .eq("project_id", project_id)
        .order("date")
        .execute()
    )
    return _safe_data(response)


def get_project_budgets(project_id: str) -> List[Dict[str, Any]]:
    response = (
        supabase.table("budgets")
        .select("*")
        .eq("project_id", project_id)
        .execute()
    )
    return _safe_data(response)


def get_project_vendors(project_id: str) -> List[Dict[str, Any]]:
    response = (
        supabase.table("vendors")
        .select("*")
        .eq("project_id", project_id)
        .execute()
    )
    return _safe_data(response)


def get_project_chats(project_id: str) -> List[Dict[str, Any]]:
    response = (
        supabase.table("chats")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return _safe_data(response)


def build_budget_total(budgets: List[Dict[str, Any]]) -> float:
    total = 0
    for item in budgets:
        amount = item.get("amount", 0) or 0
        try:
            total += float(amount)
        except (TypeError, ValueError):
            continue
    return total


def get_dashboard_bundle(project_id: str) -> Dict[str, Any]:
    projects = get_projects()
    timelines = get_project_timelines(project_id)
    budgets = get_project_budgets(project_id)
    vendors = get_project_vendors(project_id)
    chats = get_project_chats(project_id)

    return {
        "projects": projects,
        "timelines": timelines,
        "budgets": budgets,
        "vendors": vendors,
        "chats": chats,
        "summary": {
            "total_budget": build_budget_total(budgets),
            "timeline_count": len(timelines),
            "vendor_count": len(vendors),
            "chat_count": len(chats),
        },
    }
