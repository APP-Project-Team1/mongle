from fastapi import APIRouter, HTTPException
from app.services.dashboard_service import get_project_budgets

router = APIRouter()


@router.get("/project/{project_id}")
def read_project_budgets(project_id: str):
    try:
        return {
            "success": True,
            "message": "예산 조회 성공",
            "data": get_project_budgets(project_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
