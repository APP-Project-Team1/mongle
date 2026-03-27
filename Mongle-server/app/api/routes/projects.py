from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase

router = APIRouter()


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    owner_id: Optional[str] = None
    couple_id: Optional[str] = None
    status: Optional[str] = 'active'


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


@router.get("/test")
def test_projects_db():
    result = supabase.table("projects").select("*").execute()
    return result.data


# 전체 프로젝트 조회
@router.get("/")
def get_projects():
    result = supabase.table("projects").select("*").execute()
    return result.data


import uuid

# 프로젝트 단일 조회
@router.get("/{project_id}")
def get_project(project_id: str):
    try:
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")

        result = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 프로젝트 생성
@router.post("/")
def create_project(data: ProjectCreate):
    insert_data = data.dict()
    
    # Remove None values to let DB use defaults
    insert_data = {k: v for k, v in insert_data.items() if v is not None}

    print(f"INSERT DATA: {insert_data}")
    
    try:
        result = supabase.table("projects").insert(insert_data).execute()
        # Newer supabase-py might not have .error, but we check if result is none or data is empty
        if not result.data:
             # Try to see if there's an error attribute if it exists
             error_msg = getattr(result, 'error', 'Unknown database error')
             print(f"DATABASE ERROR: {error_msg}")
             raise HTTPException(status_code=500, detail=str(error_msg))
        
        return result.data[0]
    except Exception as e:
        print(f"EXCEPTION DURING INSERT: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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