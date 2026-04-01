import React from 'react';
import { IoAlertCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { formatMoney } from '../../data/mockData';
import ProgressBar from '../common/ProgressBar';

export default function BudgetCard({ couple }) {
  const unpaid = couple.total - couple.received;
  const p = Math.round((couple.received / couple.total) * 100);

  return (
    <div className="budget-card">
      <div className="budget-card-header">
        <div className="couple-name">{couple.name}</div>
        {unpaid > 0 ? (
          <div className="unpaid-badge bg-unpaid">
            <IoAlertCircleOutline size={14} /> 미수금 {formatMoney(unpaid)}원
          </div>
        ) : (
          <div className="unpaid-badge bg-paid">
            <IoCheckmarkCircleOutline size={14} /> 수납 완료
          </div>
        )}
      </div>

      <div style={{ margin: '20px 0' }}>
        <ProgressBar percent={p} color={unpaid > 0 ? 'var(--accent-secondary)' : 'var(--stage-4-color)'} height={8} />
      </div>

      <div className="budget-details">
        <div className="detail-row">
          <span className="detail-label">총 예산</span>
          <span className="detail-val">{formatMoney(couple.total)}원</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">기수납액</span>
          <span className="detail-val">{formatMoney(couple.received)}원</span>
        </div>
        {couple.due && (
          <div className="detail-row">
            <span className="detail-label">잔금 기한</span>
            <span className="detail-val">{couple.due}</span>
          </div>
        )}
      </div>

      <div className="vendor-costs">
        <div className="vendor-cost-title">업체 결제 내역</div>
        {couple.vendorCosts.map((vc, idx) => (
          <div key={idx} className="vendor-cost-row">
            <span className="vendor-name-sm">{vc.vendor}</span>
            <span className="vendor-amt">
              {formatMoney(vc.amount)}원
              {vc.paid 
                ? <span className="paid-tag">완료</span> 
                : <span className="unpaid-tag">미지급</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}