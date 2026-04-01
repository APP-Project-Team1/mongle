import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCheckmark } from 'react-icons/io5';
import { useTodo } from '../../context/TodoContext';

export default function TodoWidget() {
  const navigate = useNavigate();
  const { todos, toggleTodo } = useTodo();

  return (
    <section className="dash-section">
      <div className="section-header">
        <h3 className="section-title">오늘 할 일</h3>
        <button className="section-more" onClick={() => navigate('/todos')}>전체 보기</button>
      </div>
      <div className="card-box">
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
      </div>
    </section>
  );
}