/**
 * PDF Templates (HTML/CSS)
 * Used to generate beautiful wedding documents.
 */
export const PDFTemplates = {
  /**
   * Generates HTML for Budget Summary
   */
  getBudgetSummaryHTML(data) {
    const { 
      projectName, 
      weddingDate, 
      totalBudget, 
      spentAmount, 
      remainingBudget, 
      categories,
      generatedAt 
    } = data;

    const categoryRows = (categories || []).map(cat => `
      <tr>
        <td>${cat.title || '항목'}</td>
        <td style="text-align: right;">${(cat.budget || 0).toLocaleString()}원</td>
        <td style="text-align: right;">${(cat.spent || 0).toLocaleString()}원</td>
        <td style="text-align: right;">${((cat.budget || 0) - (cat.spent || 0)).toLocaleString()}원</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #FF6B6B; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; color: #FF6B6B; margin: 0; }
          .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .summary-card { background: #FDECEC; padding: 15px; border-radius: 8px; text-align: center; }
          .card-label { font-size: 12px; color: #888; margin-bottom: 5px; }
          .card-value { font-size: 18px; font-weight: bold; color: #FF6B6B; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F8F9FA; padding: 12px; border-bottom: 1px solid #DDD; text-align: left; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #EEE; font-size: 14px; }
          .footer { margin-top: 50px; text-align: right; font-size: 12px; color: #AAA; }
          .highlight { font-weight: bold; color: #FF6B6B; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">웨딩 예산 명세서</p>
          <p class="subtitle">${projectName} | 예식일: ${weddingDate}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <p class="card-label">총 예산</p>
            <p class="card-value">${(totalBudget || 0).toLocaleString()}원</p>
          </div>
          <div class="summary-card">
            <p class="card-label">현재 지출</p>
            <p class="card-value">${(spentAmount || 0).toLocaleString()}원</p>
          </div>
          <div class="summary-card">
            <p class="card-label">남은 예산</p>
            <p class="card-value">${(remainingBudget || 0).toLocaleString()}원</p>
          </div>
        </div>

        <p style="font-weight: bold; margin-bottom: 10px;">항목별 지출 현황</p>
        <table>
          <thead>
            <tr>
              <th>카테고리</th>
              <th style="text-align: right;">예산</th>
              <th style="text-align: right;">지출</th>
              <th style="text-align: right;">잔액</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>

        <div class="footer">
          <p>생성일시: ${generatedAt}</p>
          <p>본 문서는 Mongle 앱에서 생성되었습니다.</p>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Generates HTML for Comparison Report
   */
  getComparisonReportHTML(analysisResult) {
    const { items, summary } = analysisResult;
    
    const vendorColumns = (items || []).map(item => `
      <div class="vendor-card">
        <div class="vendor-header">
          <div class="vendor-badge">${(item.realCost || 0) <= (analysisResult.userBudget || 0) ? '예산 내' : '예산 초과'}</div>
          <p class="vendor-name">${item.vendorName || '업체명 없음'}</p>
          <p class="vendor-price">${(item.realCost || 0).toLocaleString()}원</p>
        </div>
        <div class="vendor-section">
          <p class="section-title">주요 포함 항목</p>
          <ul class="item-list">
            ${(item.includedItems || []).map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
        <div class="vendor-section">
          <p class="section-title">주의사항</p>
          <ul class="item-list warning">
            ${(item.excludedItems || []).map(i => `<li>${i}</li>`).join('')}
            ${item.vatIncluded ? '' : '<li>VAT 10% 별도</li>'}
          </ul>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: 'Helvetica', 'Segoe UI', sans-serif; padding: 30px; color: #2D3436; background: #F9FAFB; }
          .header { text-align: center; margin-bottom: 40px; }
          .title { font-size: 24px; font-weight: 800; color: #6C5CE7; }
          .container { display: flex; gap: 20px; justify-content: center; }
          .vendor-card { background: white; border-radius: 12px; padding: 20px; width: 250px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .vendor-header { border-bottom: 1px solid #EEE; padding-bottom: 15px; margin-bottom: 15px; }
          .vendor-name { font-size: 18px; font-weight: bold; margin: 5px 0; }
          .vendor-price { font-size: 20px; font-weight: 800; color: #6C5CE7; }
          .vendor-badge { display: inline-block; padding: 4px 8px; font-size: 10px; border-radius: 4px; background: #E1FAEE; color: #27AE60; font-weight: bold; }
          .section-title { font-size: 13px; font-weight: bold; color: #636E72; margin-top: 15px; }
          .item-list { padding-left: 18px; margin: 5px 0; font-size: 12px; color: #2D3436; }
          .item-list.warning { color: #D63031; }
          .recommendation { margin-top: 40px; background: #6C5CE7; color: white; padding: 20px; border-radius: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">웨딩 업체 견적 비교 리포트</p>
        </div>
        <div class="container">
          ${vendorColumns}
        </div>
        <div class="recommendation">
          <h3>Mongle's Recommendation</h3>
          <p>종합 분석 결과, <strong>${(summary && summary.bestValue) ? summary.bestValue.vendorName : '분석 진행 중'}</strong> 업체가 구성 대비 가장 합리적인 가격을 제안하고 있습니다.</p>
        </div>
      </body>
      </html>
    `;
  }
};
