import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './auth.css';

// 더미: 실제 이메일 발송 없이 콘솔로 코드 출력
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const STEPS = ['이메일 확인', '인증번호 입력', '비밀번호 재설정'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { findUserByEmail, resetPassword } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [step, setStep] = useState(0);

  // Step 1
  const [email, setEmail] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [step1Error, setStep1Error] = useState('');

  // Step 2
  const [inputCode, setInputCode] = useState('');
  const [step2Error, setStep2Error] = useState('');

  // Step 3
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [step3Error, setStep3Error] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Step 1: 인증번호 전송 ──────────────────────
  const handleSendCode = () => {
    setStep1Error('');
    if (!email) { setStep1Error('이메일을 입력해 주세요.'); return; }
    const user = findUserByEmail(email);
    if (!user) { setStep1Error('가입되지 않은 이메일입니다.'); return; }
    const code = generateCode();
    setSentCode(code);
    setCodeSent(true);
    console.log(`[Mongle Dev] 인증번호: ${code}`); // 개발용 콘솔 출력
  };

  const handleStep1Next = () => {
    if (!codeSent) { setStep1Error('먼저 인증번호를 전송해 주세요.'); return; }
    setStep(1);
  };

  // ── Step 2: 코드 확인 ─────────────────────────
  const handleVerifyCode = () => {
    setStep2Error('');
    if (!inputCode) { setStep2Error('인증번호를 입력해 주세요.'); return; }
    if (inputCode !== sentCode) { setStep2Error('인증번호가 올바르지 않습니다.'); return; }
    setStep(2);
  };

  // ── Step 3: 비밀번호 재설정 ──────────────────
  const handleResetPw = () => {
    setStep3Error('');
    if (!newPw || !confirmPw) { setStep3Error('비밀번호를 입력해 주세요.'); return; }
    if (newPw.length < 6) { setStep3Error('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (newPw !== confirmPw) { setStep3Error('비밀번호가 일치하지 않습니다.'); return; }
    const result = resetPassword(email, newPw);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } else {
      setStep3Error(result.error);
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
        <p className="auth-tagline">비밀번호 재설정</p>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((_, i) => (
            <div key={i} className={`step-dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>

        {/* ── Step 1 ── */}
        {step === 0 && (
          <div className="auth-form">
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
              가입 시 사용한 이메일을 입력하시면 인증번호를 발송해 드립니다.
            </p>
            <div className="auth-field">
              <label className="auth-label">이메일</label>
              <div className="auth-input-row">
                <input
                  className="auth-input"
                  type="email"
                  placeholder="example@mongle.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setStep1Error(''); setCodeSent(false); }}
                />
                <button
                  type="button"
                  className="auth-inline-btn"
                  onClick={handleSendCode}
                >
                  {codeSent ? '재전송' : '인증번호 전송'}
                </button>
              </div>
            </div>
            {codeSent && (
              <div className="auth-success">✉️ 인증번호가 전송되었습니다. (개발 모드: 브라우저 콘솔 확인)</div>
            )}
            {step1Error && <div className="auth-error">{step1Error}</div>}
            <button className="auth-submit-btn" type="button" onClick={handleStep1Next}>
              다음
            </button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 1 && (
          <div className="auth-form">
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
              {email}로 전송된 6자리 인증번호를 입력해 주세요.
            </p>
            <div className="auth-field">
              <label className="auth-label">인증번호</label>
              <input
                className="auth-input"
                type="text"
                placeholder="6자리 숫자"
                maxLength={6}
                value={inputCode}
                onChange={e => { setInputCode(e.target.value.replace(/\D/g, '')); setStep2Error(''); }}
              />
            </div>
            {step2Error && <div className="auth-error">{step2Error}</div>}
            <button className="auth-submit-btn" type="button" onClick={handleVerifyCode}>
              확인
            </button>
            <button
              type="button"
              style={{ background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', alignSelf: 'center', fontFamily: 'inherit', border: 'none', marginTop: -8 }}
              onClick={() => setStep(0)}
            >
              ← 이메일 다시 입력
            </button>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 2 && !success && (
          <div className="auth-form">
            <div className="auth-field">
              <label className="auth-label">새 비밀번호</label>
              <input
                className="auth-input"
                type="password"
                placeholder="6자 이상"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setStep3Error(''); }}
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">새 비밀번호 확인</label>
              <input
                className="auth-input"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setStep3Error(''); }}
              />
            </div>
            {step3Error && <div className="auth-error">{step3Error}</div>}
            <button className="auth-submit-btn" type="button" onClick={handleResetPw}>
              비밀번호 변경
            </button>
          </div>
        )}

        {success && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>비밀번호가 변경되었습니다!</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>로그인 페이지로 이동합니다...</p>
          </div>
        )}

        {!success && (
          <div className="auth-footer">
            <Link to="/login" className="auth-link" style={{ fontSize: 13 }}>← 로그인으로 돌아가기</Link>
          </div>
        )}
      </div>
    </div>
  );
}
