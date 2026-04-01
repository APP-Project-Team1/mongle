import React, { useState } from 'react';
import {
  IoAdd,
  IoCloseCircle,
  IoSearchOutline,
  IoSwapVerticalOutline,
} from 'react-icons/io5';
import Seo from '../components/common/Seo';
import CoupleCardBig from '../components/couples/CoupleCardBig';
import { calcDday, INITIAL_COUPLES, STAGE_FILTERS, STAGE_STYLE } from '../data/mockData';
import './CoupleList.css';

export default function CoupleList() {
  const [couples] = useState(INITIAL_COUPLES);
  const [searchText, setSearchText] = useState('');
  const [activeStage, setActiveStage] = useState(0);

  const filtered = couples.filter((c) => {
    const normalizedQuery = searchText.replace(/\s/g, '');
    const matchesSearch =
      normalizedQuery === '' ||
      c.name.replace(/\s/g, '').includes(normalizedQuery) ||
      c.venue.includes(searchText);
    const matchesStage = activeStage === 0 ? true : c.stage === STAGE_FILTERS[activeStage];

    return matchesSearch && matchesStage;
  });

  const sorted = [...filtered].sort((a, b) => calcDday(a.date) - calcDday(b.date));

  const getAvatarStyle = (idx) => ({
    backgroundColor: `var(--avatar-${idx % 6}-bg)`,
    color: `var(--avatar-${idx % 6}-color)`,
  });

  const getInitials = (name) =>
    name
      .split('·')
      .map((segment) => segment.trim()[0] ?? '')
      .join('')
      .slice(0, 2);

  return (
    <div className="page-container couple-page">
      <Seo
        title="커플 목록 | 몽글 플래너 관리자"
        description="담당 커플 목록을 검색하고 웨딩 진행 단계와 D-day를 빠르게 확인하세요."
      />

      <div className="couple-header">
        <h1 className="page-title">커플 목록</h1>
        <button className="add-btn" type="button" aria-label="커플 추가">
          <IoAdd size={20} />
          추가
        </button>
      </div>

      <div className="search-wrap">
        <div className="search-box">
          <IoSearchOutline size={18} color="var(--text-light)" />
          <input
            id="couple-search"
            type="text"
            placeholder="커플 이름, 웨딩홀 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="커플 검색"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="clear-btn"
              type="button"
              aria-label="검색어 지우기"
            >
              <IoCloseCircle size={18} color="var(--text-light)" />
            </button>
          )}
        </div>
      </div>

      <div className="filter-scroll scroll-hide">
        {STAGE_FILTERS.map((stage, index) => (
          <button
            key={stage}
            className={`filter-chip ${index === activeStage ? 'active' : ''}`}
            onClick={() => setActiveStage(index)}
            type="button"
            aria-pressed={index === activeStage}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="sort-row">
        <IoSwapVerticalOutline size={16} color="var(--text-muted)" />
        <span className="sort-text">D-day 임박순</span>
        <span className="result-count">{sorted.length}팀</span>
      </div>

      <div className="couple-grid">
        {sorted.length === 0 ? (
          <div className="empty-state">검색 결과가 없습니다.</div>
        ) : (
          sorted.map((couple) => {
            const stageStyle = STAGE_STYLE[couple.stage] || STAGE_STYLE['초기 상담'];

            return (
              <CoupleCardBig
                key={couple.id}
                couple={couple}
                avatarStyle={getAvatarStyle(couple.avatarIdx)}
                stageStyle={stageStyle}
                dday={calcDday(couple.date)}
                getInitials={getInitials}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
