import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../utils/authStore';
import { api } from '../utils/api';

function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '' });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const fetchUser = useAuthStore((state) => state.fetchUser);

    const emailRef = useRef(null);
    const passRef = useRef(null);
    const confirmRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard');
    }, [isAuthenticated]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear field-level error on change
        setErrors((prev) => ({ ...prev, [name]: undefined }));
        setFormError('');
    };

    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter') { e.preventDefault(); nextRef?.current?.focus(); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setFormError('');

        try {
            const res = await api.post('auth/register/', form);
            setAccessToken(res.data.access);
            await fetchUser();
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                // Field-level errors from DRF serializer
                const fieldErrors = {};
                let hasFieldErrors = false;
                Object.entries(data).forEach(([key, val]) => {
                    fieldErrors[key] = Array.isArray(val) ? val[0] : val;
                    hasFieldErrors = true;
                });
                if (hasFieldErrors) {
                    setErrors(fieldErrors);
                } else {
                    setFormError('Registration failed. Please try again.');
                }
            } else {
                setFormError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { name: 'username', label: 'Username', type: 'text', placeholder: 'your username', nextRef: emailRef, autoComplete: 'username' },
        { name: 'email', label: 'Email (optional)', type: 'email', placeholder: 'you@example.com', nextRef: passRef, autoComplete: 'email' },
        { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', nextRef: confirmRef, autoComplete: 'new-password', ref: passRef },
        { name: 'confirm_password', label: 'Confirm password', type: 'password', placeholder: '••••••••', nextRef: null, autoComplete: 'new-password', ref: confirmRef },
    ];

    // Build refs map for focus chaining
    const refMap = { emailRef, passRef, confirmRef };

    return (
        <div className="login-page">
            <div className="login-card fade-up">
                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span className="login-logo-name">
                        <Link to="/">Uptime</Link>
                    </span>
                </p>
                <h1 className="login-title">Create an account</h1>
                <p className="login-sub">Start monitoring your websites</p>

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

                    {/* Render all four fields */}
                    {[
                        { name: 'username', label: 'Username', type: 'text', placeholder: 'your username', nextRef: emailRef, inputRef: null, autoComplete: 'username' },
                        { name: 'email', label: 'Email (optional)', type: 'email', placeholder: 'you@example.com', nextRef: passRef, inputRef: emailRef, autoComplete: 'email' },
                        { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', nextRef: confirmRef, inputRef: passRef, autoComplete: 'new-password' },
                        { name: 'confirm_password', label: 'Confirm password', type: 'password', placeholder: '••••••••', nextRef: null, inputRef: confirmRef, autoComplete: 'new-password' },
                    ].map(({ name, label, type, placeholder, nextRef, inputRef, autoComplete }, idx, arr) => (
                        <div className="field" key={name} style={{ marginBottom: idx === arr.length - 1 ? 24 : 14 }}>
                            <label className="field-label">{label}</label>
                            <input
                                ref={inputRef}
                                className={`field-input${errors[name] ? ' field-input--error' : ''}`}
                                type={type}
                                name={name}
                                placeholder={placeholder}
                                value={form[name]}
                                onChange={handleChange}
                                onKeyDown={(e) => handleKeyDown(e, nextRef)}
                                autoComplete={autoComplete}
                            />
                            {errors[name] && (
                                <p style={{ marginTop: 4, fontSize: 12, color: 'var(--color-danger, #ef4444)' }}>
                                    {errors[name]}
                                </p>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        className="btn btn-black"
                        style={{ width: '100%', padding: '12px 18px', fontSize: 14 }}
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--text-primary, inherit)', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;