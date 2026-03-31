import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAlertCircleOutline } from 'react-icons/io5';
import { FINANCE, formatMoney } from '../../data/mockData';
import ProgressBar from '../common/ProgressBar';

export default function FinanceWidget() {
  const navigate = useNavigate();

  const totalRevenue = FINANCE.couples.reduce((s, c) => s + c.received, 0);
  const totalUnpaid = FINANCE.couples.reduce((s, c) => s + (c.total - c.received), 0);
  const unpaidVendorAmt = FINANCE.couples.reduce((s, c) => s + c.vendorCosts.filter((v) => !v.paid).reduce((a, v) => a + v.amount, 0), 0);
  const unpaidVendorCnt = FINANCE.couples.reduce((s, c) => s + c.vendorCosts.filter((v) => !v.paid).length, 0);

  return (
    <section className="dash-section">
      <div className="section-header">
        <h3 className="section-title">비용 현황</h3>
        <button className="section-more" onClick={() => navigate('/budget')}>상세 보기</button>
      </div>
      <div className="finance-kpi-row">
        <div className="finance-kpi">
          <span className="finance-kpi-label">수금 총액</span>
          <span className="finance-kpi-val">{formatMoney(totalRevenue)}원</span>
        </div>
        <div className="finance-kpi-div" />
        <div className="finance-kpi">
          <span className="finance-kpi-label">미수금</span>
          <span className="finance-kpi-val" style={{ color: 'var(--accent-secondary)' }}>{formatMoney(totalUnpaid)}원</span>
        </div>
        <div className="finance-kpi-div" />
        <div className="finance-kpi">
          <span className="finance-kpi-label">미지급 업체</span>
          <span className="finance-kpi-val" style={{ color: 'var(--stage-2-color)' }}>{unpaidVendorCnt}건</span>
        </div>
      </div>

      <div className="finance-list card-box">
        {FINANCE.couples.filter(c => c.received < c.total).map((c, idx, arr) => {
          const unpaid = c.total - c.received;
          const p = Math.round((c.received / c.total) * 100);
          return (
            <div key={c.id} className={`finance-row ${idx === arr.length - 1 ? 'last' : ''}`}>
              <div className="finance-row-top">
                <span className="finance-cname">{c.name}</span>
                <span className="finance-unpaid">-{formatMoney(unpaid)}원</span>
              </div>
              <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                <ProgressBar percent={p} color="var(--accent-primary)" showText={true} />
              </div>
              {c.due && <div className="finance-due">{c.due}까지</div>}
            </div>
          );
        })}
      </div>

      {unpaidVendorCnt > 0 && (
        <div className="vendor-cost-summary">
          <IoAlertCircleOutline size={15} color="var(--stage-2-color)" />
          <span>미지급 업체 {unpaidVendorCnt}건 · 총 {formatMoney(unpaidVendorAmt)}원</span>
        </div>
      )}
    </section>
  );
}