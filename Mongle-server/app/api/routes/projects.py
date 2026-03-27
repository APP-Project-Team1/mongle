from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.db.supabase import supabase
from app.api.deps import get_current_user

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str # normalized to name
    wedding_date: Optional[str] = None
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    wedding_date: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

# 전체 프로젝트 조회 (로그인 유저 관련 프로젝트만)
@router.get("/")
def get_projects(user = Depends(get_current_user)):
    # 1. 사용자가 소유한 프로젝트
    # 2. 사용자가 포함된 커플의 프로젝트
    
    # 먼저 사용자가 속한 커플 ID 목록 가져오기
    couples_res = supabase.table("couples")\
        .select("id")\
        .or_(f"user1_id.eq.{user.id},user2_id.eq.{user.id}")\
        .execute()
    
    couple_ids = [c["id"] for c in couples_res.data]
    
    query = supabase.table("projects").select("*")
    
    if couple_ids:
        # owner_id가 본인이거나 couple_id가 본인 커플인 경우
        # Supabase Python client filter syntax for OR across columns
        couple_filter = ",".join(couple_ids)
        result = query.or_(f"owner_id.eq.{user.id},couple_id.in.({couple_filter})").execute()
    else:
        result = query.eq("owner_id", user.id).execute()
        
    return result.data

@router.get("/{project_id}")
def get_project(project_id: str, user = Depends(get_current_user)):
    result = supabase.table("projects").select("*").eq("id", project_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")

    project = result.data[0]
    
    # 권한 확인 (생략 가능 - RLS가 처리하지만 백엔드에서 한번 더 해주면 좋음)
    # TODO: Verify access
    
    return project

@router.post("/")
def create_project(data: ProjectCreate, user = Depends(get_current_user)):
    insert_data = {
        "name": data.name,
        "wedding_date": data.wedding_date,
        "description": data.description,
        "owner_id": user.id
    }

    result = supabase.table("projects").insert(insert_data).execute()
    return result.data[0]

@router.put("/{project_id}")
def update_project(project_id: str, data: ProjectUpdate, user = Depends(get_current_user)):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 값이 없습니다.")

    result = supabase.table("projects").update(update_data).eq("id", project_id).execute()
    return result.data

@router.delete("/{project_id}")
def delete_project(project_id: str, user = Depends(get_current_user)):
    result = supabase.table("projects").delete().eq("id", project_id).execute()
    return result.data