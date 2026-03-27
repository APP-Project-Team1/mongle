import React from 'react';
import { FINANCE, formatMoney } from '../data/mockData';
import BudgetCard from '../components/budget/BudgetCard';
import './Budget.css';

const totalRevenue = FINANCE.couples.reduce((s, c) => s + c.received, 0);
const totalUnpaid = FINANCE.couples.reduce((s, c) => s + (c.total - c.received), 0);
const unpaidVendorCnt = FINANCE.couples.reduce((s, c) => s + c.vendorCosts.filter(v => !v.paid).length, 0);

export default function Budget() {
  return (
    <div className="page-container budget-page">
      <div className="page-header">
        <h2 className="page-title">비용 현황</h2>
      </div>

      <div className="finance-kpi-row">
        <div className="finance-kpi">
          <span className="finance-kpi-label">전체 수금 총액</span>
          <span className="finance-kpi-val">{formatMoney(totalRevenue)}원</span>
        </div>
        <div className="finance-kpi-div" />
        <div className="finance-kpi">
          <span className="finance-kpi-label">전체 미수금</span>
          <span className="finance-kpi-val" style={{ color: 'var(--accent-secondary)' }}>{formatMoney(totalUnpaid)}원</span>
        </div>
        <div className="finance-kpi-div" />
        <div className="finance-kpi">
          <span className="finance-kpi-label">전체 미지급 업체</span>
          <span className="finance-kpi-val" style={{ color: 'var(--stage-2-color)' }}>{unpaidVendorCnt}건</span>
        </div>
      </div>

      <div className="budget-grid">
        {FINANCE.couples.map(c => (
          <BudgetCard key={c.id} couple={c} />
        ))}
      </div>
    </div>
  );
}
