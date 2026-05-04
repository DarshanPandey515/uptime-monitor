import React, { useState } from 'react';
import { Plus, Search, Pencil, Pause, Trash2, RotateCw, CheckCircle, XCircle, Play } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWebsite, fetchWebsite } from '../utils/websiteService';
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

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: T.surface,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  color: T.black, fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  outline: 'none', boxSizing: 'border-box',
  letterSpacing: '0.14px',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block', marginBottom: 6,
  fontSize: 11, fontWeight: 500, color: T.muted,
  textTransform: 'uppercase', letterSpacing: '0.1em',
};

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

const IconBtn = ({ icon: Icon, title, onClick, hoverColor }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 7, borderRadius: 8,
        background: hovered ? T.surface : 'none',
        border: `1px solid ${hovered ? T.border : 'transparent'}`,
        color: hovered ? hoverColor || T.secondary : T.muted,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={15} />
    </button>
  );
};

const WebsitesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [websiteName, setWebsiteName] = useState('');
  const [websiteURL, setWebsiteURL] = useState('');
  const [intervalValue, setIntervalValue] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const mutation = useMutation({
    mutationFn: createWebsite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['websites'] }),
  });

  const { data: websites = [], isLoading, isError } = useQuery({
    queryKey: ['websites'],
    queryFn: fetchWebsite,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ website_name: websiteName, website_url: websiteURL, interval: intervalValue });
    setWebsiteName(''); setWebsiteURL(''); setIntervalValue(5);
  };

  const filtered = websites.filter(
    (s) =>
      s.website_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.website_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thStyle = {
    padding: '10px 18px', textAlign: 'left',
    fontSize: 11, fontWeight: 500, color: T.muted,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    borderBottom: `1px solid ${T.borderSubtle}`,
    background: T.surface,
  };

  return (
    <div style={{ padding: '36px 40px', fontFamily: "'Inter', sans-serif", minHeight: '100%' }}>

      {/* Add website card */}
      <div style={{
        background: T.white, borderRadius: 16, padding: '24px 28px',
        boxShadow: T.shadowCard, marginBottom: 24,
      }}>
        <h2 style={{
          fontSize: 15, fontWeight: 500, color: T.black,
          margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Plus size={16} color={T.secondary} />
          Add new website
        </h2>
        <form onSubmit={handleSubmit}>
          {mutation.isError && (
            <div style={{
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
              color: '#b91c1c', fontSize: 13,
            }}>
              Error creating website. Please try again.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Website name</label>
              <input
                type="text" placeholder="e.g., Company Website"
                value={websiteName} onChange={(e) => setWebsiteName(e.target.value)}
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(0,0,0,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Website URL</label>
              <input
                type="url" placeholder="https://example.com"
                value={websiteURL} onChange={(e) => setWebsiteURL(e.target.value)}
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(0,0,0,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Check interval</label>
              <select
                value={intervalValue} onChange={(e) => setIntervalValue(Number(e.target.value))}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,0,0,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
              >
                <option value={1}>Every 1 minute</option>
                <option value={5}>Every 5 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: '10px 20px',
                background: T.black, color: T.white,
                border: 'none', borderRadius: 9999,
                fontSize: 14, fontWeight: 500,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                opacity: mutation.isPending ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 7,
                whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => { if (!mutation.isPending) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => e.currentTarget.style.opacity = mutation.isPending ? '0.6' : '1'}
            >
              <Plus size={15} />
              {mutation.isPending ? 'Adding…' : 'Add monitor'}
            </button>
          </div>
        </form>
      </div>

      {/* Websites list */}
      <div style={{ background: T.white, borderRadius: 16, boxShadow: T.shadowCard, overflow: 'hidden' }}>
        {/* List header */}
        <div style={{
          padding: '16px 22px', borderBottom: `1px solid ${T.borderSubtle}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={15} color={T.secondary} />
            <span style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Monitored websites
            </span>
            <span style={{ fontSize: 12, color: T.muted, fontFamily: 'ui-monospace, monospace' }}>
              ({filtered.length})
            </span>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
            <input
              type="text" placeholder="Search…"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...inputStyle, width: 220, padding: '8px 14px 8px 34px', fontSize: 13,
                background: T.surface,
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,0,0,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13 }}>Loading…</div>
        ) : isError ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <XCircle size={28} color={T.border} style={{ marginBottom: 10 }} />
            <p style={{ color: T.muted, fontSize: 13 }}>Failed to load websites</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Search size={28} color={T.border} style={{ marginBottom: 10 }} />
            <p style={{ color: T.muted, fontSize: 13 }}>No websites found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ marginTop: 12, fontSize: 13, color: T.secondary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Status', 'Website', 'URL', 'Interval', 'Response', 'Last Check', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((site, idx) => (
                  <tr
                    key={site.id}
                    style={{ borderBottom: `1px solid ${T.borderSubtle}`, cursor: 'pointer', transition: 'background 0.12s' }}
                    onClick={() => navigate(`/dashboard/websites/${site.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = T.surface}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 18px', fontSize: 13, color: T.muted, fontFamily: 'ui-monospace, monospace' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StatusPill up={site.last_status} />
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 14, fontWeight: 500, color: T.black }}>
                      {site.website_name}
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: T.muted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {site.website_url.replace(/^https?:\/\//, '')}
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: T.secondary }}>
                      {site.interval}m
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, fontFamily: 'ui-monospace, monospace', color: T.secondary }}>
                      {site.last_response_time ? `${Math.round(site.last_response_time)}ms` : '—'}
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 12, color: T.muted }}>
                      {site.last_checked ? new Date(site.last_checked).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <IconBtn icon={Pencil} title="Edit" />
                        <IconBtn icon={site.is_active !== false ? Pause : Play} title={site.is_active !== false ? 'Pause' : 'Resume'} />
                        <IconBtn icon={RotateCw} title="Check now" />
                        <IconBtn icon={Trash2} title="Delete" hoverColor="#b91c1c" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsitesPage;
