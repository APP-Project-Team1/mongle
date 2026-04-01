import React from 'react';
import { IoCallOutline, IoChevronForward } from 'react-icons/io5';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';

export default function CoupleCardBig({ couple, avatarStyle, stageStyle, dday, getInitials }) {
  return (
    <button className="couple-card-big" type="button" aria-label={`${couple.name} 상세 보기`}>
      <div className="card-top">
        <Avatar
          initials={getInitials(couple.name)}
          bg={avatarStyle.backgroundColor}
          color={avatarStyle.color}
          size={48}
        />
        <div className="info">
          <div className="name-row">
            <span className="name">{couple.name}</span>
            <Badge
              text={dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day' : '완료'}
              bg={stageStyle.badgeBg}
              color={stageStyle.badgeColor}
            />
          </div>
          <div className="date">{couple.date}</div>
          <div className="venue">{couple.venue}</div>
        </div>
      </div>

      <div className="card-mid">
        <span
          className="stage-pill"
          style={{ backgroundColor: stageStyle.stageBg, color: stageStyle.stageColor }}
        >
          {couple.stage}
        </span>
      </div>

      <div style={{ marginTop: '16px', marginBottom: '8px' }}>
        <ProgressBar percent={couple.progress} color={stageStyle.barColor} height={8} />
      </div>

      <div className="card-bottom">
        <IoCallOutline size={14} color="var(--text-light)" />
        <span className="phone">{couple.phone || '연락처 없음'}</span>
        <IoChevronForward size={16} color="var(--border-color)" style={{ marginLeft: 'auto' }} />
      </div>
    </button>
  );
}
