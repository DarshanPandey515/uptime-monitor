import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const monitors = [
  { name: 'api.acme.com', url: 'https://api.acme.com/health', status: 'up', uptime: '99.98%', latency: '142ms', bars: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1] },
  { name: 'app.acme.com', url: 'https://app.acme.com', status: 'up', uptime: '100%', latency: '89ms', bars: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { name: 'checkout.acme.com', url: 'https://checkout.acme.com', status: 'down', uptime: '97.2%', latency: '—', bars: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0] },
  { name: 'docs.acme.com', url: 'https://docs.acme.com', status: 'paused', uptime: '—', latency: '—', bars: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3] },
]

function BarColor({ val }) {
  if (val === 0) return '#ef4444'
  if (val < 1) return '#e5e5e5'
  return '#22c55e'
}

export default function Landing() {
  const [activeMonitors, setActiveMonitors] = useState(monitors)
  const [scrolled, setScrolled] = useState(false)
  
  // Authentication state: read from localStorage on initial load
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('uptime_auth') === 'true'
  })

  // Sync authentication state across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'uptime_auth') {
        setIsLoggedIn(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Helper to update auth state and localStorage
  const login = () => {
    localStorage.setItem('uptime_auth', 'true')
    setIsLoggedIn(true)
  }

  const logout = () => {
    localStorage.setItem('uptime_auth', 'false')
    setIsLoggedIn(false)
  }

  const toggleMonitor = (idx) => {
    setActiveMonitors(prev => prev.map((m, i) => {
      if (i !== idx) return m
      return { ...m, status: m.status === 'paused' ? 'up' : 'paused' }
    }))
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* NAV */}
      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`}>
        <div className="nav-logo">
          Uptime
        </div>
        <div className="nav-ctas">
          {!isLoggedIn ? (
            <Link to='/login' className="btn-black">Sign in</Link>
          ) : (
            <>
              <Link to='/dashboard' className="btn-black">Dashboard</Link>
              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          monitoring that gets out of your way
        </div>
        <h1>Know before<br />your users do.</h1>
        <p className="hero-sub">
          Add any URL, set your check interval, and get alerted the moment something goes wrong. Simple uptime monitoring that gets out of your way.
        </p>
        <div className="hero-ctas">
          <Link to='/login' className="btn-warm">
            Start monitoring free
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section className="mockup-section">
        <p className="section-label">Dashboard</p>
        <h2 className="section-title">Everything at a glance</h2>
        <div className="mockup-window">
          <div className="mockup-titlebar">
            <div className="titlebar-dot" style={{ background: '#ff5f57' }} />
            <div className="titlebar-dot" style={{ background: '#febc2e' }} />
            <div className="titlebar-dot" style={{ background: '#28c840' }} />
          </div>
          <div className="mockup-body">
            {activeMonitors.map((m, i) => (
              <div className="monitor-row" key={i}>
                <div className="monitor-info">
                  <div className={`status-pill ${m.status === 'up' ? 'pill-up' : m.status === 'down' ? 'pill-down' : 'pill-paused'}`}>
                    {m.status === 'up' ? 'Up' : m.status === 'down' ? 'Down' : 'Paused'}
                  </div>
                  <div>
                    <div className="monitor-name">{m.name}</div>
                    <div className="monitor-url">{m.url}</div>
                  </div>
                </div>
                <div className="monitor-stats">
                  <div className="uptime-bars">
                    {m.bars.map((b, j) => (
                      <div key={j} className="uptime-bar" style={{ background: BarColor({ val: b }) }} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="stat-label">Uptime</div>
                    <div className="stat-value">{m.uptime}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="stat-label">Latency</div>
                    <div className="stat-value">{m.latency}</div>
                  </div>
                  <button
                    onClick={() => toggleMonitor(i)}
                    style={{
                      fontSize: '12px', fontWeight: 500, background: 'none',
                      border: '1px solid var(--border)', borderRadius: '9999px',
                      padding: '4px 12px', cursor: 'pointer', color: 'var(--text-muted)',
                      transition: 'all 0.15s', whiteSpace: 'nowrap'
                    }}
                  >
                    {m.status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <p className="section-label">Features</p>
        <h2 className="section-title">Built for peace of mind</h2>
        <div className="cards-grid">
          <div className="card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg>
            </div>
            <h3>30-second checks</h3>
            <p>Your monitors run every 30 seconds from 16 locations worldwide. Incidents are confirmed across multiple regions before you're alerted.</p>
          </div>
          <div className="card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3>Email alerts</h3>
            <p>Get notified the moment your site goes down — and again when it recovers. Add multiple recipients and configure per-monitor alert rules.</p>
          </div>
          <div className="card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            </div>
            <h3>Add any URL</h3>
            <p>Paste any HTTP or HTTPS URL and you're monitoring. Track websites, APIs, health endpoints — anything that returns a status code.</p>
          </div>
          <div className="card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
            </div>
            <h3>Uptime history</h3>
            <p>See 90 days of uptime data at a glance with the response time graph and daily bars. Know exactly when incidents happened and for how long.</p>
          </div>
          <div className="card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h3>SSL monitoring</h3>
            <p>Get warned before your SSL certificate expires. We check expiry daily and alert you 30, 14, and 7 days before the deadline.</p>
          </div>
          <div className="card">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" /></svg>
            </div>
            <h3>Public status pages</h3>
            <p>Share a beautiful, real-time status page with your users. Customize it with your brand. No technical setup required.</p>
          </div>
        </div>
      </section>

      {/* ALERTS */}
      <section className="alerts-section">
        <p className="section-label">Alerts</p>
        <h2 className="section-title">Instant, clear notifications</h2>
        <div className="alerts-inner">
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, letterSpacing: '0.18px' }}>
            When something breaks, you'll know immediately — not 20 minutes later when a user emails you.
          </p>
          <div className="alert-preview">
            <div className="alert-header">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div>
                <div className="alert-title">checkout.acme.com is down</div>
                <div className="alert-time">2 minutes ago · From 4 locations</div>
              </div>
            </div>
            <div className="alert-body">
              Your monitor returned HTTP 503. The site has been unreachable since 14:32 UTC. Response time before incident: 121ms.
            </div>
            <div className="alert-actions">
              <button className="alert-btn alert-btn-primary">View incident</button>
              <button className="alert-btn alert-btn-ghost">Acknowledge</button>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section">
        <p className="section-label">Pricing</p>
        <h2 className="section-title">Simple, honest pricing</h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-label">Hobby</div>
            <div className="pricing-price">$0</div>
            <div className="pricing-period">forever free</div>
            <ul className="pricing-features">
              {['3 monitors', '5-minute checks', 'Email alerts', '30-day history'].map(f => (
                <li key={f}>
                  <svg className="check" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button className="btn-pricing">Get started free</button>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-label">Pro</div>
            <div className="pricing-price">$oon</div>
            <div className="pricing-period">per month</div>
            <ul className="pricing-features">
              {['50 monitors', '30-second checks', 'Email + Slack alerts', '90-day history', 'Public status pages', 'SSL monitoring'].map(f => (
                <li key={f}>
                  <svg className="check" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button className="btn-pricing-featured">Start Pro trial</button>
          </div>

          <div className="pricing-card">
            <div className="pricing-label">Team</div>
            <div className="pricing-price">$oon</div>
            <div className="pricing-period">per month</div>
            <ul className="pricing-features">
              {['Unlimited monitors', '10-second checks', 'All alert channels', '1-year history', 'Team members', 'API access'].map(f => (
                <li key={f}>
                  <svg className="check" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button className="btn-pricing">Start Team trial</button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section">
        <h2>Start monitoring<br />in 60 seconds.</h2>
        <p>No credit card required. Free forever on the Hobby plan.</p>
        <Link to='/login' className="btn-warm" style={{ fontSize: '16px', padding: '14px 28px 14px 20px' }}>
          Add your first monitor
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">© 2025 Uptime</div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Status</a>
          <a href="#">Docs</a>
          {/* Demo auth toggle for development — click to simulate login/logout */}
          <button onClick={isLoggedIn ? logout : login} className="demo-auth-btn">
            🔑 {isLoggedIn ? 'Logout (demo)' : 'Login (demo)'}
          </button>
        </div>
      </footer>

      <style>{`
        .btn-logout {
          background: transparent;
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          color: var(--text-muted, #64748b);
          transition: all 0.15s;
          margin-left: 12px;
        }
        .btn-logout:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .demo-auth-btn {
          background: none;
          border: none;
          font-size: 13px;
          color: #94a3b8;
          cursor: pointer;
          margin-left: 16px;
          text-decoration: underline;
          font-family: inherit;
        }
        .demo-auth-btn:hover {
          color: #3b82f6;
        }
      `}</style>
    </>
  )
}