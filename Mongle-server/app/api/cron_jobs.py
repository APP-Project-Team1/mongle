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
        # status가 'pending'인 항목 중 due_date가 위 target_dates 에 해당하는 것들 조회
        timelines_res = supabase.table('timelines').select('*, projects(couple_id)').eq('status', 'pending').execute()
        timelines = timelines_res.data if timelines_res.data else []
        
        for t in timelines:
            if not t.get('due_date'): continue
            due_date = datetime.strptime(t['due_date'], '%Y-%m-%d').date()
            
            diff_days = (due_date - today).days
            if diff_days in [1, 3, 7]:
                d_type = f"D-{diff_days}"
                couple_id = t.get('projects', {}).get('couple_id')
                if not couple_id: continue
                
                await notify_couple(
                    couple_id=couple_id,
                    title=f"📅 {d_type} 일정 알림",
                    body=f"'{t['step_name']}' 일정이 {diff_days}일 남았습니다.",
                    type="dday_reminder",
                    ref_type="timeline",
                    ref_id=t['id'],
                    icon="calendar-outline"
                )

        # ---- 2. 잔금 (Budget Items) 확인 ----
        # 결제가 완료되지 않은(spent < amount 이거나 별도 is_paid 필드가 없는 경우)
        budgets_res = supabase.table('budget_items').select('*, budgets(projects(couple_id))').execute()
        budget_items = budgets_res.data if budgets_res.data else []
        
        for b in budget_items:
            # 잔금 일정이 있는지 확인 (balance_due 필드가 존재하는지 확인)
            balance_due_str = b.get('balance_due')
            if not balance_due_str: continue
            
            # DB에 is_paid 필드가 있다면 체크 (True면 패스)
            if b.get('is_paid') == True:
                continue
                
            try:
                if len(balance_due_str) == 8 and "-" not in balance_due_str:
                    clean_date = f"{balance_due_str[:4]}-{balance_due_str[4:6]}-{balance_due_str[6:]}"
                else:
                    clean_date = balance_due_str
                due_date = datetime.strptime(clean_date, '%Y-%m-%d').date()
            except:
                continue
                
            diff_days = (due_date - today).days
            if diff_days in [1, 3, 7]:
                d_type = f"D-{diff_days}"
                couple_id = b.get('budgets', {}).get('projects', {}).get('couple_id')
                if not couple_id: continue
                
                amount_str = f"{int(b.get('balance_amount', 0))}만원" if b.get('balance_amount') else "잔금"
                
                await notify_couple(
                    couple_id=couple_id,
                    title=f"💸 {d_type} 잔금 결제 알림",
                    body=f"'{b.get('vendor_name') or b.get('label')}' {amount_str} 결제일이 {diff_days}일 남았습니다.",
                    type="payment_due",
                    ref_type="budget",
                    ref_id=b['id'],
                    icon="cash-outline"
                )
                
    except Exception as e:
        print(f"Error in notification job: {str(e)}")

async def notify_couple(couple_id: str, title: str, body: str, type: str, ref_type: str, ref_id: str, icon: str):
    """
    특정 couple_id에 속한 user_profiles 들을 찾아서 푸시 및 알림 저장
    """
    profiles_res = supabase.table('user_profiles').select('id, expo_push_token').eq('couple_id', couple_id).execute()
    profiles = profiles_res.data if profiles_res.data else []
    
    for p in profiles:
        user_id = p['id']
        push_token = p.get('expo_push_token')
        
        # 중복 발송(멱등성) 방지를 위해 기존 알림이 있는지 체크
        existing = supabase.table('notifications').select('id') \
            .eq('user_id', user_id) \
            .eq('ref_id', ref_id) \
            .eq('type', type) \
            .execute()
            
        if existing.data:
            continue
            
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
