import React from 'react';
import { Globe, CheckCircle, XCircle, Gauge, Activity, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchWebsite } from '../utils/websiteService';
import { useAuthStore } from '../utils/authStore';
import { useNavigate } from 'react-router-dom';

/* ── tokens ── */
const T = {
  white: '#ffffff',
  surface: '#f5f5f5',
  black: '#000000',
  secondary: '#4e4e4e',
  muted: '#777169',
  border: '#e5e5e5',
  borderSubtle: 'rgba(0,0,0,0.05)',
  shadowCard: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px',
};

const StatCard = ({ label, value, icon: Icon, sub }) => (
  <div
    style={{
      background: T.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: T.shadowCard, display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 12px'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadowCard}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: T.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset',
      }}>
        <Icon size={15} color={T.secondary} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: 30, fontWeight: 300, color: T.black, lineHeight: 1, fontFamily: "'Georgia', serif" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4, letterSpacing: '0.14px' }}>{sub}</div>}
    </div>
  </div>
);

const StatusDot = ({ up }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 500,
    color: up ? '#15803d' : '#b91c1c',
    background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    padding: '3px 10px', borderRadius: 9999,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: up ? '#22c55e' : '#ef4444' }} />
    {up ? 'Up' : 'Down'}
  </span>
);

const HomePage = () => {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.user?.username ?? 'there');
  const { data: websites = [], isLoading } = useQuery({
    queryKey: ['websites'],
    queryFn: fetchWebsite,
    refetchInterval: 30000,
  });

  const upCount = websites.filter((w) => w.last_status === true).length;
  const downCount = websites.filter((w) => w.last_status === false).length;
  const avgResp = websites.length
    ? Math.round(websites.reduce((s, w) => s + (w.last_response_time || 0), 0) / websites.length)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '36px 40px', fontFamily: "'Inter', sans-serif", minHeight: '100%' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        <StatCard label="Total Monitors" value={websites.length} icon={Globe} sub="registered" />
        <StatCard label="Online" value={upCount} icon={CheckCircle} sub="responding" />
        <StatCard label="Down" value={downCount} icon={XCircle} sub={downCount > 0 ? 'needs attention' : 'all clear'} />
        <StatCard label="Avg Response" value={avgResp ? `${avgResp}ms` : '—'} icon={Gauge} sub="across all sites" />
      </div>

      {/* Live status table */}
      <div style={{ background: T.white, borderRadius: 16, boxShadow: T.shadowCard, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 22px', borderBottom: `1px solid ${T.borderSubtle}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} color={T.secondary} />
            <span style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Live status
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard/websites')}
            style={{
              fontSize: 12, fontWeight: 500, color: T.black,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 9999, padding: '5px 14px',
              cursor: 'pointer', letterSpacing: '0.15px', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.border}
            onMouseLeave={e => e.currentTarget.style.background = T.surface}
          >
            View all →
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13 }}>Loading…</div>
        ) : websites.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Globe size={28} color={T.border} style={{ marginBottom: 12 }} />
            <p style={{ color: T.muted, fontSize: 13 }}>No monitors added yet</p>
            <button
              onClick={() => navigate('/dashboard/websites')}
              style={{
                marginTop: 14, fontSize: 13, fontWeight: 500, color: T.black,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 9999, padding: '7px 18px', cursor: 'pointer',
              }}
            >
              Add your first website
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderSubtle}` }}>
                {['Website', 'URL', 'Status', 'Response', 'Last Check', ''].map((h) => (
                  <th key={h} style={{
                    padding: '10px 20px', textAlign: 'left',
                    fontSize: 11, fontWeight: 500, color: T.muted,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    background: T.surface,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {websites.slice(0, 8).map((site) => (
                <tr
                  key={site.id}
                  style={{ borderBottom: `1px solid ${T.borderSubtle}`, cursor: 'pointer', transition: 'background 0.12s' }}
                  onClick={() => navigate(`/dashboard/websites/${site.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 20px', fontSize: 14, fontWeight: 500, color: T.black }}>{site.website_name}</td>
                  <td style={{ padding: '13px 20px', fontSize: 12, color: T.muted, fontFamily: 'ui-monospace, monospace' }}>
                    {site.website_url.replace(/^https?:\/\//, '')}
                  </td>
                  <td style={{ padding: '13px 20px' }}><StatusDot up={site.last_status} /></td>
                  <td style={{ padding: '13px 20px', fontSize: 13, fontFamily: 'ui-monospace, monospace', color: T.secondary }}>
                    {site.last_response_time ? `${Math.round(site.last_response_time)}ms` : '—'}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 12, color: T.muted }}>
                    {site.last_checked
                      ? (() => {
                          const m = Math.floor((Date.now() - new Date(site.last_checked)) / 60000);
                          return m < 1 ? 'Just now' : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
                        })()
                      : 'Never'}
                  </td>
                  <td style={{ padding: '13px 20px' }}><ArrowRight size={14} color={T.muted} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HomePage;