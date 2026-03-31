from fastapi import APIRouter, HTTPException
from app.services.dashboard_service import get_projects, get_project_by_id

router = APIRouter()


@router.get("/")
def read_projects():
    try:
        return {
            "success": True,
            "message": "프로젝트 목록 조회 성공",
            "data": get_projects(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}")
def read_project(project_id: str):
    try:
        project = get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
        return {
            "success": True,
            "message": "프로젝트 조회 성공",
            "data": project,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
