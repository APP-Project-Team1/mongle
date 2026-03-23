# 💍 Mongle-app - 예비 부부 & 웨딩 플래너 협업 AI 플랫폼

**Mongle-app**은 예비 부부와 웨딩 플래너가 함께 결혼을 준비할 수 있도록 돕는 협업 플랫폼입니다. 일정 관리, 비용 추적, 업체 탐색, 그리고 AI 챗봇 기능을 통해 원활하고 스마트한 웨딩 준비 경험을 제공합니다.

---

## 🧑‍💻 팀원 역할 및 폴더 구조 (Directory Structure & Ownership)

팀원들의 원활한 협업을 위해 폴더 및 파일별로 담당자를 지정했습니다. 각자 맡은 영역에서 작업을 진행해 주세요. 

- **[나(PM)]** : AI 챗봇 UI, 일정 관리 총괄
- **[팀원 B]** : 로그인, 업체, 플래너 관련 화면 및 UI
- **[팀원 C]** : 백엔드 연동, DB, 설계, 전역 상태, API 훅
- **[팀원 D]** : 커플/플래너 대시보드, 타임라인, 예산 관리 UI
- **[공통]** : 전원 함께 사용하는 유틸, 상수, 공통 컴포넌트

```text
Mongle-app/
├── app/                  # Expo Router 라우트
│   ├── (auth)/           # [팀원 B] 로그인·회원가입
│   │   ├── _layout.jsx   # [팀원 B]
│   │   ├── login.jsx     # [팀원 B]
│   │   └── register.jsx  # [팀원 B]
│   ├── (couple)/         # [팀원 D] 커플 전용 탭 그룹
│   │   ├── _layout.jsx   # [팀원 D] 탭 네비게이터
│   │   ├── index.jsx     # [팀원 D] 준비 현황 대시보드 (D-day)
│   │   ├── timeline.jsx  # [팀원 D] 결혼 준비 타임라인
│   │   ├── budget.jsx    # [팀원 D] 비용 명세서
│   │   ├── chat.jsx      # [나(PM)] 플래너 채팅 (Realtime) & 챗봇 UI
│   │   ├── vendors.jsx   # [팀원 D] 업체 탐색 
│   │   └── docs.jsx      # [팀원 D] 서류 보관함
│   ├── (planner)/        # [팀원 D] 플래너 전용 탭 그룹
│   │   ├── _layout.jsx   # [팀원 D]
│   │   ├── dashboard.jsx # [팀원 D] 고객 목록 + 요약 지표
│   │   └── customer/     # [팀원 D]
│   │       └── [id].jsx  # [팀원 D] 고객 상세 (동적 라우트)
│   ├── planners/         # [팀원 B]
│   │   ├── index.jsx     # [팀원 B] 플래너 목록
│   │   └── [id].jsx      # [팀원 B] 플래너 상세 프로필
│   ├── vendors/          # [팀원 B]
│   │   ├── index.jsx     # [팀원 B] 업체 목록 + 필터
│   │   └── [id].jsx      # [팀원 B] 업체 상세 + 후기
│   └── _layout.jsx       # [공통] 루트 레이아웃 (인증 가드)
│
├── components/           # 재사용 UI 컴포넌트
│   ├── common/           # [공통] 전원 사용
│   │   ├── Button.jsx    # [공통]
│   │   ├── Card.jsx      # [공통]
│   │   ├── Badge.jsx     # [공통]
│   │   └── LoadingSpinner.jsx # [공통]
│   ├── budget/           # [팀원 D]
│   │   ├── BudgetItem.jsx # [팀원 D]
│   │   └── AiAnalysisCard.jsx # [나(PM)] SSE 스트리밍 결과 표시
│   ├── chat/             # [나(PM)]
│   │   ├── MessageBubble.jsx  # [나(PM)]
│   │   └── ChatInput.jsx      # [나(PM)]
│   ├── timeline/         # [팀원 D]
│   │   ├── TimelineStep.jsx   # [팀원 D]
│   │   └── StepCard.jsx       # [팀원 D]
│   └── vendor/           # [팀원 B]
│       ├── VendorCard.jsx     # [팀원 B]
│       └── MatchScoreBar.jsx  # [팀원 B]
│
├── lib/                  # [팀원 C] 외부 클라이언트 초기화
│   ├── supabase.js       # [팀원 C] Supabase 클라이언트 + AsyncStorage
│   └── api.js            # [팀원 C] Axios FastAPI 클라이언트 (인터셉터)
│
├── stores/               # [팀원 C] Zustand 전역 상태
│   ├── authStore.js      # [팀원 C] 로그인 세션, 사용자 role
│   └── projectStore.js   # [팀원 C] 현재 프로젝트 ID, 플래너 정보
│
├── hooks/                # [팀원 C] React Query 커스텀 훅
│   ├── useTimeline.js    # [팀원 C]
│   ├── useBudget.js      # [팀원 C]
│   ├── useChat.js        # [팀원 C] Realtime 구독 포함
│   ├── useVendors.js     # [팀원 C]
│   └── useAi.js          # [나(PM), 팀원 C] SSE 스트리밍 훅
│
├── constants/            # [공통] 전역 상수
│   └── index.js          # [공통] 카테고리, 스타일 태그 등
│
├── utils/                # [공통] 유틸 함수
│   ├── formatCurrency.js # [공통] 원화 포맷 (1,200,000원)
│   └── calculateDday.js  # [공통] D-day 계산
│
├── assets/               # [공통]
│   ├── images/           # [공통]
│   └── fonts/            # [공통]
│
├── app.json              # [공통] Expo 앱 설정 (이름, 아이콘, splash)
├── babel.config.js       # [팀원 C]
├── package.json          # [팀원 C] 프로젝트 패키지
├── .env                  # [팀원 C] EXPO_PUBLIC_SUPABASE_URL 등
└── .env.example          # [공통] 환경 변수 예시
```

---

## 🛠️ 기술 스택 (Tech Stack)
- **Frontend / Mobile**: React Native (Expo Router)
- **Backend**: Supabase, FastAPI
- **State Management**: Zustand, React Query
- **AI / API**: LLM 연동 챗봇 API, SSE Streaming

---

## 🤝 깃 브랜치 네이밍 컨벤션
브랜치 생성 및 커밋 메시지 규칙은 `.agents/workflows/git_branch_naming.md` 파일을 참조해주세요.
