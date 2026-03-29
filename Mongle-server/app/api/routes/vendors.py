from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db.supabase import supabase
from ai.budget_analyzer import load_sample_data

router = APIRouter()

class VendorCreate(BaseModel):
    name: str
    category: str
    location: Optional[str] = None
    rating: Optional[float] = 0.0
    contact_info: Optional[dict] = None

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    rating: Optional[float] = None
    contact_info: Optional[dict] = None

# Load local vendor data as fallback/primary for demo
LOCAL_VENDORS = load_sample_data()

@router.get('/')
def get_vendors(category: Optional[str] = None, query: Optional[str] = None):
    # Try Supabase first, if fails or table missing, use local data
    try:
        supabase_query = supabase.table('vendors').select('*')
        if category:
            supabase_query = supabase_query.eq('category', category)
        if query:
            supabase_query = supabase_query.ilike('name', f'%{query}%')
        
        result = supabase_query.execute()
        if result.data:
            return result.data
    except Exception as e:
        print(f"Supabase vendors query failed, falling back to local: {e}")

    # Fallback to local JSON data
    results = LOCAL_VENDORS
    if category:
        results = [v for v in results if v.get('category') == category]
    if query:
        results = [v for v in results if query.lower() in v.get('name', '').lower()]
    
    return results

@router.get('/{vendor_id}')
def get_vendor(vendor_id: str):
    result = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
    if result.error:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')
    return result.data

@router.post('/')
def create_vendor(data: VendorCreate):
    insert_data = data.dict(exclude_unset=True)
    result = supabase.table('vendors').insert(insert_data).select().single().execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return result.data

@router.put('/{vendor_id}')
def update_vendor(vendor_id: str, data: VendorUpdate):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail='수정할 값이 없습니다.')

    existing = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
    if existing.error or not existing.data:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')

    result = supabase.table('vendors').update(update_data).eq('id', vendor_id).select().single().execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return result.data

@router.delete('/{vendor_id}')
def delete_vendor(vendor_id: str):
    existing = supabase.table('vendors').select('*').eq('id', vendor_id).single().execute()
    if existing.error or not existing.data:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')

    result = supabase.table('vendors').delete().eq('id', vendor_id).execute()
    if result.error:
        raise HTTPException(status_code=500, detail=str(result.error))
    return {'deleted': True}
