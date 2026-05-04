import React, { useState, useEffect } from 'react';
import * as Icons from 'phosphor-react';
import { useAuthStore } from '../utils/authStore';
import { api } from '../utils/api';

/* ── tokens ── */
const T = {
  white: '#ffffff',
  surface: '#f5f5f5',
  warmStone: 'rgba(245,242,239,0.8)',
  black: '#000000',
  secondary: '#4e4e4e',
  muted: '#777169',
  border: '#e5e5e5',
  borderSubtle: 'rgba(0,0,0,0.05)',
  shadowCard: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px',
  shadowWarm: 'rgba(78,50,23,0.04) 0px 6px 16px, rgba(0,0,0,0.06) 0px 0px 0px 1px',
};

/* ── shared primitives ── */
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: T.surface,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  color: T.black,
  fontSize: 13,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  letterSpacing: '0.14px',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 500,
  color: T.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

/* ── SectionCard ── */
const SectionCard = ({ title, icon: Icon, children, sticky }) => (
  <div style={{
    background: T.white,
    borderRadius: 16,
    boxShadow: T.shadowCard,
    overflow: 'hidden',
    ...(sticky ? { position: 'sticky', top: 24 } : {}),
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '14px 22px',
      borderBottom: `1px solid ${T.borderSubtle}`,
    }}>
      <Icon size={14} weight="fill" color={T.secondary} />
      <span style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {title}
      </span>
    </div>
    <div style={{ padding: '22px 24px' }}>{children}</div>
  </div>
);

/* ── Toggle ── */
const Toggle = ({ checked, onChange, label, sub }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
    <div>
      <p style={{ fontSize: 14, fontWeight: 500, color: T.black, margin: '0 0 3px' }}>{label}</p>
      {sub && <p style={{ fontSize: 12, color: T.muted, margin: 0, letterSpacing: '0.14px' }}>{sub}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', flexShrink: 0,
        width: 40, height: 22, borderRadius: 9999,
        background: checked ? T.black : T.border,
        border: 'none', cursor: 'pointer',
        transition: 'background 0.2s',
        boxShadow: 'rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset',
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        width: 16, height: 16, borderRadius: '50%',
        background: checked ? T.white : '#a1a1aa',
        left: checked ? 21 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  </div>
);

/* ── SaveBtn ── */
const SaveBtn = ({ onClick, loading, saved, label = 'Save changes' }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '9px 20px', borderRadius: 9999,
      fontSize: 13, fontWeight: 500,
      background: saved ? 'rgba(34,197,94,0.08)' : T.black,
      color: saved ? '#15803d' : T.white,
      border: saved ? '1px solid rgba(34,197,94,0.2)' : 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
      transition: 'all 0.2s',
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {loading
      ? <Icons.CircleNotch size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
      : saved
        ? <Icons.CheckCircle size={13} weight="fill" />
        : <Icons.FloppyDisk size={13} weight="fill" />}
    {saved ? 'Saved!' : loading ? 'Saving…' : label}
  </button>
);

/* ── FieldError ── */
const FieldError = ({ msg }) =>
  msg ? <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 5, letterSpacing: '0.14px' }}>{msg}</p> : null;

/* ── Divider ── */
const Divider = () => <div style={{ height: 1, background: T.borderSubtle, margin: '4px 0' }} />;

/* ── Input with focus ── */
const Input = ({ type = 'text', value, onChange, placeholder, disabled, autoComplete, style: extraStyle }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        ...extraStyle,
        borderColor: focused ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)',
        boxShadow: focused ? 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px' : 'none',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  );
};

