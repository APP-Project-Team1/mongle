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

# Mapping from app category codes to Supabase table names
TABLE_MAP = {
    'wedding_hall': 'hall_vendors',
    'studio': 'studio_vendors',
    'dress': 'dress_vendors',
    'makeup': 'makeup_vendors',
    'snapshot': 'video_snap_vendors',
    'package': 'package_vendors',
    'planner': 'planner_vendors',
}

def format_location(item):
    """Helper to combine region, district, and neighborhood into a readable location string."""
    district = item.get('district')
    neighborhood = item.get('neighborhood')
    region = item.get('region')
    address = item.get('address') or item.get('road_address')

    if district and neighborhood:
        return f"{district} {neighborhood}"
    if region and district:
        return f"{region} {district}"
    if district:
        return district
    if neighborhood:
        return neighborhood
    if region:
        return region
    
    # Fallback to the first few words of the address if it exists
    if address:
        parts = address.split()
        return " ".join(parts[:2])
    
    return "정보 없음"

@router.get('/')
def get_vendors(category: Optional[str] = None, query: Optional[str] = None):
    # Normalize category to handle 'undefined' string from frontend
    if category == 'undefined' or not category:
        category = None

    # Determine the correct Supabase table if category is provided
    table_name = TABLE_MAP.get(category)
    
    if table_name:
        try:
            supabase_query = supabase.table(table_name).select('*')
            if query:
                # Use ilike for case-insensitive partial match on name
                supabase_query = supabase_query.ilike('name', f'%{query}%')
            
            result = supabase_query.execute()
            if result.data:
                # Format location for each item
                for item in result.data:
                    item['location'] = format_location(item)
                return result.data
        except Exception as e:
            print(f"Supabase query for table {table_name} failed: {e}")
    elif not category and query:
        # GLOBAL SEARCH: Query all tables if no category is specified
        all_results = []
        for cat_code, t_name in TABLE_MAP.items():
            try:
                res = supabase.table(t_name).select('*').ilike('name', f'%{query}%').limit(10).execute()
                if res.data:
                    # Add a unique ID prefix and format location
                    for item in res.data:
                        item['id'] = f"{cat_code}_{item['id']}"
                        item['category'] = cat_code
                        item['location'] = format_location(item)
                    all_results.extend(res.data)
            except Exception as e:
                print(f"Global search failed for table {t_name}: {e}")
        
        if all_results:
            # Sort by name and limit total results
            all_results.sort(key=lambda x: x.get('name', ''))
            return all_results[:30]

    # Fallback to local JSON data if table search yields nothing or fails
    results = LOCAL_VENDORS
    if category:
        # Match against our internal categories
        results = [v for v in results if v.get('category') == category]
    if query:
        results = [v for v in results if query.lower() in v.get('name', '').lower()]
    
    # Ensure 'id' exists and format location for local results
    for item in results:
        if 'id' not in item and 'vendor_id' in item:
            item['id'] = item['vendor_id']
        if not item.get('location'):
            item['location'] = format_location(item)
    
    return results

@router.get('/{vendor_id}')
def get_vendor(vendor_id: str):
    result = supabase.table('vendors').select('*').eq('id', vendor_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')
    return result.data[0]

@router.post('/')
def create_vendor(data: VendorCreate):
    result = supabase.table('vendors').insert(insert_data).execute()
    return result.data[0] if result.data else None

@router.put('/{vendor_id}')
def update_vendor(vendor_id: str, data: VendorUpdate):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail='수정할 값이 없습니다.')

    existing = supabase.table('vendors').select('*').eq('id', vendor_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')

    result = supabase.table('vendors').update(update_data).eq('id', vendor_id).execute()
    return result.data[0] if result.data else None

@router.delete('/{vendor_id}')
def delete_vendor(vendor_id: str):
    existing = supabase.table('vendors').select('*').eq('id', vendor_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail='해당 업체를 찾을 수 없습니다.')

    supabase.table('vendors').delete().eq('id', vendor_id).execute()
    return {'deleted': True}
