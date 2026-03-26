import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_COUPLES } from '../../data/mockData';
import Avatar from '../common/Avatar';
import ProgressBar from '../common/ProgressBar';

export default function CoupleWidget() {
  const navigate = useNavigate();

  return (
    <section className="dash-section">
      <div className="section-header">
        <h3 className="section-title">임박한 커플</h3>
        <button className="section-more" onClick={() => navigate('/couples')}>전체 보기</button>
      </div>
      <div className="couples-list">
        {DASHBOARD_COUPLES.map((c) => (
          <div key={c.id} className="couple-card" onClick={() => navigate(`/customer/${c.id}`)}>
            <div className="couple-row">
              <Avatar initials={c.initials} bg={c.avatarBg} color={c.avatarColor} size={48} />
              <div className="couple-info">
                <div className="couple-name">{c.name}</div>
                <div className="couple-venue">{c.date} · {c.venue}</div>
              </div>
              <div className="dday-badge" style={{ backgroundColor: c.badgeBg, color: c.badgeColor }}>
                D-{c.dday}
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <ProgressBar percent={c.progress} color={c.barColor} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
