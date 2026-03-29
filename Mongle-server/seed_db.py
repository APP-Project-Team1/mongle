from app.db.supabase import supabase
import uuid

def seed_data():
    # 1. Check if ANY project exists
    res = supabase.table('projects').select('*').limit(1).execute()
    if res.data:
        print(f"Project already exists: {res.data[0]['id']}")
        project_id = res.data[0]['id']
    else:
        # Create a default project
        project_data = {
            'id': str(uuid.uuid4()),
            'title': '몽글이 & 뭉글이의 결혼준비',
            'description': '행복한 결혼 준비를 위한 메인 프로젝트입니다.',
            'status': 'active'
        }
        res = supabase.table('projects').insert(project_data).execute()
        if not res.data:
            print("Failed to create project")
            return
        project_id = res.data[0]['id']
        print(f"Created default project: {project_id}")

    # 2. Check if budget exists for this project
    res = supabase.table('budgets').select('*').eq('project_id', project_id).execute()
    if res.data:
        print(f"Budget already exists for project {project_id}")
    else:
        # Create a default budget
        budget_data = {
            'id': str(uuid.uuid4()),
            'project_id': project_id,
            'total_amount': 3500.0, # 35,000,000 KRW
            'spent': 0.0,
            'category': 'Wedding'
        }
        res = supabase.table('budgets').insert(budget_data).execute()
        if res.data:
            print(f"Created default budget for project: {res.data[0]['id']}")
        else:
            print("Failed to create budget")

if __name__ == "__main__":
    seed_data()
