import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Icons from 'phosphor-react';
import { fetchWebsiteId, toggleWebsite } from '../utils/websiteService';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../utils/authStore';

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
};

/* ── helpers ── */
const formatRelativeTime = (isoString) => {
  if (!isoString) return '—';
  const diffMins = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return new Date(isoString).toLocaleString();
};

const formatDuration = (isoString, now) => {
  if (!isoString) return '00:00:00';
  const total = Math.max(0, Math.floor((now - new Date(isoString)) / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

/* ── sub-components ── */
const StatusPill = ({ up }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 500,
    color: up ? '#15803d' : '#b91c1c',
    background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    padding: '3px 10px', borderRadius: 9999,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: up ? '#22c55e' : '#ef4444' }} />
    {up ? 'Online' : 'Down'}
  </span>
);

const MetricCard = ({ label, value, sub, children }) => (
  <div style={{
    background: T.white, borderRadius: 16, padding: '20px 22px',
    boxShadow: T.shadowCard,
  }}>
    <p style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
      {label}
    </p>
    <p style={{ fontSize: 32, fontWeight: 300, color: T.black, lineHeight: 1, marginBottom: 4, fontFamily: "'Georgia', serif" }}>
      {value}
    </p>
    {sub && <p style={{ fontSize: 12, color: T.muted, letterSpacing: '0.14px' }}>{sub}</p>}
    {children}
  </div>
);

const ProgressBar = ({ label, value, display }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: T.secondary, fontFamily: 'ui-monospace, monospace' }}>{display}</span>
    </div>
    <div style={{ height: 3, background: T.surface, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', background: T.black,
        borderRadius: 2, width: `${Math.min(value, 100)}%`,
        transition: 'width 0.8s ease',
      }} />
    </div>
  </div>
);

const Spinner = () => (
  <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.black, animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const InfoRow = ({ label, value, mono }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0', borderBottom: `1px solid ${T.borderSubtle}`,
  }}>
    <span style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
    <span style={{ fontSize: 13, color: T.secondary, fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value}
    </span>
  </div>
);

