from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase

router = APIRouter()


class TimelineCreate(BaseModel):
    project_id: str
    title: str
    description: str


class TimelineUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# DB 테스트
@router.get("/test")
def test_db():
    result = supabase.table("timelines").select("*").execute()
    return result.data


# 전체 타임라인 조회
@router.get("/")
def get_timelines():
    result = supabase.table("timelines").select("*").execute()
    return result.data


# 특정 프로젝트의 타임라인 조회
@router.get("/project/{project_id}")
def get_timelines_by_project(project_id: str):
    result = (
        supabase
        .table("timelines")
        .select("*")
        .eq("project_id", project_id)
        .execute()
    )
    return result.data


# 타임라인 단일 조회
@router.get("/{timeline_id}")
def get_timeline(timeline_id: str):
    result = supabase.table("timelines").select("*").eq("id", timeline_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="해당 타임라인을 찾을 수 없습니다.")

    return result.data[0]


# 타임라인 생성
@router.post("/")
def create_timeline(data: TimelineCreate):
    # project 존재 확인
    project_check = supabase.table("projects").select("*").eq("id", data.project_id).execute()

    if not project_check.data:
        raise HTTPException(status_code=404, detail="해당 project_id의 프로젝트가 없습니다.")

    insert_data = {
        "project_id": data.project_id,
        "title": data.title,
        "description": data.description
    }

    result = supabase.table("timelines").insert(insert_data).execute()
    return result.data


# 타임라인 수정
@router.put("/{timeline_id}")
def update_timeline(timeline_id: str, data: TimelineUpdate):
    update_data = data.dict(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 값이 없습니다.")

    check = supabase.table("timelines").select("*").eq("id", timeline_id).execute()

    if not check.data:
        raise HTTPException(status_code=404, detail="해당 타임라인을 찾을 수 없습니다.")

    result = supabase.table("timelines").update(update_data).eq("id", timeline_id).execute()
    return result.data


# 타임라인 삭제
@router.delete("/{timeline_id}")
def delete_timeline(timeline_id: str):
    check = supabase.table("timelines").select("*").eq("id", timeline_id).execute()

    if not check.data:
        raise HTTPException(status_code=404, detail="해당 타임라인을 찾을 수 없습니다.")

    result = supabase.table("timelines").delete().eq("id", timeline_id).execute()
    return result.data