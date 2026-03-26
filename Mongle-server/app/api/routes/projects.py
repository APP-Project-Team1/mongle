from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase

router = APIRouter()


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# DB 테스트
@router.get("/test")
def test_projects_db():
    result = supabase.table("projects").select("*").execute()
    return result.data


# 전체 프로젝트 조회
@router.get("/")
def get_projects():
    result = supabase.table("projects").select("*").execute()
    return result.data


# 프로젝트 단일 조회
@router.get("/{project_id}")
def get_project(project_id: str):
    result = supabase.table("projects").select("*").eq("id", project_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")

    return result.data[0]


# 프로젝트 생성
@router.post("/")
def create_project(data: ProjectCreate):
    insert_data = {
        "title": data.title,
        "description": data.description
    }

    result = supabase.table("projects").insert(insert_data).execute()
    return result.data


# 프로젝트 수정
@router.put("/{project_id}")
def update_project(project_id: str, data: ProjectUpdate):
    update_data = data.dict(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 값이 없습니다.")

    check = supabase.table("projects").select("*").eq("id", project_id).execute()

    if not check.data:
        raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")

    result = supabase.table("projects").update(update_data).eq("id", project_id).execute()
    return result.data


# 프로젝트 삭제
@router.delete("/{project_id}")
def delete_project(project_id: str):
    check = supabase.table("projects").select("*").eq("id", project_id).execute()

    if not check.data:
        raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")

    result = supabase.table("projects").delete().eq("id", project_id).execute()
    return result.data