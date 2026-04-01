import React from 'react';
import BudgetCard from '../components/budget/BudgetCard';
import Seo from '../components/common/Seo';
import { FINANCE, formatMoney } from '../data/mockData';
import './Budget.css';

const totalRevenue = FINANCE.couples.reduce((sum, couple) => sum + couple.received, 0);
const totalUnpaid = FINANCE.couples.reduce((sum, couple) => sum + (couple.total - couple.received), 0);
const unpaidVendorCnt = FINANCE.couples.reduce(
  (sum, couple) => sum + couple.vendorCosts.filter((vendor) => !vendor.paid).length,
  0,
);

export default function Budget() {
  return (
    <div className="page-container budget-page">
      <Seo
        title="비용 현황 | 몽글 플래너 관리자"
        description="정산 금액, 미수금, 미지급 업체 현황을 커플별로 확인하세요."
      />

      <div className="page-header">
        <h1 className="page-title">비용 현황</h1>
      </div>

      <section className="finance-kpi-row" aria-label="비용 핵심 지표">
        <div className="finance-kpi">
          <span className="finance-kpi-label">전체 수금 총액</span>
          <span className="finance-kpi-val">{formatMoney(totalRevenue)}원</span>
        </div>
        <div className="finance-kpi-div" />
        <div className="finance-kpi">
          <span className="finance-kpi-label">전체 미수금</span>
          <span className="finance-kpi-val" style={{ color: 'var(--accent-secondary)' }}>
            {formatMoney(totalUnpaid)}원
          </span>
        </div>
        <div className="finance-kpi-div" />
        <div className="finance-kpi">
          <span className="finance-kpi-label">전체 미지급 업체</span>
          <span className="finance-kpi-val" style={{ color: 'var(--stage-2-color)' }}>
            {unpaidVendorCnt}건
          </span>
        </div>
      </section>

      <div className="budget-grid">
        {FINANCE.couples.map((couple) => (
          <BudgetCard key={couple.id} couple={couple} />
        ))}
      </div>
    </div>
  );
}
