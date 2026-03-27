from app.db.supabase import supabase

def setup_defaults():
    # 1. Create a project
    project_result = supabase.table('projects').insert({
        'title': '몽글 웨딩 프로젝트',
        'description': '기본 웨딩 프로젝트입니다.'
    }).select().execute()
    
    if not project_result.data:
        print("Failed to create project")
        return
        
    project_id = project_result.data[0]['id']
    print(f"Created project: {project_id}")
    
    # 2. Create a chat room
    chat_result = supabase.table('chats').insert({
        'project_id': project_id,
        'title': '플래너 상담방'
    }).select().execute()
    
    if chat_result.data:
        print(f"Created chat: {chat_result.data[0]['id']}")
    else:
        print("Failed to create chat")

if __name__ == "__main__":
    setup_defaults()
