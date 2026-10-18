import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, Bug, CheckCircle2, CircleUserRound, ClipboardList, Filter, LogOut, Plus, Search, ShieldCheck, ShieldAlert, Trash2, X } from 'lucide-react';
import { api } from './api.js';

const emptyForm = { title: '', description: '', category: 'Phishing', priority: 'Medium', status: 'Open', affectedAsset: '' };
const statuses = ['Open', 'Investigating', 'Contained', 'Resolved'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const categories = ['Phishing', 'Malware', 'Unauthorized Access', 'Data Exposure', 'Network', 'Other'];
const fmt = (date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('sentinel_token', data.token);
      onAuth(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-wrap"><div className="auth-card">
    <div className="brand-mark large"><ShieldCheck size={27}/></div>
    <p className="eyebrow">SECURITY OPERATIONS</p><h1>Sentinel<span>.</span></h1>
    <p className="muted">Cyber Incident Management System</p>
    <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button></div>
    <form onSubmit={submit} className="stack">
      {mode === 'register' && <label>Full name<input name="name" value={form.name} onChange={update} placeholder="Your name" minLength="2" maxLength="60" required /></label>}
      <label>Email address<input type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" required /></label>
      <label>Password<input type="password" name="password" value={form.password} onChange={update} placeholder="At least 8 characters" minLength="8" required /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create account'} <ArrowUpRight size={17}/></button>
    </form>
    <p className="fineprint"><ShieldCheck size={14}/> Your incident records are private to your account.</p>
  </div><div className="auth-side"><div className="orb orb-one"/><div className="orb orb-two"/><div className="side-content"><div className="live-pill"><span/> INCIDENT RESPONSE WORKSPACE</div><h2>See the threat.<br/>Own the response.</h2><p>Track security incidents, coordinate response status, and keep your lab operations organized in one place.</p><div className="side-stats"><div><strong>24/7</strong><span>Visibility</span></div><div><strong>360°</strong><span>Incident view</span></div><div><strong>1 place</strong><span>To respond</span></div></div></div></div></div>;
}

function Badge({ children, kind = '' }) { return <span className={`badge ${kind || String(children).toLowerCase().replaceAll(' ', '-')}`}>{children}</span>; }
function Modal({ incident, onClose, onSave }) {
  const [form, setForm] = useState(incident || emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) { e.preventDefault(); setError(''); setBusy(true); try { await onSave(form, incident?._id); onClose(); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal">
    <div className="modal-head"><div><p className="eyebrow">INCIDENT RECORD</p><h2>{incident ? 'Update incident' : 'Report an incident'}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20}/></button></div>
    <form className="stack" onSubmit={submit}>
      <label>Incident title<input name="title" value={form.title} onChange={change} minLength="4" maxLength="120" placeholder="e.g. Suspicious login activity" required /></label>
      <label>Description<textarea name="description" value={form.description} onChange={change} minLength="10" maxLength="3000" rows="4" placeholder="What happened? Include only safe, non-sensitive demo details." required /></label>
      <div className="form-grid"><label>Category<select name="category" value={form.category} onChange={change}>{categories.map(x => <option key={x}>{x}</option>)}</select></label><label>Priority<select name="priority" value={form.priority} onChange={change}>{priorities.map(x => <option key={x}>{x}</option>)}</select></label></div>
      <div className="form-grid"><label>Status<select name="status" value={form.status} onChange={change}>{statuses.map(x => <option key={x}>{x}</option>)}</select></label><label>Affected asset<input name="affectedAsset" value={form.affectedAsset} onChange={change} maxLength="120" placeholder="e.g. LAB-PC-01" /></label></div>
      {error && <p className="error">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : incident ? 'Save changes' : 'Create incident'}</button></div>
    </form>
  </div></div>;
}

function AppShell({ user, onLogout }) {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {}, byPriority: {}, recent: [] });
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', category: '' });
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState('overview');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
      const [items, summary] = await Promise.all([api(`/incidents?${query}`), api('/incidents/stats/summary')]);
      setIncidents(items); setStats(summary);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { const id = setTimeout(load, filters.search ? 250 : 0); return () => clearTimeout(id); }, [load]);
  const save = async (form, id) => { await api(id ? `/incidents/${id}` : '/incidents', { method: id ? 'PUT' : 'POST', body: JSON.stringify(form) }); await load(); };
  const remove = async id => { if (!confirm('Delete this incident permanently?')) return; try { await api(`/incidents/${id}`, { method: 'DELETE' }); await load(); } catch (err) { setError(err.message); } };
  const activeCount = (stats.byStatus?.Open || 0) + (stats.byStatus?.Investigating || 0);
  const criticalCount = stats.byPriority?.Critical || 0;
  const pageTitle = page === 'overview' ? 'Overview' : 'Incident register';

  return <div className="app-layout">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><ShieldCheck size={21}/></div><div><strong>Sentinel<span>.</span></strong><small>CYBER RESPONSE</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${page === 'overview' ? 'selected' : ''}`} onClick={() => setPage('overview')}><Activity size={18}/> Overview</button>
      <button className={`nav-item ${page === 'incidents' ? 'selected' : ''}`} onClick={() => setPage('incidents')}><ClipboardList size={18}/> Incident register <span className="nav-count">{stats.total}</span></button>
      <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={17}/><div><strong>Workspace secure</strong><span>Authenticated session</span></div></div><div className="user-row"><div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div><div className="user-info"><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-btn logout" title="Sign out" onClick={onLogout}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>{pageTitle}</strong></div><div className="top-actions"><span className="system-status"><span/> API workspace</span><button className="primary" onClick={() => setModal({ ...emptyForm })}><Plus size={17}/> New incident</button></div></header>
      <div className="page-content"><div className="page-heading"><div><p className="eyebrow">SECURITY OPERATIONS CENTER</p><h1>{page === 'overview' ? `Good to see you, ${user.name.split(' ')[0]}.` : 'Incident register'}</h1><p className="muted">{page === 'overview' ? 'Here is the current status of your incident response workspace.' : 'Search, filter, and manage your reported security incidents.'}</p></div><div className="date-chip"><Activity size={16}/> LIVE WORKSPACE</div></div>
      {error && <div className="alert-error"><AlertTriangle size={17}/>{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
      {page === 'overview' && <>
        <div className="stat-grid">
          <StatCard icon={<ClipboardList size={19}/>} label="Total incidents" value={stats.total || 0} note="All reported records" tone="blue"/>
          <StatCard icon={<AlertTriangle size={19}/>} label="Active response" value={activeCount} note="Open or investigating" tone="amber"/>
          <StatCard icon={<ShieldAlert size={19}/>} label="Critical priority" value={criticalCount} note="Needs urgent review" tone="red"/>
          <StatCard icon={<CheckCircle2 size={19}/>} label="Resolved" value={stats.byStatus?.Resolved || 0} note="Closed incidents" tone="green"/>
        </div>
        <div className="dashboard-grid"><section className="panel status-panel"><div className="panel-head"><div><h2>Response status</h2><p>Breakdown of your incident queue</p></div><button className="text-btn" onClick={() => setPage('incidents')}>View register <ArrowUpRight size={15}/></button></div>
          <div className="status-list">{statuses.map((s, i) => { const count = stats.byStatus?.[s] || 0; const pct = stats.total ? Math.round(count / stats.total * 100) : 0; return <div className="status-row" key={s}><div className="status-label"><span className={`status-dot dot-${i}`}/><span>{s}</span><strong>{count}</strong></div><div className="progress"><span className={`bar-${i}`} style={{ width: `${pct}%` }}/></div></div>; })}</div>
          <div className="priority-summary"><div><span className="priority-marker critical"/><span>Critical</span><strong>{stats.byPriority?.Critical || 0}</strong></div><div><span className="priority-marker high"/><span>High</span><strong>{stats.byPriority?.High || 0}</strong></div><div><span className="priority-marker medium"/><span>Medium</span><strong>{stats.byPriority?.Medium || 0}</strong></div><div><span className="priority-marker low"/><span>Low</span><strong>{stats.byPriority?.Low || 0}</strong></div></div>
        </section><section className="panel recent-panel"><div className="panel-head"><div><h2>Recently reported</h2><p>Latest activity in your workspace</p></div><div className="panel-icon"><Activity size={17}/></div></div>
          {stats.recent?.length ? <div className="recent-list">{stats.recent.map(item => <button className="recent-item" key={item._id} onClick={() => { setPage('incidents'); setFilters({ search: item.title, status: '', priority: '', category: '' }); }}><div className="recent-icon"><Bug size={17}/></div><div className="recent-copy"><strong>{item.title}</strong><span>{item.category} · {fmt(item.createdAt)}</span></div><Badge kind={item.priority.toLowerCase()}>{item.priority}</Badge></button>)}</div> : <EmptyState text="No incidents reported yet. Create your first incident to get started."/>}
        </section></div>
        <section className="panel latest-panel"><div className="panel-head"><div><h2>Latest incidents</h2><p>Quick access to your most recent records</p></div><button className="text-btn" onClick={() => setPage('incidents')}>Open register <ArrowUpRight size={15}/></button></div><IncidentTable incidents={incidents.slice(0, 5)} loading={loading} onEdit={item => setModal(item)} onDelete={remove}/></section>
      </>}
      {page === 'incidents' && <section className="panel register-panel"><div className="filter-row"><div className="search-box"><Search size={17}/><input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search title, description, asset…"/></div><div className="filter-select"><Filter size={16}/><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></div><select aria-label="Priority filter" className="filter-control" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option>{priorities.map(s => <option key={s}>{s}</option>)}</select><select aria-label="Category filter" className="filter-control" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map(s => <option key={s}>{s}</option>)}</select></div><div className="register-summary"><span>{incidents.length} result{incidents.length === 1 ? '' : 's'}</span><button className="clear-btn" onClick={() => setFilters({ search: '', status: '', priority: '', category: '' })}>Clear filters</button></div><IncidentTable incidents={incidents} loading={loading} onEdit={item => setModal(item)} onDelete={remove}/></section>}
      <footer className="footer"><span>© 2026 Sentinel Security Workspace</span><span><ShieldCheck size={14}/> MERN portfolio project · Demo data only</span></footer>
      </div>
    </main>
    {modal && <Modal incident={modal._id ? modal : null} onClose={() => setModal(null)} onSave={save}/>}
  </div>;
}
function StatCard({ icon, label, value, note, tone }) { return <div className="stat-card"><div className="stat-top"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-trend"><ArrowUpRight size={14}/></span></div><p>{label}</p><strong>{value}</strong><span className="stat-note">{note}</span></div>; }
function EmptyState({ text }) { return <div className="empty-state"><div className="empty-icon"><ClipboardList size={23}/></div><p>{text}</p></div>; }
function IncidentTable({ incidents, loading, onEdit, onDelete }) {
  if (loading) return <div className="table-message">Loading incident records…</div>;
  if (!incidents.length) return <EmptyState text="No incidents found. Try changing your filters or report a new incident."/>;
  return <div className="table-scroll"><table><thead><tr><th>INCIDENT</th><th>CATEGORY</th><th>PRIORITY</th><th>STATUS</th><th>REPORTED</th><th>ACTIONS</th></tr></thead><tbody>{incidents.map(item => <tr key={item._id}><td><div className="incident-name"><div className="incident-symbol"><Bug size={16}/></div><div><strong>{item.title}</strong><span>{item.affectedAsset || 'No asset specified'}</span></div></div></td><td><span className="category-cell">{item.category}</span></td><td><Badge kind={item.priority.toLowerCase()}>{item.priority}</Badge></td><td><Badge kind={`status-${item.status.toLowerCase()}`}>{item.status}</Badge></td><td className="date-cell">{fmt(item.createdAt)}</td><td><div className="actions"><button className="action-btn" onClick={() => onEdit(item)} title="Edit incident">Edit</button><button className="action-btn delete" onClick={() => onDelete(item._id)} title="Delete incident"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>;
}
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('sentinel_token');
    if (token) api('/incidents/stats/summary').then(() => {
      // Token is valid; user details are stored locally for this demo session.
      const saved = localStorage.getItem('sentinel_user');
      if (saved) setUser(JSON.parse(saved));
      else { localStorage.removeItem('sentinel_token'); }
    }).catch(() => localStorage.removeItem('sentinel_token')).finally(() => setChecking(false));
    else setChecking(false);
  }, []);
  const auth = u => { localStorage.setItem('sentinel_user', JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.removeItem('sentinel_token'); localStorage.removeItem('sentinel_user'); setUser(null); };
  if (checking) return <div className="loading-screen">Loading Sentinel workspace…</div>;
  return user ? <AppShell user={user} onLogout={logout}/> : <AuthScreen onAuth={auth}/>;
}