/* ── main ── */
const DetailWebsitePage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [wsConnected, setWsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken || !id) return;
    let isMounted = true, socket = null;
    const connect = () => {
      if (!isMounted) return;
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      socket = new WebSocket(`${wsProtocol}//${wsHost}/ws/monitor/?token=${accessToken}`);

      socket.onopen = () => {
        setWsConnected(true);
        socket.send(JSON.stringify({ type: 'subscribe', website_id: id }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Support both {website, metrics, new_check} and flat payloads
          const websitePayload = msg.website ?? msg;
          if (String(websitePayload.id) !== String(id)) return;

          const newCheck = msg.new_check ?? null;
          const metricsPayload = msg.metrics ?? null;

          // Use last_checked from website payload, or fall back to the new check's timestamp
          const freshTimestamp = websitePayload.last_checked ?? newCheck?.checked_at ?? null;
          if (freshTimestamp) setLastCheckedAt(freshTimestamp);

          queryClient.setQueryData(['website', id], (old) => {
            if (!old) return old;

            const updatedWebsite = { ...old.website, ...websitePayload };

            // Merge metrics: prefer incoming metrics, fall back to old
            const updatedMetrics = metricsPayload
              ? { ...old.metrics, ...metricsPayload }
              : old.metrics;

            // Prepend new check row (deduplicate by id)
            let updatedChecks = old.recent_checks ?? [];
            if (newCheck) {
              const alreadyExists = updatedChecks.some((c) => c.id === newCheck.id);
              if (!alreadyExists) {
                updatedChecks = [newCheck, ...updatedChecks].slice(0, 50);
              }
            }

            return {
              ...old,
              website: updatedWebsite,
              metrics: updatedMetrics,
              recent_checks: updatedChecks,
            };
          });
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      };

      socket.onerror = (err) => console.warn('[WS] Error', err);
      socket.onclose = () => { setWsConnected(false); if (isMounted) setTimeout(connect, 3000); };
    };
    connect();
    return () => { isMounted = false; if (socket) { socket.onclose = null; socket.close(); } };
  }, [accessToken, id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['website', id],
    queryFn: () => fetchWebsiteId(id),
    enabled: !!id,
    retry: 1,
    // Poll every 30s as a resilience fallback when WebSocket drops
    refetchInterval: wsConnected ? false : 30_000,
    refetchIntervalInBackground: false,
  });

  // Keep lastCheckedAt in sync with every data refresh (initial load + polling fallback)
  useEffect(() => {
    if (data?.website?.last_checked) setLastCheckedAt(data.website.last_checked);
  }, [data?.website?.last_checked]);

  const toggleMutation = useMutation({
    mutationFn: (nextActive) => toggleWebsite(id, nextActive),
    onSuccess: (res) => {
      queryClient.setQueryData(['website', id], (old) => ({ ...old, website: { ...old.website, is_active: res.is_active } }));
    },
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', gap: 12 }}>
      <Icons.WifiX size={36} color={T.muted} weight="thin" />
      <p style={{ color: T.secondary, fontSize: 14 }}>Failed to load website data</p>
      <button onClick={() => navigate(-1)} style={{ fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        ← go back
      </button>
    </div>
  );

  const { website: site, metrics, recent_checks: checks = [] } = data;
  const isActive = site?.is_active;
  const isUp = site?.last_status;
  const avgResp = Math.round(metrics?.avg_response_24h || 0);
  const uptime = metrics?.uptime_24h || 0;
  const totalChecks = metrics?.total_check_24h || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Icons.ChartLine },
    { id: 'checks', label: 'Checks', icon: Icons.ListChecks },
    { id: 'settings', label: 'Settings', icon: Icons.SlidersHorizontal },
  ];

  const cardStyle = {
    background: T.white, borderRadius: 16, padding: 24,
    boxShadow: T.shadowCard,
  };
  const cardHeaderStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 20, paddingBottom: 16,
    borderBottom: `1px solid ${T.borderSubtle}`,
  };
  const cardHeadingStyle = {
    fontSize: 12, fontWeight: 500, color: T.muted,
    textTransform: 'uppercase', letterSpacing: '0.1em',
  };
  const thStyle = {
    padding: '10px 20px', textAlign: 'left',
    fontSize: 11, fontWeight: 500, color: T.muted,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    borderBottom: `1px solid ${T.borderSubtle}`,
    background: T.surface,
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes livePulse { 0% { opacity: 0.9; transform: scale(1); } 100% { opacity: 0; transform: scale(2.8); } }`}</style>
      <div style={{ padding: '36px 40px', fontFamily: "'Inter', sans-serif", minHeight: '100%' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <button
              onClick={() => navigate('/dashboard/websites')}
              style={{
                marginTop: 4, padding: '8px 10px', borderRadius: 9,
                background: T.white, border: `1px solid ${T.border}`,
                color: T.secondary, cursor: 'pointer',
                boxShadow: T.shadowCard, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.surface; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.white; }}
            >
              <Icons.ArrowLeft size={15} weight="bold" />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 300, color: T.black, margin: 0, fontFamily: "'Georgia', serif" }}>
                  {site.website_name}
                </h1>
                <StatusPill up={isUp} />
                {!isActive && (
                  <span style={{
                    fontSize: 11, fontWeight: 500, color: T.muted,
                    background: T.surface, border: `1px solid ${T.border}`,
                    padding: '2px 10px', borderRadius: 9999, letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    Paused
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.muted }}>
                <a href={site.website_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: T.secondary, textDecoration: 'none', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                  {site.website_url}
                </a>
                <span style={{ color: T.border }}>·</span>
                <span>every {site.interval}m</span>
                <span style={{ color: T.border }}>·</span>
                <span>ID #{site.id}</span>
              </div>
            </div>
          </div>

          {/* Toggle active */}
          <button
            onClick={() => toggleMutation.mutate(!isActive)}
            disabled={toggleMutation.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 9999,
              fontSize: 13, fontWeight: 500,
              background: isActive ? 'rgba(245,242,239,0.8)' : T.black,
              color: isActive ? T.secondary : T.white,
              border: `1px solid ${isActive ? T.border : 'transparent'}`,
              boxShadow: isActive ? 'rgba(78,50,23,0.04) 0px 6px 16px, rgba(0,0,0,0.06) 0px 0px 0px 1px' : 'none',
              cursor: toggleMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: toggleMutation.isPending ? 0.6 : 1,
              transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
          >
            {toggleMutation.isPending
              ? <Icons.CircleNotch size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              : isActive ? <Icons.Pause size={14} weight="fill" /> : <Icons.Play size={14} weight="fill" />}
            {isActive ? 'Pause monitor' : 'Resume monitor'}
          </button>
        </div>

        {/* ── Metric cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <MetricCard label="Uptime 24h" value={`${uptime}%`} sub={uptime >= 99 ? 'Excellent' : uptime >= 90 ? 'Degraded' : 'Critical'}>
            <div style={{ marginTop: 12, height: 3, background: T.surface, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: uptime >= 99 ? '#22c55e' : uptime >= 90 ? '#f59e0b' : '#ef4444', width: `${uptime}%`, borderRadius: 2, transition: 'width 0.8s' }} />
            </div>
          </MetricCard>
          <MetricCard label="Avg Response" value={`${avgResp}ms`} sub={avgResp < 300 ? 'Fast' : avgResp < 800 ? 'Moderate' : 'Slow'} />
          <MetricCard label="Since last check" value={formatDuration(lastCheckedAt, now)} sub={site.last_response_time ? `${Math.round(site.last_response_time)}ms last` : 'no data'} />
          <MetricCard label="Checks 24h" value={totalChecks} sub="checks recorded" />
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTab(t.id)}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 500,
                color: selectedTab === t.id ? T.black : T.muted,
                borderBottom: selectedTab === t.id ? `2px solid ${T.black}` : '2px solid transparent',
                background: 'none', border: 'none', borderBottom: selectedTab === t.id ? `2px solid ${T.black}` : '2px solid transparent',
                cursor: 'pointer', transition: 'color 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: -1, letterSpacing: '0.14px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <t.icon size={14} weight={selectedTab === t.id ? 'fill' : 'bold'} />
              {t.label}
            </button>
          ))}
          </div>
          {/* Live / Polling indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 4, fontSize: 11, fontWeight: 500, color: wsConnected ? '#15803d' : T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: wsConnected ? '#22c55e' : T.border }} />
              {wsConnected && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', animation: 'livePulse 1.8s ease-out infinite' }} />}
            </span>
            {wsConnected ? 'Live' : 'Polling'}
          </div>
        </div>

        {/* ── Tab: Overview ── */}
        {selectedTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <Icons.ChartBar size={14} weight="fill" color={T.secondary} />
                <h3 style={{ ...cardHeadingStyle, margin: 0 }}>Performance</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <ProgressBar label="Avg Response" value={Math.min((avgResp / 2000) * 100, 100)} display={`${avgResp}ms`} />
                <ProgressBar label="Uptime 24h" value={uptime} display={`${uptime}%`} />
                <ProgressBar label="Checks done" value={Math.min((totalChecks / (24 * 60 / site.interval)) * 100, 100)} display={`${totalChecks}`} />
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <Icons.Info size={14} weight="fill" color={T.secondary} />
                <h3 style={{ ...cardHeadingStyle, margin: 0 }}>Monitor info</h3>
              </div>
              <div>
                {[
                  { label: 'URL', value: site.website_url, mono: true },
                  { label: 'Interval', value: `Every ${site.interval} minute${site.interval > 1 ? 's' : ''}` },
                  { label: 'Last Checked', value: formatRelativeTime(lastCheckedAt) },
                  { label: 'Current Status', value: isUp ? 'Online' : 'Down' },
                  { label: 'Monitor Active', value: isActive ? 'Yes' : 'Paused' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: T.secondary, fontFamily: row.mono ? 'ui-monospace, monospace' : 'inherit', maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Checks ── */}
        {selectedTab === 'checks' && (
          <div style={{ background: T.white, borderRadius: 16, boxShadow: T.shadowCard, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.ListChecks size={14} weight="fill" color={T.secondary} />
              <span style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Recent checks
              </span>
              <span style={{ fontSize: 12, color: T.muted, fontFamily: 'ui-monospace, monospace' }}>({checks.length})</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Time', 'Status', 'Response', 'HTTP Code', 'Error'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {checks.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: T.muted, fontSize: 13 }}>No checks recorded yet</td></tr>
                  ) : checks.map((c) => (
                    <tr key={c.id}
                      style={{ borderBottom: `1px solid ${T.borderSubtle}`, transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surface}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: T.muted }}>{formatRelativeTime(c.checked_at)}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 500,
                          color: c.status ? '#15803d' : '#b91c1c',
                          background: c.status ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          padding: '2px 9px', borderRadius: 9999,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.status ? '#22c55e' : '#ef4444' }} />
                          {c.status ? 'Up' : 'Down'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: T.secondary }}>
                        {c.response_time != null ? `${Math.round(c.response_time)}ms` : '—'}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        {c.status_code ? (
                          <span style={{
                            fontSize: 12, fontFamily: 'ui-monospace, monospace', fontWeight: 500,
                            padding: '2px 8px', borderRadius: 6,
                            color: c.status_code < 300 ? '#15803d' : c.status_code < 400 ? '#92400e' : '#b91c1c',
                            background: c.status_code < 300 ? 'rgba(34,197,94,0.1)' : c.status_code < 400 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          }}>
                            {c.status_code}
                          </span>
                        ) : <span style={{ color: T.muted }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: '#b91c1c', maxWidth: 200 }}>
                        {c.error_message || <span style={{ color: T.muted }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Settings ── */}
        {selectedTab === 'settings' && (
          <div style={{ ...cardStyle }}>
            <div style={cardHeaderStyle}>
              <Icons.SlidersHorizontal size={14} weight="fill" color={T.secondary} />
              <h3 style={{ ...cardHeadingStyle, margin: 0 }}>Monitor settings</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {[{ label: 'Check Interval', type: 'select' }, { label: 'Timeout (seconds)', type: 'number', default: 10 }].map(({ label, type, default: def }) => (
                <div key={label}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
                  {type === 'select' ? (
                    <select style={{ width: '100%', padding: '10px 14px', background: T.surface, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, color: T.black, fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif" }}>
                      {['Every 1 minute', 'Every 5 minutes', 'Every 15 minutes', 'Every 30 minutes'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="number" defaultValue={def} style={{ width: '100%', padding: '10px 14px', background: T.surface, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, color: T.black, fontSize: 14, outline: 'none', fontFamily: 'ui-monospace, monospace' }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expected status code</label>
              <input type="number" defaultValue={200} style={{ width: 120, padding: '10px 14px', background: T.surface, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, color: T.black, fontSize: 14, outline: 'none', fontFamily: 'ui-monospace, monospace' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20, borderTop: `1px solid ${T.borderSubtle}` }}>
              <button style={{ padding: '9px 20px', background: T.black, color: T.white, border: 'none', borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Save changes
              </button>
              <button style={{ padding: '9px 20px', background: T.surface, color: T.secondary, border: `1px solid ${T.border}`, borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Reset
              </button>
              <button
                onClick={() => { if (confirm('Delete this website monitor?')) navigate('/dashboard/websites'); }}
                style={{ marginLeft: 'auto', padding: '9px 20px', background: 'rgba(239,68,68,0.06)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Delete monitor
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DetailWebsitePage;