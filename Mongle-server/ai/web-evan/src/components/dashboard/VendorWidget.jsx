import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDORS, VENDOR_CATEGORIES } from '../../data/mockData';

export default function VendorWidget() {
  const navigate = useNavigate();

  return (
    <section className="dash-section">
      <div className="section-header">
        <h3 className="section-title">협력 업체 현황</h3>
        <button className="section-more" onClick={() => navigate('/vendors')}>전체 보기</button>
      </div>
      <div className="vendor-grid">
        {VENDOR_CATEGORIES.map(cat => {
          const items = VENDORS.filter(v => v.type === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="vendor-cat-block">
              <div className="vendor-cat-title">{cat}</div>
              {items.map((v, idx) => (
                <div key={v.id} className={`vendor-row ${idx === items.length - 1 ? 'last' : ''}`}>
                  <div className="vendor-name">{v.name}</div>
                  <div className="vendor-status" style={{ color: v.statusColor }}>{v.status}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}