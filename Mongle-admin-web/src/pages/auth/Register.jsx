import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirm) { setError('모든 항목을 입력해 주세요.'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다.'); return; }

    setLoading(true);
    const result = register(email, password, name);
    setLoading(false);
    if (result.ok) {
      navigate('/login', { replace: true, state: { registered: true } });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-root">
      <button className="auth-theme-btn" onClick={toggleTheme} title="테마 전환">
        {isDarkMode
          ? <IoSunnyOutline size={20} color="var(--text-muted)" />
          : <IoMoonOutline size={20} color="var(--text-muted)" />}
      </button>

      <div className="auth-card">
        <div className="auth-logo">Mongle</div>
        <p className="auth-tagline">플래너 계정 만들기</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">이름</label>
            <input
              className="auth-input"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">이메일</label>
            <input
              className="auth-input"
              type="email"
              placeholder="example@mongle.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">비밀번호</label>
            <input
              className="auth-input"
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">비밀번호 확인</label>
            <input
              className="auth-input"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <div className="auth-footer">
          <div>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="auth-link">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
