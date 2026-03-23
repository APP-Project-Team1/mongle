---
description: How to correctly name Git branches and make commits in this project
---

# Git Branch and Commit Naming Rules

이 프로젝트에서 Git 브랜치를 생성하거나 커밋을 수행할 때 반드시 지켜야 하는 '팀 브랜치 네이밍 규칙'입니다.
작업을 계획(Plan)하고 실행(Execute)할 때 이 규칙을 최우선으로 적용하십시오.

## [팀 브랜치 네이밍 규칙]

### 1. 브랜치명 구조
- `타입/#이슈번호-작업내용` 
- (예: `feat/#1-login-ui`)

### 2. 타입 (Type) 정의
- `feat/`: 새로운 핵심 기능 개발
- `fix/`: 버그 수정
- `design/`: UI/UX 퍼블리싱 및 스타일링 작업
- `refactor/`: 기능 변화 없이 코드 구조나 로직을 깔끔하게 개선할 때
- `chore/`: 패키지 설치, 환경 설정 파일 수정
- `docs/`: README.md 등 문서 수정

### 3. 작성 세부 규칙 (Rule)
- 반드시 **'소문자'**만 사용할 것.
- 단어 사이는 띄어쓰기나 언더바(`_`) 대신 반드시 **'하이픈(`-`)'**으로 연결할 것.
- 영어로 명확하고 간결하게 작성할 것.

**※ 주의사항**: 브랜치 생성이나 커밋을 수행하기 전, 항상 이 양식에 맞는지 스스로 검증(Self-Check)하십시오.

---

## 💻 팀원 복사/붙여넣기용 명령어 모음

이슈 번호(예: `1`)와 작업 내용(예: `login-ui`)을 본인의 상황에 맞게 수정하여 바로 복사 후 터미널에 붙여넣기하세요.

### `feat/` (새로운 기능 개발)
```bash
# 브랜치 생성 및 이동
git checkout -b feat/#1-feature-name

# 커밋 메시지
git commit -m "feat: 기능 설명"
```

### `fix/` (버그 수정)
```bash
# 브랜치 생성 및 이동
git checkout -b fix/#1-bug-name

# 커밋 메시지
git commit -m "fix: 버그 수정 내용"
```

### `design/` (UI/UX 퍼블리싱)
```bash
# 브랜치 생성 및 이동
git checkout -b design/#1-ui-name

# 커밋 메시지
git commit -m "design: UI 스타일링 내용"
```

### `refactor/` (코드 리팩토링)
```bash
# 브랜치 생성 및 이동
git checkout -b refactor/#1-refactor-name

# 커밋 메시지
git commit -m "refactor: 리팩토링 내용"
```

### `chore/` (환경 설정, 패키지 설치)
```bash
# 브랜치 생성 및 이동
git checkout -b chore/#1-chore-name

# 커밋 메시지
git commit -m "chore: 설정 변경 및 패키지 설치 내용"
```

### `docs/` (문서 작업)
```bash
# 브랜치 생성 및 이동
git checkout -b docs/#1-doc-name

# 커밋 메시지
git commit -m "docs: 문서 작성 및 수정 내용"
```
