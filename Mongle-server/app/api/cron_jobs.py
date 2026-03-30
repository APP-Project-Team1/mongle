import httpx
from datetime import datetime, timedelta
from app.db.supabase import supabase

async def send_expo_push_message(token, title, body, data=None):
    if not token or not token.startswith("ExponentPushToken"):
        return
        
    message = {
        "to": token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data or {}
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=message,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
        except Exception as e:
            print(f"Failed to send push notification to {token}: {str(e)}")

async def run_daily_notification_job():
    """
    매일 실행되며 다가오는 일정(timelines)과 잔금(budget_items)에 대해 
    D-7, D-3, D-1 알림을 발송하고 notifications 테이블에 저장합니다.
    """
    print(f"[{datetime.now()}] Running daily notification job...")
    
    today = datetime.now().date()
    # D-7, D-3, D-1 날짜 계산
    target_dates = {
        'D-7': today + timedelta(days=7),
        'D-3': today + timedelta(days=3),
        'D-1': today + timedelta(days=1)
    }
    
    try:
        # ---- 1. 일정 (Timelines) 확인 ----
        try:
            timelines_res = supabase.table('timelines').select('*').execute()
            timelines = timelines_res.data if timelines_res.data else []
            print(f"[DEBUG] Found {len(timelines)} timelines.")
            
            for t in timelines:
                status = t.get('status')
                if status and status != 'pending': continue
                
                due_date_str = t.get('due_date')
                if not due_date_str: continue
                
                try:
                    due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
                except Exception:
                    continue
                    
                diff_days = (due_date - today).days
                print(f"[DEBUG] Timeline {t['id']} | due_date: {due_date} | diff_days: {diff_days}")
                
                if diff_days in [1, 3, 7]:
                    d_type = f"D-{diff_days}"
                    
                    # PGRST200 방지를 위해 직접 fetch
                    proj_res = supabase.table('projects').select('*').eq('id', t['project_id']).execute()
                    proj_data = proj_res.data[0] if proj_res.data else {}
                    couple_id = proj_data.get('couple_id')
                    user_id = proj_data.get('user_id') or proj_data.get('owner_id')
                    
                    if not couple_id and not user_id: 
                        print(f"[DEBUG] Timeline {t['id']} has no couple_id or user_id attached!")
                        continue
                    
                    print(f"[DEBUG] -> Triggering notification for Timeline {t['id']} (user/couple found)")
                    await notify_target(
                        couple_id=couple_id,
                        user_id=user_id,
                        title=f"📅 {d_type} 일정 알림",
                        body=f"'{t.get('step_name') or t.get('title')}' 일정이 {diff_days}일 남았습니다.",
                        type="dday_reminder",
                        ref_type="schedule",
                        ref_id=t['id'],
                        icon="calendar-outline"
                    )
        except Exception as e:
            print(f"[DEBUG] Skipping timelines due to schema error: {e}")

        # ---- 2. 잔금 (Budget Items) 확인 ----
        budgets_res = supabase.table('budget_items').select('*').execute()
        budget_items = budgets_res.data if budgets_res.data else []
        print(f"[DEBUG] Found {len(budget_items)} budget items.")
        
        for b in budget_items:
            balance_due_str = b.get('balance_due')
            if not balance_due_str: continue
            if b.get('is_paid') == True: continue
                
            try:
                if len(balance_due_str) == 8 and "-" not in balance_due_str:
                    clean_date = f"{balance_due_str[:4]}-{balance_due_str[4:6]}-{balance_due_str[6:]}"
                else:
                    clean_date = balance_due_str
                due_date = datetime.strptime(clean_date, '%Y-%m-%d').date()
            except:
                continue
                
            diff_days = (due_date - today).days
            print(f"[DEBUG] Budget Item {b['id']} | due_date: {due_date} | diff_days: {diff_days}")
            
            if diff_days in [1, 3, 7]:
                d_type = f"D-{diff_days}"
                
                # 직접 fetch (budget_items -> budgets -> projects)
                bg_res = supabase.table('budgets').select('*').eq('id', b['budget_id']).execute()
                bg_proj_id = bg_res.data[0].get('project_id') if bg_res.data else None
                
                couple_id, user_id = None, None
                if bg_proj_id:
                    pj_res = supabase.table('projects').select('*').eq('id', bg_proj_id).execute()
                    proj_data = pj_res.data[0] if pj_res.data else {}
                    couple_id = proj_data.get('couple_id')
                    user_id = proj_data.get('user_id') or proj_data.get('owner_id')
                    
                if not couple_id and not user_id:
                    print(f"[DEBUG] Budget Item {b['id']} has no couple_id or user_id attached!")
                    continue
                
                amount_str = f"{int(b.get('balance_amount', 0))}만원" if b.get('balance_amount') else "잔금"
                
                print(f"[DEBUG] -> Triggering notification for Budget Item {b['id']}")
                await notify_target(
                    couple_id=couple_id,
                    user_id=user_id,
                    title=f"💸 {d_type} 잔금 결제 알림",
                    body=f"'{b.get('vendor_name') or b.get('label')}' {amount_str} 결제일이 {diff_days}일 남았습니다.",
                    type="payment_due",
                    ref_type="payment",
                    ref_id=b['id'],
                    icon="cash-outline"
                )
                
    except Exception as e:
        print(f"[DEBUG] Skipping budget_items due to schema error: {e}")

async def notify_target(couple_id: str, user_id: str, title: str, body: str, type: str, ref_type: str, ref_id: str, icon: str):
    """
    특정 couple_id 또는 user_id에 속한 user_profiles 들을 찾아서 푸시 및 알림 저장
    """
    if couple_id:
        profiles_res = supabase.table('user_profiles').select('id, expo_push_token').eq('couple_id', couple_id).execute()
        profiles = profiles_res.data if profiles_res.data else []
    elif user_id:
        # UserID로 바로 찾기 (fallback)
        profiles_res = supabase.table('user_profiles').select('id, expo_push_token').eq('id', user_id).execute()
        profiles = profiles_res.data if profiles_res.data else []
        # 그래도 못 찾으면 (앱 사용자인데 user_profiles가 제대로 안 세팅되었을 수 있음)
        if not profiles:
            profiles = [{'id': user_id, 'expo_push_token': None}]
    else:
        profiles = []
        
    for p in profiles:
        user_id = p['id']
        push_token = p.get('expo_push_token')
        
        # 중복 방지를 위해 기존 알림이 있는지 체크
        existing = supabase.table('notifications').select('id') \
            .eq('user_id', user_id) \
            .eq('ref_id', ref_id) \
            .eq('type', type) \
            .execute()
            
        if existing.data:
            print(f"[DEBUG] Notification already exists for user_id={user_id}, ref_id={ref_id}. Skipping.")
            continue
            
        print(f"[DEBUG] Inserting notification for user_id={user_id}, ref_id={ref_id}")
            
        # 1. DB Insert
        notif_data = {
            "user_id": user_id,
            "title": title,
            "body": body,
            "type": type,
            "icon": icon,
            "icon_bg": "#fdf1f1",
            "icon_color": "#e87070",
            "is_read": False,
            "ref_type": ref_type,
            "ref_id": ref_id
        }
        supabase.table('notifications').insert(notif_data).execute()
        
        # 2. Push Notification 전송
        if push_token:
            await send_expo_push_message(push_token, title, body, {"ref_type": ref_type, "ref_id": ref_id})
