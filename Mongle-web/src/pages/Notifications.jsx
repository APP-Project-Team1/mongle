import React, { useState } from 'react';
import { IoCheckmarkDoneOutline, IoTrashOutline, IoDocumentTextOutline, IoNotificationsOutline, IoChevronForward } from 'react-icons/io5';
import { useNotifications } from '../context/NotificationsContext';
import './Notifications.css';

function iconForType(type) {
  if (type === 'doc') return <IoDocumentTextOutline size={18} color="var(--stage-4-color)" />;
  if (type === 'check') return <IoCheckmarkDoneOutline size={18} color="var(--text-muted)" />;
  return <IoNotificationsOutline size={18} color="var(--stage-2-color)" />;
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();

  return (
    <div className="page-container notif-page">
      <div className="page-header flex-row justify-between items-center" style={{ marginBottom: 16 }}>
        <h2 className="page-title">알림</h2>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllRead}>
            모두 읽음
          </button>
        )}
      </div>

      <div className="notif-list-container">
        {notifications.length === 0 ? (
          <div className="empty-notif">
            <IoNotificationsOutline size={48} color="var(--border-color)" />
            <p>알림이 없습니다</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.some(n => !n.isRead) && (
              <div className="notif-section">
                <div className="notif-section-label">읽지 않은 알림</div>
                {notifications.filter(n => !n.isRead).map(n => (
                  <NotifItem
                    key={n.id}
                    item={{ ...n, icon: iconForType(n.iconType) }}
                    onRead={() => markRead(n.id)}
                    onDelete={() => deleteNotif(n.id)}
                  />
                ))}
              </div>
            )}
            {notifications.some(n => n.isRead) && (
              <div className="notif-section">
                <div className="notif-section-label">읽은 알림</div>
                {notifications.filter(n => n.isRead).map(n => (
                  <NotifItem
                    key={n.id}
                    item={{ ...n, icon: iconForType(n.iconType) }}
                    onDelete={() => deleteNotif(n.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotifItem({ item, onRead, onDelete }) {
  const [selected, setSelected] = useState(false);

  const handleClick = () => {
    if (onRead && !item.isRead) onRead();
    setSelected(!selected);
  };

  return (
    <div className={`notif-item-wrapper ${selected ? 'expanded' : ''}`}>
      <div className="notif-item" onClick={handleClick}>
        <div className="notif-icon-wrap" style={{ backgroundColor: item.iconBg }}>
          {item.icon}
        </div>
        <div className="notif-body">
          <div className="notif-title-row">
            <span className={`notif-title ${!item.isRead ? 'bold' : ''}`}>{item.title}</span>
            {!item.isRead && <span className="unread-dot" />}
          </div>
          <p className="notif-desc">{item.body}</p>
          <span className="notif-time">{item.time}</span>
        </div>
        <IoChevronForward size={16} color="var(--text-light)" />
      </div>

      {selected && (
        <div className="notif-actions">
          <button className="delete-notif-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <IoTrashOutline size={16} color="var(--accent-secondary)" />
            <span>알림 삭제</span>
          </button>
        </div>
      )}
    </div>
  );
}
