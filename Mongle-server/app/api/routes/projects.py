from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import uuid
from app.db.supabase import supabase
from app.api.deps import get_current_user

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str # normalized to name
    wedding_date: Optional[str] = None
    description: Optional[str] = None
    owner_id: Optional[str] = None
    couple_id: Optional[str] = None
    status: Optional[str] = 'active'

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    wedding_date: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

@router.get("/test")
def test_projects_db():
    result = supabase.table("projects").select("*").execute()
    return result.data

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
        couple_filter = ",".join(couple_ids)
        result = query.or_(f"owner_id.eq.{user.id},couple_id.in.({couple_filter})").execute()
    else:
        result = query.eq("owner_id", user.id).execute()
        
    return result.data

# 프로젝트 단일 조회
@router.get("/{project_id}")
def get_project(project_id: str, user = Depends(get_current_user)):
    try:
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")

        result = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")
        
        # TODO: Check permission (user.id or user couple_id)
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_project(data: ProjectCreate, user = Depends(get_current_user)):
    insert_data = data.model_dump()
    # Remove None values to let DB use defaults
    insert_data = {k: v for k, v in insert_data.items() if v is not None}
    insert_data["owner_id"] = user.id

    try:
        result = supabase.table("projects").insert(insert_data).execute()
        if not result.data:
             error_msg = getattr(result, 'error', 'Unknown database error')
             raise HTTPException(status_code=500, detail=str(error_msg))
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{project_id}")
def update_project(project_id: str, data: ProjectUpdate, user = Depends(get_current_user)):
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 값이 없습니다.")

    result = supabase.table("projects").update(update_data).eq("id", project_id).execute()
    return result.data[0] if result.data else None

@router.delete("/{project_id}")
def delete_project(project_id: str, user = Depends(get_current_user)):
    result = supabase.table("projects").delete().eq("id", project_id).execute()
    return result.data