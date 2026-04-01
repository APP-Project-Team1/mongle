import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import Seo from '../../components/common/Seo';
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!name || !email || !password || !confirm) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

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
      <Seo
        title="회원가입 | 몽글 플래너 관리자"
        description="몽글 플래너 관리자 계정을 만들고 커플 일정과 예산 관리를 시작하세요."
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

      <main className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title" className="auth-logo">
          Mongle
        </h1>
        <p className="auth-tagline">플래너 계정 만들기</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-name">
              이름
            </label>
            <input
              id="register-name"
              className="auth-input"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">
              이메일
            </label>
            <input
              id="register-email"
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
            <label className="auth-label" htmlFor="register-password">
              비밀번호
            </label>
            <input
              id="register-password"
              className="auth-input"
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-password-confirm">
              비밀번호 확인
            </label>
            <input
              id="register-password-confirm"
              className="auth-input"
              type="password"
              placeholder="비밀번호를 다시 입력해 주세요"
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                setError('');
              }}
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
            <Link to="/login" className="auth-link">
              로그인
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
