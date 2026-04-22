import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi } from '../services/adminApi.js';
import './AdminDashboard.css';

function timeAgo(iso) {
  if (!iso) return 'never';
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function StatusBadge({ ok }) {
  return (
    <span className={`status-badge ${ok ? 'status-badge--ok' : 'status-badge--err'}`}>
      {ok ? 'OK' : 'DOWN'}
    </span>
  );
}

function JobStatusBadge({ status }) {
  if (!status) return <span className="status-badge status-badge--none">-</span>;
  return (
    <span className={`status-badge ${status === 'success' ? 'status-badge--ok' : 'status-badge--err'}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [trafficRange, setTrafficRange] = useState('24h');
  const [traffic, setTraffic] = useState(null);
  const [games, setGames] = useState(null);
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [t, g, h, j] = await Promise.all([
        adminApi.getTraffic(trafficRange),
        adminApi.getGames(),
        adminApi.getHealth(),
        adminApi.getJobs(),
      ]);
      setTraffic(t);
      setGames(g);
      setHealth(h);
      setJobs(j);
      setError('');
    } catch (err) {
      if (err.message === 'Unauthorized') {
        navigate('/admin');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trafficRange, navigate]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  async function handleLogout() {
    await adminApi.logout();
    navigate('/admin');
  }

  if (loading && !traffic) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-topbar">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-topbar-actions">
          <button className="admin-btn admin-btn--secondary" onClick={() => { setLoading(true); fetchAll(); }}>
            Refresh now
          </button>
          <button className="admin-btn admin-btn--danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {/* Traffic & Visitors */}
      <section className="admin-card">
        <div className="admin-card-header">
          <h2>Traffic &amp; Visitors</h2>
          <div className="admin-toggle-group">
            {['24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                className={`admin-toggle ${trafficRange === r ? 'admin-toggle--active' : ''}`}
                onClick={() => setTrafficRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {traffic ? (
          <>
            <div className="admin-stat-row">
              <div className="admin-stat-card">
                <div className="admin-stat-value">{traffic.totalViews.toLocaleString()}</div>
                <div className="admin-stat-label">Total Views</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{traffic.uniqueVisitors.toLocaleString()}</div>
                <div className="admin-stat-label">Unique Visitors</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{traffic.humanViews.toLocaleString()}</div>
                <div className="admin-stat-label">Human Views</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{traffic.botViews.toLocaleString()}</div>
                <div className="admin-stat-label">Bot Views</div>
              </div>
            </div>

            {traffic.viewsOverTime.length > 0 && (
              <div className="admin-chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={traffic.viewsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey={trafficRange === '24h' ? 'hour' : 'day'}
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return trafficRange === '24h'
                          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6 }}
                      labelStyle={{ color: 'var(--color-text)' }}
                      itemStyle={{ color: 'var(--color-accent)' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="admin-tables-row">
              <div className="admin-table-wrapper">
                <h3>Top Pages</h3>
                <table className="admin-table">
                  <thead><tr><th>Path</th><th>Views</th></tr></thead>
                  <tbody>
                    {traffic.topPaths.map((p) => (
                      <tr key={p.path}><td>{p.path}</td><td>{p.views}</td></tr>
                    ))}
                    {traffic.topPaths.length === 0 && <tr><td colSpan={2}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="admin-table-wrapper">
                <h3>Top Referrers</h3>
                <table className="admin-table">
                  <thead><tr><th>Referrer</th><th>Views</th></tr></thead>
                  <tbody>
                    {traffic.topReferrers.map((r) => (
                      <tr key={r.referrer}><td className="admin-cell-ellipsis">{r.referrer}</td><td>{r.views}</td></tr>
                    ))}
                    {traffic.topReferrers.length === 0 && <tr><td colSpan={2}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="admin-empty">No traffic data yet</div>
        )}
      </section>

      {/* Game Player Data */}
      <section className="admin-card">
        <h2>Game Player Data</h2>
        {games ? (
          <>
            <div className="admin-stat-row">
              <div className="admin-stat-card">
                <div className="admin-stat-value">{games.totalGamesTracked}</div>
                <div className="admin-stat-label">Games Tracked</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{games.recentSteamApiErrors}</div>
                <div className="admin-stat-label">Steam API Errors</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">{games.lastSteamApiCallAt ? timeAgo(games.lastSteamApiCallAt) : 'never'}</div>
                <div className="admin-stat-label">Last Steam API Call</div>
              </div>
            </div>
            <div className="admin-table-wrapper">
              <h3>Top 10 by Current Players</h3>
              <table className="admin-table">
                <thead><tr><th>App ID</th><th>Name</th><th>Current Players</th></tr></thead>
                <tbody>
                  {games.topGamesByCurrentPlayers.map((g) => (
                    <tr key={g.appId || g.appid}>
                      <td>{g.appId || g.appid}</td>
                      <td>{g.name}</td>
                      <td>{(g.currentPlayers || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="admin-empty">Loading...</div>
        )}
      </section>

      {/* System Health */}
      <section className="admin-card">
        <h2>System Health</h2>
        {health ? (
          <>
            <div className="admin-stat-row">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Database</span>
                <StatusBadge ok={health.dbConnected} />
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">DB Latency</span>
                <span className="admin-stat-value">{health.dbLatencyMs}ms</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Uptime</span>
                <span className="admin-stat-value">
                  {health.backendUptimeSec >= 3600
                    ? `${Math.floor(health.backendUptimeSec / 3600)}h ${Math.floor((health.backendUptimeSec % 3600) / 60)}m`
                    : `${Math.floor(health.backendUptimeSec / 60)}m ${health.backendUptimeSec % 60}s`}
                </span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Memory (RSS)</span>
                <span className="admin-stat-value">{health.memoryMb.rss} MB</span>
              </div>
            </div>
            <div className="admin-stat-row">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Heap Used</span>
                <span className="admin-stat-value">{health.memoryMb.heapUsed} / {health.memoryMb.heapTotal} MB</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Node.js</span>
                <span className="admin-stat-value">{health.nodeVersion}</span>
              </div>
            </div>

            <div className="admin-errors-section">
              <button className="admin-errors-toggle" onClick={() => setErrorsExpanded(!errorsExpanded)}>
                {errorsExpanded ? 'Hide' : 'Show'} Recent Errors ({health.lastErrors.length})
              </button>
              {errorsExpanded && (
                <div className="admin-errors-list">
                  {health.lastErrors.length === 0 && <div className="admin-empty">No recent errors</div>}
                  {health.lastErrors.map((e, i) => (
                    <div key={i} className="admin-error-item">
                      <span className="admin-error-time">{new Date(e.timestamp).toLocaleString()}</span>
                      <span className="admin-error-msg">{e.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="admin-empty">Loading...</div>
        )}
      </section>

      {/* Scheduler Jobs */}
      <section className="admin-card">
        <h2>Scheduler Jobs</h2>
        {jobs ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Last Run</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Next Run</th>
                  <th>Errors (24h)</th>
                </tr>
              </thead>
              <tbody>
                {jobs.jobs.map((j) => (
                  <tr key={j.name}>
                    <td>{j.name}</td>
                    <td>{j.lastRunAt ? timeAgo(j.lastRunAt) : 'never'}</td>
                    <td><JobStatusBadge status={j.lastRunStatus} /></td>
                    <td>{j.lastRunDurationMs != null ? `${(j.lastRunDurationMs / 1000).toFixed(1)}s` : '-'}</td>
                    <td>{j.nextRunAt ? timeAgo(j.nextRunAt) : '-'}</td>
                    <td>{j.errorCount24h}</td>
                  </tr>
                ))}
                {jobs.jobs.length === 0 && <tr><td colSpan={6}>No jobs registered</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">Loading...</div>
        )}
      </section>
    </div>
  );
}
