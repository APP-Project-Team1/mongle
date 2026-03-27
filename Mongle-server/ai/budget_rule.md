당신은 React + TypeScript 기반 웨딩 플래닝 앱을 개발하는 시니어 프론트엔드/풀스택 엔지니어다.

내 프로젝트에 “AI 예산 최적화” 기능을 추가하고 싶다.

이 기능의 목적은 사용자가 웨딩 관련 업체를 선택한 뒤 전체 예산을 초과했을 때,
AI가 현재 선택 상태를 자동 분석하고,
예산 안에 들어올 수 있도록 스마트한 조정안을 제안하는 것이다.

[중요 카테고리]
우리 서비스의 카테고리는 아래 6개만 사용한다.

- wedding_hall = 웨딩홀
- studio = 스튜디오
- dress = 드레스
- makeup = 메이크업
- snapshot = 스냅샷
- package = 패키지

[중요한 도메인 규칙]

1. package는 일반 카테고리와 다르게 취급해야 한다.
2. package는 studio, dress, makeup, snapshot 중 일부 또는 전체를 묶은 상품일 수 있다.
3. 따라서 예산 최적화 시 package를 단순히 하나의 업체로만 보지 말고,
   “패키지를 유지하는 것이 유리한지”
   또는
   “패키지를 해제하고 studio/dress/makeup/snapshot을 개별 조합하는 것이 유리한지”
   비교 분석해야 한다.
4. wedding_hall은 보통 독립적으로 유지되며, package와 별도 비교 대상이 된다.
5. 사용자가 특정 카테고리나 업체를 잠금(lock) 처리하면 변경하면 안 된다.
6. 사용자가 중요도를 높게 준 카테고리는 최대한 유지해야 한다.
7. 계약 완료된 항목은 기본적으로 변경 대상에서 제외한다.

[기능 목표]
사용자가 전체 예산(totalBudget)을 입력하고,
현재 선택된 업체들의 총합(currentTotal)이 예산을 초과할 경우,
AI가 자동으로 분석하여 아래 3가지 추천안을 생성한다.

1. 최소 변경안

- 현재 선택을 최대한 유지하면서
- 가장 적은 변경으로 예산 안에 들어오는 안
- 나오는 문구 예시: “현재 선택을 최대한 유지하면서 초과 예산만 줄이는 방식으로 조정했어요.”

2. 균형 절감안

- 만족도와 비용 절감을 균형 있게 고려한 안
- 나오는 문구 예시: “웨딩홀은 유지하고, 상대적으로 조정 여지가 있는 드레스·스냅샷 중심으로 균형 있게 절감했어요.”

3. 최대 절감안

- 변경 폭이 조금 크더라도
- 예산 절감 효과를 가장 크게 만드는 안
- 나오는 문구 예시: “패키지와 개별 선택을 함께 비교해 가장 큰 절감 효과가 나는 조합으로 재구성했어요.”

[필수 UX]

1. 사용자가 카테고리별 업체를 선택한다.
2. 총액이 예산을 초과하면 경고 배너를 보여준다.
3. “AI 예산 최적화” 버튼을 노출한다.
4. 버튼 클릭 시 분석 패널 또는 모달을 연다.
5. 사용자는 아래를 설정할 수 있어야 한다.
   - 잠금할 업체/카테고리
   - 카테고리 중요도
     - 매우 중요
     - 중요
     - 보통
     - 조정 가능
   - 계약 완료 여부
   - 패키지 유지 선호 여부
     - 패키지 유지 우선
     - 개별 조합도 허용
     - 개별 조합 우선
6. “자동 분석” 버튼 클릭 시 추천안 3개를 생성한다.
7. 각 추천안에는 아래가 포함되어야 한다.
   - 현재 총액
   - 목표 예산
   - 초과 금액
   - 총 절감액
   - 최종 예상 총액
   - 변경된 카테고리 수
   - 변경 전 업체와 변경 후 업체
   - package 유지/해제 여부
   - 추천 이유 설명
   - 스타일 유지도 또는 만족도 추정치

[중요한 추천 로직]
이 기능은 LLM에게 계산을 맡기지 말고,
반드시 deterministic한 계산/추천 로직을 먼저 구현한 뒤
LLM은 설명 생성용으로만 사용하거나,
LLM이 없으면 deterministic fallback 설명을 사용해라.

[추천 알고리즘 설계 요구]
추천 알고리즘은 아래를 반영해야 한다.

1. 먼저 현재 선택 상태를 분석한다.

- totalBudget
- currentTotal
- overflowAmount
- selected vendors
- locked vendors
- contracted vendors
- category priorities
- package preference

2. 변경 가능한 항목만 추린다.

- locked 제외
- contracted 제외
- replaceable=false 제외

3. package 관련 특수 분석을 수행한다.

- 현재 package를 선택한 경우:
  a. package 유지 + 다른 항목 조정
  b. package를 더 저렴한 package로 교체
  c. package를 해제하고 studio/dress/makeup/snapshot 개별 조합으로 재구성
  를 모두 비교한다.
- 현재 개별 선택만 한 경우:
  a. 현재 개별 선택 유지 + 일부 조정
  b. package로 전환하는 경우 더 저렴한지 비교한다.

4. 추천 점수는 단순 최저가가 아니라 아래를 함께 고려한다.