/* ════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════ */
const SettingsPage = () => {
  const user = useAuthStore((s) => s.user);
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const setAccessToken = useAuthStore((s) => s.setAccessTokenKeepUser);
  const logout = useAuthStore((s) => s.logout);

  /* profile */
  const [displayName, setDisplayNameLocal] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  /* alerts */
  const [alertEmail, setAlertEmail] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [alertOnDown, setAlertOnDown] = useState(true);
  const [alertOnRecover, setAlertOnRecover] = useState(true);
  const [cooldownMins, setCooldownMins] = useState('30');
  const [alertLoading, setAlertLoading] = useState(true);
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  /* password */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  /* delete */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* init */
  useEffect(() => { if (user) setDisplayNameLocal(user.display_name ?? ''); }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('auth/alert-settings/');
        const d = res.data;
        setAlertEmail(d.alert_email);
        setEmailEnabled(d.email_enabled);
        setAlertOnDown(d.alert_on_down);
        setAlertOnRecover(d.alert_on_recover);
        setCooldownMins(String(d.cooldown_mins));
      } catch { /* use defaults */ } finally { setAlertLoading(false); }
    };
    load();
  }, []);

  /* handlers */
  const saveProfile = async () => {
    setProfileSaving(true); setProfileError('');
    try {
      await api.patch('auth/profile/', { display_name: displayName });
      setDisplayName(displayName);
      setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err.response?.data?.display_name?.[0] ?? 'Failed to save profile.');
    } finally { setProfileSaving(false); }
  };

  const saveAlertSettings = async () => {
    setAlertSaving(true); setAlertSaved(false); setAlertError('');
    try {
      await api.put('auth/alert-settings/', {
        alert_email: alertEmail, email_enabled: emailEnabled,
        alert_on_down: alertOnDown, alert_on_recover: alertOnRecover,
        cooldown_mins: parseInt(cooldownMins, 10),
      });
      setAlertSaved(true); setTimeout(() => setAlertSaved(false), 2500);
    } catch (err) {
      setAlertError(
        err.response?.data?.alert_email?.[0] ??
        err.response?.data?.non_field_errors?.[0] ??
        'Failed to save alert settings.'
      );
    } finally { setAlertSaving(false); }
  };

  const sendTestEmail = async () => {
    if (!alertEmail) return;
    setTestSending(true); setTestResult(null);
    try {
      await api.post('auth/send-test-email/', { email: alertEmail });
      setTestResult('ok');
    } catch { setTestResult('error'); }
    finally { setTestSending(false); setTimeout(() => setTestResult(null), 4000); }
  };

  const changePassword = async () => {
    setPwErrors({});
    const errs = {};
    if (!currentPw) errs.currentPw = 'Required.';
    if (!newPw) errs.newPw = 'Required.';
    if (newPw.length < 8) errs.newPw = 'Must be at least 8 characters.';
    if (newPw !== confirmPw) errs.confirmPw = 'Passwords do not match.';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwSaving(true);
    try {
      const res = await api.post('auth/change-password/', {
        current_password: currentPw, new_password: newPw, confirm_password: confirmPw,
      });
      setAccessToken(res.data.access);
      setPwSaved(true); setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      const d = err.response?.data ?? {};
      setPwErrors({ currentPw: d.current_password ?? '', newPw: d.new_password?.[0] ?? '', confirmPw: d.confirm_password ?? '', general: d.detail ?? '' });
    } finally { setPwSaving(false); }
  };

  const deleteAccount = async () => {
    setDeleteError(''); setDeleteLoading(true);
    try {
      await api.delete('auth/delete-account/', { data: { password: deletePw } });
      await logout();
    } catch (err) {
      setDeleteError(err.response?.data?.error ?? 'Failed to delete account.');
    } finally { setDeleteLoading(false); }
  };

  /* ── shared sub-styles ── */
  const selectStyle = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

  const inlineRow = (label, control) => (
    <div key={label}>
      <label style={labelStyle}>{label}</label>
      {control}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=password]::-ms-reveal { display: none; }
      `}</style>

      <div style={{ padding: '36px 40px', fontFamily: "'Inter', sans-serif", minHeight: '100%' }}>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Account */}
            <SectionCard title="Account" icon={Icons.User}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>Username</label>
                  <Input value={user?.username ?? ''} disabled placeholder="Username" />
                </div>
                <div>
                  <label style={labelStyle}>Display name</label>
                  <Input
                    value={displayName}
                    onChange={e => setDisplayNameLocal(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </div>
              {profileError && <p style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>{profileError}</p>}
              <SaveBtn onClick={saveProfile} loading={profileSaving} saved={profileSaved} />
            </SectionCard>

            {/* Change password */}
            <SectionCard title="Change Password" icon={Icons.LockKey}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>Current password</label>
                  <Input
                    type="password" value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                  />
                  <FieldError msg={pwErrors.currentPw} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>New password</label>
                    <Input
                      type="password" value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="••••••••" autoComplete="new-password"
                    />
                    <FieldError msg={pwErrors.newPw} />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm password</label>
                    <Input
                      type="password" value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="••••••••" autoComplete="new-password"
                    />
                    <FieldError msg={pwErrors.confirmPw} />
                  </div>
                </div>
                {pwErrors.general && <p style={{ fontSize: 12, color: '#b91c1c' }}>{pwErrors.general}</p>}
              </div>
              <SaveBtn onClick={changePassword} loading={pwSaving} saved={pwSaved} label="Update password" />
            </SectionCard>

            {/* Danger zone */}
            <SectionCard title="Danger Zone" icon={Icons.Warning}>
              {!deleteConfirmOpen ? (
                <>
                  <p style={{ fontSize: 14, color: T.secondary, marginBottom: 18, lineHeight: 1.6, letterSpacing: '0.14px' }}>
                    Permanently delete your account and all associated monitor data. This cannot be undone.
                  </p>
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    style={{
                      padding: '9px 20px',
                      background: 'rgba(239,68,68,0.06)',
                      color: '#b91c1c',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 9999,
                      fontSize: 13, fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Delete account
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.6, margin: 0 }}>
                    Enter your password to confirm permanent account deletion.
                  </p>
                  <div>
                    <label style={labelStyle}>Confirm your password</label>
                    <Input
                      type="password" value={deletePw}
                      onChange={e => setDeletePw(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                    />
                    <FieldError msg={deleteError} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={deleteAccount}
                      disabled={deleteLoading || !deletePw}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 20px',
                        background: 'rgba(239,68,68,0.08)', color: '#b91c1c',
                        border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9999,
                        fontSize: 13, fontWeight: 500,
                        cursor: deleteLoading || !deletePw ? 'not-allowed' : 'pointer',
                        opacity: deleteLoading || !deletePw ? 0.5 : 1,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {deleteLoading
                        ? <Icons.CircleNotch size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <Icons.Trash size={13} weight="fill" />}
                      {deleteLoading ? 'Deleting…' : 'Confirm delete'}
                    </button>
                    <button
                      onClick={() => { setDeleteConfirmOpen(false); setDeletePw(''); setDeleteError(''); }}
                      style={{
                        padding: '9px 20px',
                        background: T.surface, color: T.secondary,
                        border: `1px solid ${T.border}`, borderRadius: 9999,
                        fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Right column: Email alerts (sticky) ── */}
          <SectionCard title="Email Alerts" icon={Icons.EnvelopeSimple} sticky>
            {alertLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <Icons.CircleNotch size={20} color={T.muted} style={{ animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

                {/* Master toggle */}
                <Toggle
                  checked={emailEnabled} onChange={setEmailEnabled}
                  label="Enable email alerts"
                  sub="Send an email when a monitored website goes down or recovers"
                />

                {/* Dependant settings */}
                <div style={{ opacity: emailEnabled ? 1 : 0.4, pointerEvents: emailEnabled ? 'auto' : 'none', transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Alert email */}
                  <div>
                    <label style={labelStyle}>Alert email address</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Input
                        type="email" value={alertEmail}
                        onChange={e => setAlertEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{ flex: 1 }}
                      />
                      {/* Test email button */}
                      <button
                        onClick={sendTestEmail}
                        disabled={testSending || !alertEmail}
                        style={{
                          flexShrink: 0,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '9px 16px', borderRadius: 9999,
                          fontSize: 12, fontWeight: 500,
                          background: testResult === 'ok'
                            ? 'rgba(34,197,94,0.08)'
                            : testResult === 'error'
                              ? 'rgba(239,68,68,0.06)'
                              : T.surface,
                          color: testResult === 'ok' ? '#15803d' : testResult === 'error' ? '#b91c1c' : T.secondary,
                          border: `1px solid ${testResult === 'ok' ? 'rgba(34,197,94,0.2)' : testResult === 'error' ? 'rgba(239,68,68,0.2)' : T.border}`,
                          cursor: testSending || !alertEmail ? 'not-allowed' : 'pointer',
                          opacity: testSending || !alertEmail ? 0.5 : 1,
                          whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
                          transition: 'all 0.2s',
                        }}
                      >
                        {testSending
                          ? <Icons.CircleNotch size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                          : testResult === 'ok'
                            ? <Icons.CheckCircle size={13} weight="fill" />
                            : testResult === 'error'
                              ? <Icons.XCircle size={13} weight="fill" />
                              : <Icons.PaperPlane size={13} weight="fill" />}
                        {testSending ? 'Sending…' : testResult === 'ok' ? 'Sent!' : testResult === 'error' ? 'Failed' : 'Test'}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: T.muted, marginTop: 6, letterSpacing: '0.14px' }}>
                      Downtime and recovery alerts will be sent here.
                    </p>
                  </div>

                  {/* Alert triggers */}
                  <div>
                    <label style={labelStyle}>Alert triggers</label>
                    <div style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12, padding: '14px 16px',
                      display: 'flex', flexDirection: 'column', gap: 12,
                      boxShadow: 'rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset',
                    }}>
                      <Toggle
                        checked={alertOnDown} onChange={setAlertOnDown}
                        label="Website goes down"
                        sub="Alert immediately when a monitor fails a check"
                      />
                      <Divider />
                      <Toggle
                        checked={alertOnRecover} onChange={setAlertOnRecover}
                        label="Website recovers"
                        sub="Alert when a previously down website comes back up"
                      />
                    </div>
                  </div>

                  {/* Cooldown */}
                  <div>
                    <label style={labelStyle}>Alert cooldown</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <select
                        value={cooldownMins}
                        onChange={e => setCooldownMins(e.target.value)}
                        style={{ ...selectStyle, width: 'auto', minWidth: 180 }}
                      >
                        <option value="0">No cooldown</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="360">6 hours</option>
                        <option value="1440">24 hours</option>
                      </select>
                      <span style={{ fontSize: 12, color: T.muted, letterSpacing: '0.14px' }}>
                        Don't repeat alerts within this window
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save row */}
                <div style={{
                  paddingTop: 18,
                  borderTop: `1px solid ${T.borderSubtle}`,
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <SaveBtn onClick={saveAlertSettings} loading={alertSaving} saved={alertSaved} />
                  {alertError && (
                    <span style={{ fontSize: 12, color: '#b91c1c', letterSpacing: '0.14px' }}>{alertError}</span>
                  )}
                  {emailEnabled && !alertEmail && !alertError && (
                    <span style={{ fontSize: 12, color: '#92400e', letterSpacing: '0.14px' }}>
                      ⚠ Enter an email address to enable alerts
                    </span>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </>
  );
};

export default SettingsPage;
