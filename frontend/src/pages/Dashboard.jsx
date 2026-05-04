import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Globe, Sliders, Activity, LogOut, PanelLeft } from 'lucide-react';
import { useAuthStore } from '../utils/authStore';

const NAV = [
  { path: '/dashboard', label: 'Overview', icon: LayoutGrid, end: true },
  { path: '/dashboard/websites', label: 'Monitors', icon: Globe },
  { path: '/dashboard/settings', label: 'Settings', icon: Sliders },
];

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const username = useAuthStore((s) => s.user?.username ?? 'User');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dash-root">
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={14} color="#000" />
          </div>
          {!collapsed && <span className="sidebar-logo-text">Uptime</span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const active = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`nav-item ${active ? 'nav-item--active' : ''}`}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{username[0]?.toUpperCase()}</div>
            {!collapsed && <span className="sidebar-username">{username}</span>}
          </div>

          <button
            className="nav-item"
            onClick={() => logout()}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>

          <button
            className="nav-item"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <PanelLeft
              size={15}
              style={{
                flexShrink: 0,
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.22s',
              }}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;