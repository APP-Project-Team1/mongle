import React from 'react';
import './VendorPartners.css';

const VENDORS = [
  { id: '1', type: '스튜디오', name: '일다스튜디오', status: '계약 완료', statusColor: 'var(--stage-4-color)' },
  { id: '2', type: '드레스', name: '르블랑 웨딩', status: '피팅 조율', statusColor: 'var(--stage-2-color)' },
  { id: '3', type: '메이크업', name: '뷰티스튜디오K', status: '계약 완료', statusColor: 'var(--stage-4-color)' },
  { id: '4', type: '웨딩홀', name: '더채플 청담', status: '잔금 미납', statusColor: 'var(--stage-1-color)' },
  { id: '5', type: '허니문', name: '제이여행사', status: '견적 협의', statusColor: 'var(--stage-3-color)' },
  { id: '6', type: '청첩장', name: '페이퍼가든', status: '발주 완료', statusColor: 'var(--stage-4-color)' },
];

const VENDOR_CATEGORIES = ['스튜디오', '드레스', '메이크업', '웨딩홀', '허니문', '청첩장', '영상·스냅'];

export default function VendorPartners() {
  return (
    <div className="page-container vendor-page">
      <div className="page-header">
        <h2 className="page-title">협력 업체 현황</h2>
      </div>

      <div className="vendor-grid-large">
        {VENDOR_CATEGORIES.map(category => {
          const items = VENDORS.filter(v => v.type === category);
          if (items.length === 0) return null;
          return (
            <div key={category} className="vendor-box">
              <h3 className="vendor-cat-heading">{category}</h3>
              <div className="vendor-list">
                {items.map((v, idx) => (
                  <div key={v.id} className={`vendor-list-item ${idx === items.length - 1 ? 'last' : ''}`}>
                    <span className="vendor-name-lg">{v.name}</span>
                    <span className="vendor-status-lg" style={{ color: v.statusColor }}>{v.status}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
