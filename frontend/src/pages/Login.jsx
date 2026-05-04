import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../utils/authStore';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setUsername('');
      setPassword('');
      setFormError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-up">
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <span className="login-logo-name">
            <Link to="/">
              Uptime
            </Link>
          </span>
        </p>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {formError}
            </div>
          )}

          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">Username</label>
            <input
              className="field-input"
              type="text"
              placeholder="your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); passwordRef.current?.focus(); } }}
              autoComplete="username"
            />
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label className="field-label">Password</label>
            <input
              ref={passwordRef}
              className="field-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-black"
            style={{ width: '100%', padding: '12px 18px', fontSize: 14 }}
          >
            Sign in
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--text-primary, inherit)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;