- 절감 효과
- 중요도 패널티
- 스타일 불일치 패널티
- 패키지 선호도 패널티
- 변경 수 패널티
- 계약/잠금 위반 불가

예시:
recommendationScore =
savingsScore

- priorityPenalty
- styleMismatchPenalty
- packagePreferencePenalty
- changeCountPenalty

5. 예산 안에 들어오는 조합을 찾되,
   각 추천안의 성격이 분명히 달라야 한다.

- 최소 변경안: 변경되는 카테고리 수 최소화 우선
- 균형 절감안: 변경 수와 절감액의 균형
- 최대 절감안: 절감액 최대화 우선

[스타일 유사도]
각 업체는 styleTags를 가진다고 가정한다.
예:

- luxury
- romantic
- classic
- minimal
- trendy
- natural
- hotel
- garden

현재 선택된 업체의 styleTags와 대체 업체의 styleTags를 비교해서
유사도가 높은 대체안을 우선 추천해라.

[필요한 타입 설계]
아래 타입들을 포함해 필요한 TypeScript 타입을 모두 설계해라.

- CategoryKey
- Vendor
- PackageVendor
- SelectedVendor
- BudgetAnalysisInput
- BudgetSuggestionPlan
- SuggestionItem
- CategoryPriority
- PackagePreference
- BudgetAnalysisResult
- ReplacementCandidate
- AnalysisExplanation

package vendor의 경우, 포함 카테고리 정보도 가져야 한다.
예:
includedCategories: ("studio" | "dress" | "makeup" | "snapshot")[]

[데이터 예시]
vendor는 대략 아래 필드를 가진다고 가정한다.

- id
- name
- category
- price
- minPrice
- maxPrice
- district
- rating
- styleTags
- vendorTier
- replaceable
- isContracted
- isLocked

package vendor는 추가로:

- includedCategories
- packageLabel
- originalCombinedPrice
- packageDiscountAmount

[selected state 예시]

- totalBudget
- currentTotal
- selectedByCategory
  - wedding_hall
  - studio
  - dress
  - makeup
  - snapshot
  - package
- lockedCategoryKeys
- lockedVendorIds
- contractedVendorIds
- categoryPriorityMap
- packagePreference
- preferredStyleTags

[반드시 구현해야 할 함수]
아래 함수를 포함해 전체 로직을 설계하고 구현해라.

- analyzeBudgetSuggestions(input)
- buildMinimalChangePlan(input)
- buildBalancedSavingsPlan(input)
- buildAggressiveSavingsPlan(input)
- findReplacementCandidates(category, currentVendor, allVendors, options)
- comparePackageVsIndividualOptions(input)
- calculateStyleSimilarity(tagsA, tagsB)
- calculatePlanScore(plan, userPreferences)
- applySuggestionPlan(currentSelection, plan)
- generateDeterministicExplanation(plan, context)

[프론트엔드 UI 요구사항]
아래 UI를 실서비스 수준으로 구현해라.

1. BudgetOverflowBanner

- 예산 초과 시 표시
- 초과 금액 강조
- “AI 예산 최적화” 버튼 포함

2. BudgetOptimizationModal 또는 SidePanel

- 현재 총액 / 예산 / 초과 금액 표시
- 잠금 옵션
- 카테고리 중요도 선택 UI
- 패키지 유지 선호 옵션 UI
- 자동 분석 버튼

3. SuggestionPlanCard

- 추천안 이름
- 총 절감액
- 최종 총액
- 변경 카테고리 수
- package 유지/해제 여부
- 변경 상세 목록
- 추천 이유
- 적용 버튼

4. 적용 후 diff UI

- 변경 전 / 변경 후 표시
- 되돌리기 가능

[예외 처리]
다음 케이스를 반드시 처리해라.

1. 이미 예산 이하인 경우
2. 초과 금액이 너무 커서 추천안 생성이 어려운 경우
3. 잠금/계약된 항목이 많아 조정 불가능한 경우
4. package와 개별 조합 모두 예산 충족 불가능한 경우
5. 대체 가능한 업체가 부족한 경우
6. 추천안이 1개 또는 2개밖에 생성되지 않는 경우에도 graceful하게 처리

[샘플 데이터]

- 웨딩홀, 스튜디오, 드레스, 메이크업, 스냅샷, 패키지 각각 충분한 샘플 데이터를 제공해라.
- 최소 24개 이상 샘플 vendor를 넣어라.
- package는 최소 4개 이상 넣어라.
- 실제 테스트 가능한 수준으로 가격과 styleTags를 구성해라.

[산출물 형식]
반드시 아래 형식으로 응답해라.

1. 파일 구조
2. 새로 추가되는 파일 / 수정되는 파일 구분
3. 각 파일의 전체 코드
4. 코드 중간 생략 금지
5. 바로 붙여넣을 수 있게 완성형으로 작성
6. TODO 남기지 말고 실행 가능한 수준으로 작성

[품질 기준]

- TypeScript 타입 안정성 확보
- 컴포넌트 분리 명확히
- 비즈니스 로직과 UI 분리
- 패키지와 개별 조합 비교 로직 명확히
- 단순 최저가 추천이 아닌 “사용자 만족도 최대 유지 + 예산 초과 해결” 중심
- 실제 웨딩 서비스에서 사용할 수 있을 정도로 설계

이제 위 요구사항을 반영해서
실제로 프로젝트에 붙여넣을 수 있는 수준의
파일 구조와 전체 코드를 생성해라.
