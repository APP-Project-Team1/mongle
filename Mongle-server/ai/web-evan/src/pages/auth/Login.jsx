import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMoonOutline, IoSunnyOutline, IoFlashOutline } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, devLogin } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('이메일과 비밀번호를 입력해 주세요.'); return; }
    setLoading(true);
    const result = login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
  };

  const handleDevLogin = () => {
    devLogin();
    navigate('/', { replace: true });
  };

  return (
    <div className="auth-root">
      {/* Theme toggle */}
      <button className="auth-theme-btn" onClick={toggleTheme} title="테마 전환">
        {isDarkMode
          ? <IoSunnyOutline size={20} color="var(--text-muted)" />
          : <IoMoonOutline size={20} color="var(--text-muted)" />}
      </button>

      <div className="auth-card">
        <div className="auth-logo">Mongle</div>
        <p className="auth-tagline">웨딩 플래너 관리 시스템</p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-footer">
          <div>
            <Link to="/forgot-password" className="auth-link">비밀번호를 잊으셨나요?</Link>
          </div>
          <div>
            계정이 없으신가요?{' '}
            <Link to="/register" className="auth-link">회원가입</Link>
          </div>
        </div>
      </div>

      {/* Dev quick-login button */}
      <button className="dev-login-btn" onClick={handleDevLogin} title="개발용 임시 로그인">
        <IoFlashOutline size={16} />
        임시 로그인
      </button>
    </div>
  );
}