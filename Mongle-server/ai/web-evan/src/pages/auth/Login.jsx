import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoFlashOutline, IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import Seo from '../../components/common/Seo';
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

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
      <Seo
        title="로그인 | 몽글 플래너 관리자"
        description="몽글 플래너 관리자 웹에 로그인하여 일정, 예산, 알림과 협력 업체를 관리하세요."
      />

      <button
        className="auth-theme-btn"
        onClick={toggleTheme}
        aria-label="테마 전환"
        type="button"
      >
        {isDarkMode ? (
          <IoSunnyOutline size={20} color="var(--text-muted)" />
        ) : (
          <IoMoonOutline size={20} color="var(--text-muted)" />
        )}
      </button>

      <main className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title" className="auth-logo">
          Mongle
        </h1>
        <p className="auth-tagline">웨딩 플래너 관리 시스템</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              이메일
            </label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              placeholder="example@mongle.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              비밀번호
            </label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              placeholder="비밀번호를 입력해 주세요"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
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
            <Link to="/forgot-password" className="auth-link">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <div>
            계정이 없으신가요?{' '}
            <Link to="/register" className="auth-link">
              회원가입
            </Link>
          </div>
        </div>
      </main>

      <button
        className="dev-login-btn"
        onClick={handleDevLogin}
        aria-label="개발용 임시 로그인"
        type="button"
      >
        <IoFlashOutline size={16} />
        임시 로그인
      </button>
    </div>
  );
}
