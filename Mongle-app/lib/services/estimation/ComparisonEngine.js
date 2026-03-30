/**
 * Comparison Engine
 * Logic for analyzing multiple estimates and providing insights.
 */
export const ComparisonEngine = {
  /**
   * Analyzes list of estimates based on user budget.
   * @param {EstimateItem[]} estimates 
   * @param {number} userBudget 
   */
  analyze(estimates, userBudget) {
    if (!estimates || estimates.length === 0) return null;

    // 1. Calculate Estimated Real Cost (Total + Options + Hidden - Discount)
    const processedItems = estimates.map((item, index) => {
      // Default missing values to 0 or appropriate types
      const totalPrice = Number(item.totalPrice) || 0;
      const optionsPrice = Number(item.optionsPrice) || 0;
      const discountPrice = Number(item.discountPrice) || 0;
      const vatIncluded = !!item.vatIncluded;
      const includedItems = Array.isArray(item.includedItems) ? item.includedItems : [];
      const excludedItems = Array.isArray(item.excludedItems) ? item.excludedItems : [];
      const refundPolicy = item.refundPolicy || '정보 없음';

      const guaranteedCapacity = Number(item.guaranteedCapacity) || 0;
      const minCapacity = Number(item.minCapacity) || 0;
      const capacity = Number(item.capacity) || 0;
      const foodPricePerPerson = Number(item.foodPricePerPerson) || 0;
      const totalFoodPrice = Number(item.totalFoodPrice) || 0;
      const rentalFee = Number(item.rentalFee) || 0;
      const decorationPrice = Number(item.decorationPrice) || 0;
      const serviceChargePercent = Number(item.serviceChargePercent) || 0;
      const vatPercent = Number(item.vatPercent) || 10;
      const deposit = Number(item.deposit) || 0;
      const balance = Number(item.balance) || 0;

      const safeItem = {
        ...item,
        totalPrice,
        optionsPrice,
        discountPrice,
        vatIncluded,
        includedItems,
        excludedItems,
        refundPolicy,
        guaranteedCapacity,
        minCapacity,
        capacity,
        foodPricePerPerson,
        totalFoodPrice,
        rentalFee,
        decorationPrice,
        serviceChargePercent,
        vatPercent,
        deposit,
        balance,
      };

      const vatRate = vatPercent / 100;
      const realCost = totalPrice + optionsPrice - discountPrice + (vatIncluded ? 0 : totalPrice * vatRate);
      
      return {
        ...safeItem,
        id: `est-${index}-${Date.now()}`,
        realCost,
        budgetFit: userBudget ? (userBudget - realCost) : 0,
        riskScore: this.calculateRiskScore(safeItem),
        completenessScore: this.calculateCompletenessScore(safeItem),
        valueScore: this.calculateValueScore(safeItem, realCost)
      };
    });

    // 2. Identify Highlights
    const sortedByPrice = [...processedItems].sort((a, b) => a.realCost - b.realCost);
    const sortedByValue = [...processedItems].sort((a, b) => b.valueScore - a.valueScore);
    const sortedByRisk = [...processedItems].sort((a, b) => b.riskScore - a.riskScore);

    return {
      items: processedItems,
      userBudget,
      summary: {
        cheapest: sortedByPrice[0],
        bestValue: sortedByValue[0],
        highestRisk: sortedByRisk[0],
        budgetStatus: userBudget ? (sortedByPrice[0].realCost <= userBudget ? 'OK' : 'EXCEED') : 'NONE'
      },
      insights: processedItems.map(item => ({
        id: item.id,
        vendorName: item.vendorName,
        pros: this.getPros(item),
        cons: this.getCons(item),
        questions: this.getQuestions(item)
      }))
    };
  },

  calculateRiskScore(item) {
    let score = 0;
    if (!item.vatIncluded) score += 30;
    if (item.excludedItems.some(ex => ex.includes('추가') || ex.includes('별도'))) score += 20;
    if (item.refundPolicy.includes('불가') || item.refundPolicy.includes('어려움')) score += 20;
    if (item.optionsPrice > item.totalPrice * 0.2) score += 15;
    if (item.remarks.includes('상담 후 결정')) score += 10;
    return Math.min(score, 100);
  },

  calculateCompletenessScore(item) {
    let score = 0;
    // 포함 항목 수 (웨딩홀·스드메 공통)
    if (item.includedItems.length >= 3) score += 20;
    if (item.includedItems.length >= 6) score += 20;
    if (item.includedItems.length >= 10) score += 10;
    // 가격 투명성
    if (item.vatIncluded) score += 15;
    if (item.deposit > 0) score += 10;
    if (item.discountPrice > 0) score += 10;
    // 상세 정보 제공 여부
    if (item.rentalFee > 0) score += 5;
    if (item.foodPricePerPerson > 0) score += 5;
    if (item.guaranteedCapacity > 0) score += 5;
    return Math.min(score, 100);
  },

  calculateValueScore(item, realCost) {
    if (!realCost || realCost <= 0) return 0;
    // 가성비 = 가격이 낮을수록 유리 (기본 점수)
    // 포함 항목·VAT 포함·할인은 최대 8% 보너스로 제한 → 10% 이상 가격차는 극복 불가
    const baseScore = (1 / realCost) * 1e12;
    const includedBonus = Math.min(item.includedItems.length * 0.005, 0.04); // max 4%
    const vatBonus = item.vatIncluded ? 0.02 : 0;                            // 2%
    const discountBonus = item.discountPrice > 0 ? 0.01 : 0;                 // 1%
    const depositBonus = item.deposit > 0 ? 0.01 : 0;                        // 1%
    const totalBonus = Math.min(includedBonus + vatBonus + discountBonus + depositBonus, 0.08);
    return Math.round(baseScore * (1 + totalBonus));
  },

  getPros(item) {
    const pros = [];
    if (item.vatIncluded) pros.push("부가세 포함 견적 (실제 납부액 투명)");
    if (item.discountPrice > 0) pros.push(`할인 혜택 적용 (${(item.discountPrice).toLocaleString()}원 절감)`);
    if (item.includedItems.length >= 10) pros.push("기본 포함 항목이 매우 풍부함");
    else if (item.includedItems.length >= 6) pros.push("기본 포함 항목이 다양함");
    if (item.rentalFee === 0 && item.category === '웨딩홀') pros.push("대관료 별도 없음 (패키지 포함)");
    if (item.decorationPrice > 0 && item.includedItems.some(i => i.includes('데코') || i.includes('꽃'))) pros.push("데코레이션 기본 포함");
    if (item.refundPolicy && item.refundPolicy.includes('100%')) pros.push("환불 규정이 소비자에게 유리");
    if (item.serviceChargePercent === 0) pros.push("봉사료 없음");
    if (pros.length === 0) pros.push("표준적인 구성");
    return pros.slice(0, 4);
  },

  getCons(item) {
    const cons = [];
    if (!item.vatIncluded) cons.push(`부가세 ${item.vatPercent || 10}% 별도 — 실제 납부액 더 높음`);
    if (item.serviceChargePercent > 0) cons.push(`봉사료 ${item.serviceChargePercent}% 별도 부과`);
    if (item.optionsPrice > item.totalPrice * 0.15) cons.push(`추가 옵션 비용 높음 (${item.optionsPrice.toLocaleString()}원)`);
    if (item.excludedItems.length > 2) cons.push(`불포함 항목 다수 (${item.excludedItems.length}건) — 추가 비용 발생 가능`);
    if (item.refundPolicy && item.refundPolicy.includes('불가')) cons.push("취소 시 위약금 리스크 높음");
    if (!item.rawFilesIncluded && item.category === '스튜디오') cons.push("원본 파일 별도 구매 필요");
    if (item.guaranteedCapacity > 0 && item.capacity > 0 && item.guaranteedCapacity / item.capacity > 0.8) cons.push("보증인원이 수용인원 대비 높아 비용 부담 있음");
    if (cons.length === 0) cons.push("특이사항 없음");
    return cons.slice(0, 4);
  },

  getQuestions(item) {
    const questions = [];
    if (!item.vatIncluded) questions.push("카드 결제 시 현금가와 동일한지 확인");
    if (item.serviceChargePercent > 0) questions.push(`봉사료 ${item.serviceChargePercent}% 면제 협의 가능 여부`);
    if (item.guaranteedCapacity > 0) questions.push(`보증인원(${item.guaranteedCapacity}명) 하향 조정 가능 시점`);
    else questions.push("보증인원 및 변경 가능한 최소 시점 확인");
    if (item.excludedItems.length > 0) questions.push(`불포함 항목(${item.excludedItems[0]}) 별도 비용 구체적 확인`);
    questions.push("계약 후 메뉴·데코 변경 가능 범위 확인");
    return questions.slice(0, 4);
  }
};
