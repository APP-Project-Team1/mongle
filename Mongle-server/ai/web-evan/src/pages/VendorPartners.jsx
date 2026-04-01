import React from 'react';
import Seo from '../components/common/Seo';
import './VendorPartners.css';

const VENDORS = [
  { id: '1', type: '스튜디오', name: '엘라 스튜디오', status: '계약 완료', statusColor: 'var(--stage-4-color)' },
  { id: '2', type: '드레스', name: '루블르 웨딩', status: '미팅 조율', statusColor: 'var(--stage-2-color)' },
  { id: '3', type: '메이크업', name: '뷰티 스튜디오K', status: '계약 완료', statusColor: 'var(--stage-4-color)' },
  { id: '4', type: '웨딩홀', name: '라온채 청담', status: '대금 미납', statusColor: 'var(--stage-1-color)' },
  { id: '5', type: '허니문', name: '세이 여행사', status: '견적 협의', statusColor: 'var(--stage-3-color)' },
  { id: '6', type: '청첩장', name: '페이퍼룸', status: '발주 완료', statusColor: 'var(--stage-4-color)' },
];

const VENDOR_CATEGORIES = ['스튜디오', '드레스', '메이크업', '웨딩홀', '허니문', '청첩장', '영상/스냅'];

export default function VendorPartners() {
  return (
    <div className="page-container vendor-page">
      <Seo
        title="협력 업체 현황 | 몽글 플래너 관리자"
        description="카테고리별 협력 업체 진행 상태를 빠르게 파악하세요."
      />

      <div className="page-header">
        <h1 className="page-title">협력 업체 현황</h1>
      </div>

      <div className="vendor-grid-large">
        {VENDOR_CATEGORIES.map((category) => {
          const items = VENDORS.filter((vendor) => vendor.type === category);
          if (items.length === 0) return null;

          return (
            <section key={category} className="vendor-box" aria-labelledby={`vendor-category-${category}`}>
              <h2 id={`vendor-category-${category}`} className="vendor-cat-heading">
                {category}
              </h2>
              <div className="vendor-list">
                {items.map((vendor, index) => (
                  <div
                    key={vendor.id}
                    className={`vendor-list-item ${index === items.length - 1 ? 'last' : ''}`}
                  >
                    <span className="vendor-name-lg">{vendor.name}</span>
                    <span className="vendor-status-lg" style={{ color: vendor.statusColor }}>
                      {vendor.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
