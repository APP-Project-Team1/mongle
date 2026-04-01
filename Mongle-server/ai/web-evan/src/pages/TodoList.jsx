import React, { useState } from 'react';
import { IoAdd, IoCheckmark, IoClose } from 'react-icons/io5';
import Seo from '../components/common/Seo';
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
      <Seo
        title="오늘 할 일 | 몽글 플래너 관리자"
        description="오늘 처리해야 할 업무와 긴급 할 일을 확인하고 바로 추가하세요."
      />

      <div className="page-header flex-row justify-between items-center">
        <h1 className="page-title">오늘 할 일</h1>
        <button className="add-btn" onClick={openModal} type="button" aria-label="할 일 추가">
          <IoAdd size={20} />
          추가
        </button>
      </div>

      <div className="card-box" style={{ padding: '0 20px', paddingBottom: '10px' }}>
        {todos.map((todo, index) => (
          <button
            key={todo.id}
            className={`todo-item ${index === todos.length - 1 ? 'last' : ''}`}
            onClick={() => toggleTodo(todo.id)}
            type="button"
            aria-pressed={todo.done}
            aria-label={`${todo.text} ${todo.done ? '완료됨' : '미완료'}`}
          >
            <div className={`checkbox ${todo.done ? 'checked' : ''}`}>
              {todo.done && <IoCheckmark size={14} color="var(--checkbox-done-border)" />}
            </div>
            <div className="todo-content">
              <p className={`todo-text ${todo.done ? 'done' : ''}`}>{todo.text}</p>
              <p className={`todo-tag ${todo.urgent && !todo.done ? 'urgent' : ''}`}>
                {todo.couple} {todo.urgent && !todo.done ? '· 오늘 마감' : ''}
              </p>
            </div>
            {todo.urgent && !todo.done && <div className="urgent-dot" />}
          </button>
        ))}

        {todos.length === 0 && (
          <div
            className="empty-state"
            style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            오늘 일정이 없습니다
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="todo-modal-title"
          >
            <div className="modal-header">
              <h2 id="todo-modal-title" className="modal-title">
                할 일 추가
              </h2>
              <button
                className="modal-close-btn"
                onClick={closeModal}
                type="button"
                aria-label="모달 닫기"
              >
                <IoClose size={22} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label" htmlFor="todo-text">
                  할 일 내용 *
                </label>
                <input
                  id="todo-text"
                  className="modal-input"
                  type="text"
                  placeholder="예: 청첩장 시안 확인"
                  value={newText}
                  onChange={(event) => setNewText(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="todo-couple">
                  관련 커플
                </label>
                <input
                  id="todo-couple"
                  className="modal-input"
                  type="text"
                  placeholder="예: 박지수 · 김현우"
                  value={newCouple}
                  onChange={(event) => setNewCouple(event.target.value)}
                />
              </div>

              <div className="modal-field modal-check-row">
                <label className="modal-label" style={{ margin: 0 }}>
                  오늘 마감
                </label>
                <button
                  className={`toggle-btn ${newUrgent ? 'on' : ''}`}
                  onClick={() => setNewUrgent((value) => !value)}
                  type="button"
                  aria-pressed={newUrgent}
                  aria-label="오늘 마감 여부"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={closeModal} type="button">
                취소
              </button>
              <button
                className="modal-submit-btn"
                onClick={handleAdd}
                disabled={!newText.trim()}
                type="button"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
