import React, { useState } from 'react';
import { IoCheckmark, IoAdd, IoClose } from 'react-icons/io5';
import { useTodo } from '../context/TodoContext';
import './TodoList.css';

export default function TodoList() {
  const { todos, toggleTodo, addTodo } = useTodo();
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCouple, setNewCouple] = useState('');
  const [newUrgent, setNewUrgent] = useState(false);



  const openModal = () => {
    setNewText('');
    setNewCouple('');
    setNewUrgent(false);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleAdd = () => {
    if (!newText.trim()) return;
    addTodo({ text: newText.trim(), couple: newCouple.trim(), urgent: newUrgent });
    closeModal();
  };

  return (
    <div className="page-container todo-page">
      <div className="page-header flex-row justify-between items-center">
        <h2 className="page-title">오늘 할 일</h2>
        <button className="add-btn" onClick={openModal}>
          <IoAdd size={20} />
          추가
        </button>
      </div>

      <div className="card-box" style={{ padding: '0 20px', paddingBottom: '10px' }}>
        {todos.map((t, idx) => (
          <div key={t.id} className={`todo-item ${idx === todos.length - 1 ? 'last' : ''}`} onClick={() => toggleTodo(t.id)}>
            <div className={`checkbox ${t.done ? 'checked' : ''}`}>
              {t.done && <IoCheckmark size={14} color="var(--checkbox-done-border)" />}
            </div>
            <div className="todo-content">
              <p className={`todo-text ${t.done ? 'done' : ''}`}>{t.text}</p>
              <p className={`todo-tag ${t.urgent && !t.done ? 'urgent' : ''}`}>
                {t.couple} {t.urgent && !t.done ? '· 오늘 마감' : ''}
              </p>
            </div>
            {t.urgent && !t.done && <div className="urgent-dot" />}
          </div>
        ))}
        {todos.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            할 일이 없습니다
          </div>
        )}
      </div>

      {/* Add Todo Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">할 일 추가</h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <IoClose size={22} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">할 일 내용 *</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="예: 청첩장 시안 확인"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">관련 커플</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="예: 박지수·이현우"
                  value={newCouple}
                  onChange={e => setNewCouple(e.target.value)}
                />
              </div>

              <div className="modal-field modal-check-row">
                <label className="modal-label" style={{ margin: 0 }}>오늘 마감</label>
                <button
                  className={`toggle-btn ${newUrgent ? 'on' : ''}`}
                  onClick={() => setNewUrgent(v => !v)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={closeModal}>취소</button>
              <button className="modal-submit-btn" onClick={handleAdd} disabled={!newText.trim()}>
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}