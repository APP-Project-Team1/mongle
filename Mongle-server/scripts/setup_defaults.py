from app.db.supabase import supabase

def setup_defaults():
    # 1. Create a project
    try:
        project_result = supabase.table('projects').insert({
            'title': '몽글 웨딩 프로젝트',
            'description': '기본 웨딩 프로젝트입니다.'
        }).execute()
        
        if not project_result.data:
            print(f"Failed to create project: {project_result}")
            return
            
        project_id = project_result.data[0]['id']
        print(f"Created project: {project_id}")
        
        # 2. Create a chat room
        chat_result = supabase.table('chats').insert({
            'project_id': project_id,
            'title': '플래너 상담방'
        }).execute()
        
        if chat_result.data:
            print(f"Created chat: {chat_result.data[0]['id']}")
        else:
            print(f"Failed to create chat: {chat_result}")
    except Exception as e:
        print(f"Error during setup: {e}")

if __name__ == "__main__":
    setup_defaults()
