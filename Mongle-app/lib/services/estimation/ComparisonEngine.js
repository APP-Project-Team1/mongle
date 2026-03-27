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
    const processedItems = estimates.map(item => {
      const realCost = item.totalPrice + item.optionsPrice - item.discountPrice + (item.vatIncluded ? 0 : item.totalPrice * 0.1);
      
      return {
        ...item,
        realCost,
        budgetFit: userBudget ? (userBudget - realCost) : 0,
        riskScore: this.calculateRiskScore(item),
        completenessScore: this.calculateCompletenessScore(item),
        valueScore: this.calculateValueScore(item, realCost)
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
    if (item.includedItems.length > 3) score += 40;
    if (item.rawFilesIncluded) score += 20;
    if (item.retouchedFilesIncluded) score += 20;
    if (item.duration) score += 20;
    return score;
  },

  calculateValueScore(item, realCost) {
    // Basic value calculation: Completeness / Price relative to average
    const completeness = this.calculateCompletenessScore(item);
    return Math.round((completeness * 1000000) / realCost);
  },

  getPros(item) {
    const pros = [];
    if (item.vatIncluded) pros.push("VAT 포함 견적 (투명성 높음)");
    if (item.discountPrice > 0) pros.push(`상당한 할인 혜택 (${item.discountPrice.toLocaleString()}원)`);
    if (item.includedItems.length > 5) pros.push("기본 포함 품목이 매우 다양함");
    if (item.rawFilesIncluded) pros.push("원본 데이터 기본 제공");
    if (item.refundPolicy.includes('100%')) pros.push("환불 규정이 소비자에게 유리");
    
    // Default fallback
    if (pros.length === 0) pros.push("표준적인 구성");
    return pros.slice(0, 3);
  },

  getCons(item) {
    const cons = [];
    if (!item.vatIncluded) cons.push("VAT 10% 별도 결제 필요");
    if (item.optionsPrice > 0) cons.push("추가 옵션 비용 발생 가능성 높음");
    if (item.excludedItems.length > 2) cons.push("주요 항목 중 불포함된 사항이 있음");
    if (!item.rawFilesIncluded && item.category === '스튜디오') cons.push("원본 파일 별도 구매 필요");
    if (item.refundPolicy.includes('불가')) cons.push("예약 취소 시 위약금 리스크");
    
    if (cons.length === 0) cons.push("특이사항 없음");
    return cons.slice(0, 3);
  },

  getQuestions(item) {
    const questions = [];
    if (!item.vatIncluded) questions.push("카드/현금가 동일 여부 확인");
    if (item.excludedItems.length > 0) questions.push(`${item.excludedItems[0]} 비용 구체적 확인`);
    questions.push("보증인원 변경 가능한 최소 시점");
    questions.push("당일 계약 추가 혜택 유효 기간");
    return questions.slice(0, 3);
  }
};
