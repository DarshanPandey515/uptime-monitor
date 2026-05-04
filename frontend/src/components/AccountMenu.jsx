import React from 'react';
import * as Icons from 'phosphor-react';

const AccountMenu = ({ user, showMenu, onToggle, onClose, onLogout }) => {
  const T = {
    white: '#ffffff',
    surface: '#f5f5f5',
    black: '#000000',
    secondary: '#4e4e4e',
    muted: '#777169',
    border: '#e5e5e5',
    borderSubtle: 'rgba(0,0,0,0.05)',
    shadowCard: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px',
    shadowButton: 'rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px',
  };

  const menuBtnStyle = (danger) => ({
    width: '100%',
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 9,
    fontSize: 13, fontWeight: 500,
    color: danger ? '#b91c1c' : T.secondary,
    background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left',
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.12s, color 0.12s',
    letterSpacing: '0.14px',
  });

  return (
    <div style={{
      padding: '12px 8px',
      borderTop: `1px solid ${T.borderSubtle}`,
      position: 'relative',
    }}>
      {/* Trigger */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10,
          background: showMenu ? T.surface : 'none',
          border: showMenu ? `1px solid ${T.border}` : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: showMenu ? T.shadowCard : 'none',
        }}
        onMouseEnter={e => {
          if (!showMenu) e.currentTarget.style.background = T.surface;
        }}
        onMouseLeave={e => {
          if (!showMenu) e.currentTarget.style.background = 'none';
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: T.black,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: T.white,
          flexShrink: 0,
        }}>
          {user?.username?.[0]?.toUpperCase() ?? 'U'}
        </div>

        {/* Name */}
        <span style={{
          flex: 1, textAlign: 'left',
          fontSize: 13, fontWeight: 500, color: T.black,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '0.14px',
        }}>
          {user?.username ?? 'User'}
        </span>

        <Icons.CaretDown
          size={13}
          weight="bold"
          color={T.muted}
          style={{ flexShrink: 0, transition: 'transform 0.18s', transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={onClose}
          />

          {/* Menu card */}
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0, right: 0,
            background: T.white,
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 8px 24px',
            zIndex: 50,
            overflow: 'hidden',
            padding: 6,
          }}>
            <button
              onClick={onClose}
              style={menuBtnStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.background = T.surface; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <Icons.User size={15} weight="bold" color={T.muted} />
              Profile
            </button>

            <button
              onClick={onClose}
              style={menuBtnStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.background = T.surface; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <Icons.Gear size={15} weight="bold" color={T.muted} />
              Account settings
            </button>

            {/* Divider */}
            <div style={{ height: 1, background: T.borderSubtle, margin: '4px 0' }} />

            <button
              onClick={onLogout}
              style={menuBtnStyle(true)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <Icons.SignOut size={15} weight="bold" color="#b91c1c" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountMenu;
