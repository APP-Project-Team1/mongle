# Mongle FastAPI → Supabase → Web starter

## 목적
팀이 Supabase 에 모아둔 데이터를
웹에서 직접 읽지 않고,
FastAPI 가 대신 읽어서 React 웹으로 내려주는 구조 예시입니다.

## 폴더
- `Mongle-server/app/...`
- `Mongle-admin-web/src/...`

## 핵심 흐름
1. 웹은 `src/lib/api.js` 로 FastAPI 호출
2. FastAPI 는 `app/services/dashboard_service.py` 에서 Supabase 조회
3. 응답을 웹 `Dashboard.jsx` 에 표시

## 꼭 확인할 것
- 실제 테이블명: `projects`, `timelines`, `budgets`, `vendors`, `chats`
- 실제 컬럼명: `id`, `project_id`, `date`, `amount`, `created_at`
- 컬럼명이 다르면 서비스 함수에서 바로 바꾸기
- `projects.id` 타입이 UUID 인지 int 인지 확인하기
- `.env` 에 Supabase URL/Key 넣기

## 네가 직접 맞춰야 하는 부분
- `timelines` 정렬 컬럼 `date`
- `budgets` 금액 컬럼 `amount`
- `vendors` 업체명 컬럼 `name`
- `chats` 메시지 컬럼 `message`
실제 DB 컬럼명이 다르면 각 파일 안에서 수정하면 됩니다.
