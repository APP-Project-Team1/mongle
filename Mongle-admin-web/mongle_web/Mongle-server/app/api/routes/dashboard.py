from fastapi import APIRouter, HTTPException
from app.services.dashboard_service import get_dashboard_bundle

router = APIRouter()


@router.get("/{project_id}")
def read_dashboard(project_id: str):
    try:
        data = get_dashboard_bundle(project_id)
        return {
            "success": True,
            "message": "대시보드 조회 성공",
            "data": data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
