# 🍽️ [프로젝트 이름] - AI 기반 메뉴판 사진 분석 및 번역 앱

![프로젝트 대표 이미지 또는 배너 이미지 URL](https://via.placeholder.com/800x400?text=Menu+Translation+App+Banner)

## 💡 프로젝트 소개

해외여행이나 낯선 식당에서 외국어 메뉴판을 읽기 어려웠던 경험을 해결하기 위해 기획된 앱입니다. 사용자가 메뉴판 사진을 찍으면 AI 비전 기술을 통해 텍스트를 분석하고, 실시간으로 번역하여 제공합니다. 초보자도 쉽게 사용할 수 있는 직관적인 UI/UX를 지향합니다.

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend / Mobile:** React Native (Expo)
  - 단일 코드베이스로 iOS와 Android 동시 지원 및 빠른 프로토타이핑
- **Backend / BaaS:** Firebase
  - 별도의 서버 구축 없이 Authentication(로그인 인증), Cloud Firestore(데이터베이스), Cloud Storage(이미지 저장소) 해결
- **AI / API:** Claude / GPT-4o Vision API
  - 고도화된 이미지 텍스트 추출(OCR) 및 자연스러운 문맥 번역 처리
- **Collaboration:** GitHub, [예: Figma, Notion, Slack 등]

## ✨ 주요 기능 (Key Features)

1. **사진 촬영 및 이미지 업로드**: 기기 카메라 및 갤러리 연동으로 메뉴판 이미지 업로드
2. **AI 메뉴판 분석 및 번역**: Vision API를 활용해 이미지 내 외국어 메뉴명, 가격, 설명 텍스트 추출 및 한국어 번역
3. **사용자 맞춤형 저장 (히스토리)**: Firebase Firestore를 활용해 이전에 번역했던 메뉴판 기록을 저장하고 다시 보기 지원
4. **간편 로그인**: Firebase Authentication을 이용한 소셜 및 이메일 로그인 기능

## 🧑‍💻 팀원 소개 및 역할 (Team Roles)

| 이름            | 포지션               | GitHub                               | 담당 업무                                                                                                                                     |
| --------------- | -------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **에반 (팀장)** | PM / AI 기능         | [@GitHub_ID](https://github.com/...) | - 전체 일정·Git 관리, README 작성<br>- Vision API 호출 및 LLM 프롬프트 설계 (직관 번역, 알레르기 안내)<br>- API 응답 파싱 및 데이터 구조 정의 |
| **팀원 1**      | 카메라 / 이미지 처리 | [@GitHub_ID](https://github.com/...) | - Expo Camera 촬영 및 갤러리 이미지 불러오기<br>- 이미지 리사이즈·압축 및 촬영 가이드 UI 구현<br>- Firebase Storage 업로드 연동               |
| **팀원 2**      | 결과 화면 UI / UX    | [@GitHub_ID](https://github.com/...) | - 번역 결과 카드 UI 및 알레르기 뱃지 구현<br>- 로딩 스켈레톤 및 설명 토글 UI 작성<br>- Firebase Firestore 기반 즐겨찾기 저장 기능             |
| **팀원 3**      | 앱 구조 / 네비게이션 | [@GitHub_ID](https://github.com/...) | - Expo Router 화면 전환 구조 설계<br>- 홈·온보딩·히스토리 화면 구현 및 접근성 대응<br>- 앱 아이콘·스플래시 및 EAS 빌드·배포                   |

## 📁 폴더 구조 (Directory Structure)

```text
[프로젝트 이름]/
├── App.js
├── app.json
├── src/
│   ├── assets/        # 폰트, 이미지 등 정적 파일
│   ├── components/    # 공통 재사용 컴포넌트 (버튼, 모달 등)
│   ├── screens/       # 전체 화면 (홈, 카메라, 번역 결과, 마이페이지)
│   ├── services/      # Firebase, Vision API 연동 로직
│   └── utils/         # 상수 및 헬퍼 함수
└── package.json
🚀 실행 방법 (Getting Started)
프로젝트를 로컬 환경에서 실행하기 위한 가이드입니다. (Node.js 환경 필요)

Repository 클론

Bash
git clone [https://github.com/Organization명/Repository명.git](https://github.com/Organization명/Repository명.git)
패키지 설치

Bash
npm install
# 또는 yarn install
Expo 앱 실행

Bash
npx expo start
실행 후 터미널에 나타나는 QR 코드를 모바일 기기의 'Expo Go' 앱으로 스캔하여 테스트할 수 있습니다.

🤝 협업 규칙 (Collaboration Rules)
저희 팀은 성공적인 프로젝트 완성을 위해 아래와 같은 규칙을 준수하여 GitHub를 통한 협업을 진행합니다.

Branch Strategy: Git Flow (main, develop, feature/기능명)

Pull Request: 반드시 1명 이상의 리뷰(Approve) 후 develop 브랜치에 Merge 진행

Commit Convention:

Feat: 새로운 기능 추가

Fix: 버그 수정

Design: UI/UX 디자인 변경

Refactor: 코드 리팩토링

Docs: README 등 문서 수정
```
