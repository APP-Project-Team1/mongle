import React, { useState } from 'react';
import {
  IoCheckmarkDoneOutline,
  IoChevronForward,
  IoDocumentTextOutline,
  IoNotificationsOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import Seo from '../components/common/Seo';
import { useNotifications } from '../context/NotificationsContext';
import './Notifications.css';

function iconForType(type) {
  if (type === 'doc') {
    return <IoDocumentTextOutline size={18} color="var(--stage-4-color)" />;
  }

  if (type === 'check') {
    return <IoCheckmarkDoneOutline size={18} color="var(--text-muted)" />;
  }

  return <IoNotificationsOutline size={18} color="var(--stage-2-color)" />;
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();

  return (
    <div className="page-container notif-page">
      <Seo
        title="알림 | 몽글 플래너 관리자"
        description="읽지 않은 알림과 지난 알림을 구분해 확인하고 정리하세요."
      />

      <div className="page-header flex-row justify-between items-center" style={{ marginBottom: 16 }}>
        <h1 className="page-title">알림</h1>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllRead} type="button">
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
            {notifications.some((notification) => !notification.isRead) && (
              <section className="notif-section" aria-labelledby="unread-notifications">
                <h2 id="unread-notifications" className="notif-section-label">
                  읽지 않은 알림
                </h2>
                {notifications
                  .filter((notification) => !notification.isRead)
                  .map((notification) => (
                    <NotifItem
                      key={notification.id}
                      item={{ ...notification, icon: iconForType(notification.iconType) }}
                      onRead={() => markRead(notification.id)}
                      onDelete={() => deleteNotif(notification.id)}
                    />
                  ))}
              </section>
            )}

            {notifications.some((notification) => notification.isRead) && (
              <section className="notif-section" aria-labelledby="read-notifications">
                <h2 id="read-notifications" className="notif-section-label">
                  읽은 알림
                </h2>
                {notifications
                  .filter((notification) => notification.isRead)
                  .map((notification) => (
                    <NotifItem
                      key={notification.id}
                      item={{ ...notification, icon: iconForType(notification.iconType) }}
                      onDelete={() => deleteNotif(notification.id)}
                    />
                  ))}
              </section>
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
    if (onRead && !item.isRead) {
      onRead();
    }

    setSelected((value) => !value);
  };

  return (
    <div className={`notif-item-wrapper ${selected ? 'expanded' : ''}`}>
      <button
        className="notif-item"
        onClick={handleClick}
        type="button"
        aria-expanded={selected}
        aria-label={`${item.title} 알림 ${item.isRead ? '읽음' : '읽지 않음'}`}
      >
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
      </button>

      {selected && (
        <div className="notif-actions">
          <button
            className="delete-notif-btn"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            type="button"
          >
            <IoTrashOutline size={16} color="var(--accent-secondary)" />
            <span>알림 삭제</span>
          </button>
        </div>
      )}
    </div>
  );
}
