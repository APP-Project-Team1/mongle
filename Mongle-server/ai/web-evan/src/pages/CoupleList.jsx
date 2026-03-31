import React, { useState } from 'react';
import { IoSearchOutline, IoCloseCircle, IoAdd, IoSwapVerticalOutline } from 'react-icons/io5';
import { INITIAL_COUPLES, STAGE_STYLE, STAGE_FILTERS, calcDday } from '../data/mockData';
import CoupleCardBig from '../components/couples/CoupleCardBig';
import './CoupleList.css';

export default function CoupleList() {
  const [couples] = useState(INITIAL_COUPLES);
  const [searchText, setSearchText] = useState('');
  const [activeStage, setActiveStage] = useState(0);

  const filtered = couples.filter((c) => {
    const ms = searchText.trim() === '' || c.name.replace(/\s/g, '').includes(searchText.replace(/\s/g, '')) || c.venue.includes(searchText);
    const mst = activeStage === 0 ? true : c.stage === STAGE_FILTERS[activeStage];
    return ms && mst;
  });

  const sorted = [...filtered].sort((a, b) => calcDday(a.date) - calcDday(b.date));

  const getAvatarStyle = (idx) => ({
    backgroundColor: `var(--avatar-${idx % 6}-bg)`,
    color: `var(--avatar-${idx % 6}-color)`,
  });

  const getInitials = (name) => name.split('·').map(s => s.trim()[0] ?? '').join('').slice(0, 2);

  return (
    <div className="page-container couple-page">
      <div className="couple-header">
        <h2 className="page-title">커플 목록</h2>
        <button className="add-btn">
          <IoAdd size={20} />
          추가
        </button>
      </div>

      <div className="search-wrap">
        <div className="search-box">
          <IoSearchOutline size={18} color="var(--text-light)" />
          <input
            type="text"
            placeholder="커플 이름, 웨딩홀 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} className="clear-btn">
              <IoCloseCircle size={18} color="var(--text-light)" />
            </button>
          )}
        </div>
      </div>

      <div className="filter-scroll scroll-hide">
        {STAGE_FILTERS.map((s, i) => (
          <button
            key={s}
            className={`filter-chip ${i === activeStage ? 'active' : ''}`}
            onClick={() => setActiveStage(i)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="sort-row">
        <IoSwapVerticalOutline size={16} color="var(--text-muted)" />
        <span className="sort-text">D-day 임박순</span>
        <span className="result-count">{sorted.length}쌍</span>
      </div>

      <div className="couple-grid">
        {sorted.length === 0 ? (
          <div className="empty-state">검색 결과가 없어요</div>
        ) : (
          sorted.map(c => {
            const st = STAGE_STYLE[c.stage] || STAGE_STYLE['초기 상담'];
            const dday = calcDday(c.date);
            return (
              <CoupleCardBig
                key={c.id}
                couple={c}
                avatarStyle={getAvatarStyle(c.avatarIdx)}
                stageStyle={st}
                dday={dday}
                getInitials={getInitials}
              />
            );
          })
        )}
      </div>
    </div>
  );
}