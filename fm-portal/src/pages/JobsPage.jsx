// src/pages/JobsPage.jsx
// FM 360 — Live Job Intelligence Portal

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Constants ─────────────────────────────────────────────────
const WORKER_URL = 'https://jobpulse-proxy.elitesprince.workers.dev';

const PLAT_COLORS = {
  linkedin: '#0A66C2', indeed: '#003A9B', glassdoor: '#0CAA41',
  jobberman: '#1E3A5F', myjobmag: '#C0392B', hotnigerianjobs: '#F39C12',
  jobboardng: '#E35205', ngcareers: '#6C3483',
};

const JOB_TYPES = ['Any', 'Full-time', 'Part-time', 'Hybrid', 'Remote'];

const TYPE_COLORS = {
  'Full-time': '#00c9a7', 'Part-time': '#f5a623',
  'Hybrid': '#63b3ed', 'Remote': '#b794f4', 'Any': 'rgba(255,255,255,.3)',
};

const CATEGORIES = [
  { label: 'Finance',            query: 'Finance Director CFO' },
  { label: 'Investment Banking', query: 'Investment Banking Analyst' },
  { label: 'Treasury & Risk',    query: 'Treasury Manager' },
  { label: 'Accounting',         query: 'Accountant ACCA ACA' },
  { label: 'HR & People',        query: 'HR Manager Talent Acquisition' },
  { label: 'Tech / Engineering', query: 'Software Engineer Developer' },
  { label: 'Product',            query: 'Product Manager' },
  { label: 'Data & Analytics',   query: 'Data Analyst Business Intelligence' },
  { label: 'Marketing',          query: 'Marketing Manager Digital Marketing' },
  { label: 'Legal & Compliance', query: 'Legal Counsel Compliance Officer' },
  { label: 'Operations',         query: 'Operations Manager Supply Chain' },
  { label: 'Admin',              query: 'Executive Assistant Office Manager' },
  { label: 'Remote Jobs',        query: 'Remote Finance Accounting' },
  { label: 'Fintech & Banking',  query: 'Fintech Banking CBN' },
  { label: 'Sales & BizDev',     query: 'Sales Business Development' },
];

const LOCATIONS = [
  { label: 'Nigeria',        value: 'Nigeria' },
  { label: 'Lagos',          value: 'Lagos, Nigeria' },
  { label: 'Abuja',          value: 'Abuja, Nigeria' },
  { label: 'London',         value: 'London, UK' },
  { label: 'New York',       value: 'New York, USA' },
  { label: 'Dubai',          value: 'Dubai, UAE' },
  { label: 'South Africa',   value: 'South Africa' },
  { label: 'Remote / Global',value: 'Global / Remote' },
];

// ── Analytics store (localStorage) ───────────────────────────
const SK = 'jp_stats', VK = 'jp_vid';
function blankStats() { return { total: 0, newV: 0, retV: 0, daily: {}, searches: {} }; }
function loadStats()  { try { return JSON.parse(localStorage.getItem(SK)) || blankStats(); } catch { return blankStats(); } }
function saveStats(s) { try { localStorage.setItem(SK, JSON.stringify(s)); } catch {} }
function todayKey()   { return new Date().toISOString().slice(0, 10); }
function last7() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}
function recordVisit() {
  const s = loadStats(), today = todayKey();
  const vid = localStorage.getItem(VK);
  if (!vid) { localStorage.setItem(VK, 'v_' + Math.random().toString(36).slice(2)); s.newV = (s.newV || 0) + 1; }
  else { s.retV = (s.retV || 0) + 1; }
  s.total = (s.total || 0) + 1;
  s.daily[today] = (s.daily[today] || 0) + 1;
  saveStats(s);
}
function recordSearch(term) {
  if (!term || term.length < 2) return;
  const s = loadStats(), k = term.toLowerCase().trim().slice(0, 40);
  s.searches[k] = (s.searches[k] || 0) + 1;
  saveStats(s);
}

function platColor(name) {
  const k = (name || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, val] of Object.entries(PLAT_COLORS)) if (k.includes(key)) return val;
  return '#444';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Spinner ───────────────────────────────────────────────────
function Spin({ size = 14 }) {
  return <span style={{ width: size, height: size, border: '2px solid rgba(0,201,167,.2)', borderTopColor: '#00c9a7', borderRadius: '50%', display: 'inline-block', animation: 'jobSpin .7s linear infinite', flexShrink: 0 }} />;
}

// ── FM Nav bar ────────────────────────────────────────────────
function FMNav({ user, onLogout }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 48, background: 'rgba(10,22,40,.97)', borderBottom: '1px solid rgba(0,201,167,.18)', position: 'sticky', top: 0, zIndex: 300, backdropFilter: 'blur(14px)' }}>
      <a href="../" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <div style={{ width: 26, height: 26, background: '#00c9a7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontSize: 9, fontWeight: 700, color: '#0a1628' }}>FM</div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '-.03em', color: '#e8edf5' }}>FM <span style={{ color: '#00c9a7' }}>Job Portal</span></span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '4px 11px', fontSize: 11, color: 'rgba(232,237,245,.55)', fontFamily: 'monospace' }}>
          👤 {user?.name || '...'}
        </div>
        {[['../','🏠','Home'],['../portal/','←','Portal']].map(([href, icon, label]) => (
          <a key={href} href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'rgba(232,237,245,.55)', fontFamily: 'monospace', fontSize: 11, textDecoration: 'none', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#e8edf5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(232,237,245,.55)'; }}>
            {icon} {label}
          </a>
        ))}
        <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'rgba(232,237,245,.55)', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(224,82,82,.4)'; e.currentTarget.style.color = '#e05252'; e.currentTarget.style.background = 'rgba(224,82,82,.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = 'rgba(232,237,245,.55)'; e.currentTarget.style.background = 'transparent'; }}>
          ⬅ Sign out
        </button>
      </div>
    </div>
  );
}

// ── Analytics panel ────────────────────────────────────────────
function AnalyticsPanel({ open, onClose }) {
  const [stats, setStats] = useState(blankStats());

  useEffect(() => {
    if (open) setStats(loadStats());
  }, [open]);

  if (!open) return null;

  const today = todayKey(), days = last7(), daily = stats.daily || {};
  const maxV = Math.max(1, days.reduce((m, d) => Math.max(m, daily[d] || 0), 0));
  const tot = (stats.newV || 0) + (stats.retV || 0) || 1;
  const np = Math.round((stats.newV || 0) / tot * 100), rp = 100 - np;
  const sorted = Object.entries(stats.searches || {}).sort((a, b) => b[1] - a[1]).slice(0, 7);

  const panelStyle = { background: '#0f1f3d', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, width: '100%', maxWidth: 720, overflow: 'hidden' };
  const thStyle = { fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(232,237,245,.28)', fontWeight: 600, marginBottom: 8, fontFamily: 'monospace' };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px', overflowY: 'auto' }}>
      <div style={panelStyle}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: '#00c9a7', fontWeight: 600, marginBottom: 4, fontFamily: 'monospace' }}>Job Intelligence</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>Visitor Analytics</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,.07)', background: 'transparent', color: 'rgba(232,237,245,.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Total Visits', val: stats.total || 0, sub: 'all time',      color: '#00c9a7' },
              { label: 'Today',        val: (daily[today] || 0), sub: new Date().toLocaleDateString('en-NG',{day:'numeric',month:'short'}), color: '#f5a623' },
              { label: 'New Visitors', val: stats.newV || 0,   sub: np + '% of visitors', color: '#63b3ed' },
              { label: 'Returning',    val: stats.retV || 0,   sub: rp + '% of visitors', color: '#b794f4' },
            ].map(k => (
              <div key={k.label} style={{ background: '#162747', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ ...thStyle, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 700, letterSpacing: '-.03em', color: k.color, lineHeight: 1 }}>{k.val.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'rgba(232,237,245,.28)', marginTop: 4, fontFamily: 'monospace' }}>{k.sub}</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: k.color }} />
              </div>
            ))}
          </div>
          {/* Composition bar */}
          <div>
            <div style={thStyle}>Visitor Composition</div>
            <div style={{ display: 'flex', height: 10, borderRadius: 10, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
              <div style={{ height: '100%', width: np + '%', background: '#63b3ed', borderRadius: 10, transition: 'width .6s' }} />
              <div style={{ height: '100%', width: rp + '%', background: '#b794f4', borderRadius: 10, transition: 'width .6s' }} />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['#63b3ed','New visitors'],['#b794f4','Returning visitors']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(232,237,245,.55)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
                </div>
              ))}
            </div>
          </div>
          {/* Daily bars */}
          <div>
            <div style={thStyle}>Last 7 Days</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {days.map(d => {
                const val = daily[d] || 0, pct = Math.max(Math.round(val / maxV * 100), 2), isToday = d === today;
                const lbl = new Date(d + 'T12:00:00').toLocaleDateString('en-NG', { weekday: 'short' });
                return (
                  <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 9, color: 'rgba(232,237,245,.28)', fontFamily: 'monospace' }}>{val > 0 ? val : ''}</span>
                    <div style={{ width: '100%', height: pct + '%', background: isToday ? '#00c9a7' : 'rgba(0,201,167,.3)', borderRadius: '2px 2px 0 0', transition: 'height .5s' }} />
                    <span style={{ fontSize: 9, color: 'rgba(232,237,245,.28)', fontFamily: 'monospace' }}>{lbl}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Top searches */}
          <div>
            <div style={thStyle}>Top Searches</div>
            {sorted.length === 0
              ? <div style={{ fontSize: 12, color: 'rgba(232,237,245,.28)', padding: '8px 0' }}>No searches yet.</div>
              : sorted.map(([term, count], i) => {
                  const bw = Math.round(count / (sorted[0][1] || 1) * 100);
                  return (
                    <div key={term} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#162747', borderRadius: 6, border: '1px solid rgba(255,255,255,.07)', position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: bw + '%', background: 'rgba(0,201,167,.05)', borderRadius: 6 }} />
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: 'rgba(232,237,245,.28)', minWidth: 22, lineHeight: 1, position: 'relative' }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, position: 'relative' }}>{term}</span>
                      <span style={{ fontSize: 11, color: 'rgba(232,237,245,.28)', fontFamily: 'monospace', position: 'relative' }}>{count} search{count !== 1 ? 'es' : ''}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>
        <div style={{ padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,.07)', fontSize: 10, color: 'rgba(232,237,245,.28)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace' }}>
          <span>Stored locally in your browser · updates each visit</span>
          <button onClick={() => { if (confirm('Reset all analytics data?')) { localStorage.removeItem(SK); localStorage.removeItem(VK); setStats(blankStats()); } }} style={{ fontSize: 10, color: '#e05252', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', opacity: .6 }}>Reset all data</button>
        </div>
      </div>
    </div>
  );
}

// ── Job card ──────────────────────────────────────────────────
function JobCard({ job, index }) {
  const [open, setOpen] = useState(false);
  const color = platColor(job.platform);

  const rawType = job.type;
  const typeStr = rawType == null ? '' : Array.isArray(rawType) ? String(rawType[0] || '') : typeof rawType === 'object' ? String(rawType.name || rawType.label || '') : String(rawType);
  const tc = typeStr ? (typeStr.toLowerCase().includes('remote') ? '#b794f4' : typeStr.toLowerCase().includes('hybrid') ? '#63b3ed' : typeStr.toLowerCase().includes('part') ? '#f5a623' : '#00c9a7') : null;
  const applyUrl = job.url || `https://www.google.com/search?q=${encodeURIComponent('"' + job.title + '" "' + job.company + '" job apply')}`;

  const tagStyle = { fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: 'rgba(232,237,245,.55)', letterSpacing: '.02em', fontFamily: 'monospace' };

  return (
    <div onClick={() => setOpen(v => !v)} style={{ background: open ? '#0f1f3d' : '#0a1628', padding: '22px 24px', cursor: 'pointer', transition: 'background .15s', position: 'relative', overflow: 'hidden', animation: `jobFadeSlide .35s ease ${index * 55}ms both`, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#00c9a7', transform: open ? 'scaleY(1)' : 'scaleY(0)', transformOrigin: 'bottom', transition: 'transform .2s' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 3, background: color, color: '#fff', fontFamily: 'monospace' }}>{job.platform || 'Job Board'}</span>
        <span style={{ fontSize: 10, color: 'rgba(232,237,245,.28)', letterSpacing: '.04em', fontFamily: 'monospace' }}>{job.posted || 'Recently'}</span>
      </div>

      <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#e8edf5', lineHeight: 1.25, marginBottom: 4, letterSpacing: '-.01em' }}>{job.title}</div>
      <div style={{ fontSize: 12, color: '#00c9a7', fontWeight: 500, marginBottom: 12, letterSpacing: '.01em', fontFamily: 'monospace' }}>{job.company}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
        {job.location && <span style={tagStyle}>{job.location}</span>}
        {typeStr && tc && <span style={{ ...tagStyle, color: tc, borderColor: tc + '33', background: tc + '11' }}>{typeStr}</span>}
        {job.salary && <span style={{ ...tagStyle, color: '#8BC4A0', borderColor: 'rgba(139,196,160,.2)', background: 'rgba(139,196,160,.05)' }}>{String(job.salary)}</span>}
      </div>

      <div style={{ fontSize: 10, color: 'rgba(232,237,245,.28)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace' }}>
        Details <span style={{ display: 'inline-block', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>

      {open && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)', animation: 'jobFadeIn .2s ease' }}>
          {job.summary && <p style={{ fontSize: 12, color: 'rgba(232,237,245,.55)', lineHeight: 1.7, marginBottom: 12 }}>{job.summary}</p>}
          {job.requirements?.length > 0 && (
            <ul style={{ listStyle: 'none', marginBottom: 14 }}>
              {job.requirements.slice(0, 4).map((r, i) => (
                <li key={i} style={{ fontSize: 11, color: 'rgba(232,237,245,.5)', lineHeight: 1.6, paddingLeft: 12, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#00c9a7' }}>{'>'}</span>{r}
                </li>
              ))}
            </ul>
          )}
          <a href={applyUrl} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#00c9a7', color: '#0a1628', fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', borderRadius: 6, textDecoration: 'none', transition: 'background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00a98e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#00c9a7'; }}>
            {job.url ? 'Apply Now' : 'Find on Google'} ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function JobsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery]           = useState('');
  const [location, setLocation]     = useState('Nigeria');
  const [selectedType, setSelectedType] = useState('Any');
  const [activeCategory, setActiveCategory] = useState(null);

  const [jobs, setJobs]             = useState([]);
  const [status, setStatus]         = useState(null); // { msg, isErr }
  const [searching, setSearching]   = useState(false);
  const [searched, setSearched]     = useState(false);
  const [resultMeta, setResultMeta] = useState(null);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [barWidth, setBarWidth]     = useState(0);
  const [barActive, setBarActive]   = useState(false);

  const debounceRef = useRef(null);
  const barTimerRef = useRef(null);
  const isAdmin     = user?.role === 'admin';

  useEffect(() => { recordVisit(); }, []);

  // Typing progress bar
  function startBar() {
    setBarActive(true); setBarWidth(0);
    requestAnimationFrame(() => { requestAnimationFrame(() => setBarWidth(100)); });
  }
  function stopBar() { setBarActive(false); setBarWidth(0); }

  async function doSearch(q) {
    if (searching || !q) return;
    setSearching(true);
    setStatus({ msg: 'Scanning LinkedIn · Indeed · Glassdoor · Jobberman · MyJobMag · NGCareers...', isErr: false });
    setJobs([]); setSearched(false); setResultMeta(null);
    recordSearch(q);
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, location, type: selectedType }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Server error ' + res.status); }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const found = data.jobs || [];
      if (!found.length) { setStatus({ msg: 'No recent jobs found. Try broader keywords.', isErr: true }); setSearched(true); setSearching(false); return; }
      setStatus(null);
      setJobs(found);
      const platforms = [...new Set(found.map(j => j.platform).filter(Boolean))];
      setResultMeta({
        count: found.length,
        query: q,
        location,
        type: selectedType !== 'Any' ? selectedType : null,
        srcCount: platforms.length,
        cached: data.cached,
        time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
      });
      setSearched(true);
    } catch (e) {
      setStatus({ msg: e.message, isErr: true });
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  function handleQueryChange(e) {
    const v = e.target.value;
    setQuery(v); setActiveCategory(null);
    if (!v) { stopBar(); clearTimeout(debounceRef.current); return; }
    startBar();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { stopBar(); doSearch(v); }, 1800);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { clearTimeout(debounceRef.current); stopBar(); doSearch(query); }
  }

  function handleTypeSelect(type) {
    setSelectedType(type);
    if (query) doSearch(query);
  }

  function handleCategory(cat) {
    setActiveCategory(cat.query);
    setQuery(cat.query);
    clearTimeout(debounceRef.current);
    stopBar();
    doSearch(cat.query);
  }

  function handleLogout() {
    if (!confirm('Sign out?')) return;
    logout();
    navigate('/portal');
  }

  const showEmpty = searched && jobs.length === 0;
  const showGrid  = jobs.length > 0;

  const inp = { background: 'transparent', border: 'none', outline: 'none', color: '#e8edf5', fontSize: 15, padding: '13px 0', fontFamily: "'Figtree',sans-serif", flex: 1 };

  return (
    <div style={{ background: '#0a1628', color: '#e8edf5', minHeight: '100vh', fontFamily: "'Figtree',sans-serif", fontSize: 14, lineHeight: 1.6, overflowX: 'hidden' }}>
      <style>{`
        @keyframes jobSpin { to { transform: rotate(360deg) } }
        @keyframes jobFadeSlide { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        @keyframes jobFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes jobPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
        @keyframes jobBlink { 0%,100%{opacity:.4} 50%{opacity:1} }
      `}</style>

      {/* Noise + glow overlays */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: .4, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")" }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%,rgba(0,201,167,.06) 0%,transparent 65%)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <FMNav user={user} onLogout={handleLogout} />

        {/* Sub-topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 40px', height: 54, borderBottom: '1px solid rgba(255,255,255,.07)', position: 'sticky', top: 48, background: 'rgba(10,22,40,.95)', backdropFilter: 'blur(16px)', zIndex: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isAdmin && (
              <button onClick={() => setShowAnalytics(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,.07)', background: 'transparent', color: 'rgba(232,237,245,.55)', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.color = '#00c9a7'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = 'rgba(232,237,245,.55)'; }}>
                ▶ Analytics
              </button>
            )}
            <div style={{ fontSize: 11, color: 'rgba(232,237,245,.28)', textAlign: 'right', letterSpacing: '.04em' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#00c9a7', letterSpacing: '.1em', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c9a7', animation: 'jobPulse 2s ease-in-out infinite', display: 'inline-block' }} />
                Live Feed
              </div>
              <strong style={{ display: 'block', color: 'rgba(232,237,245,.55)', fontSize: 12, fontWeight: 500 }}>
                {new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </strong>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section style={{ padding: '60px 40px 44px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -80, width: 500, height: 500, background: 'radial-gradient(ellipse,rgba(0,201,167,.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: '#00c9a7', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 20, height: 1, background: '#00c9a7' }} />
            FM 360 - Job Intelligence
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 700, lineHeight: 1.0, letterSpacing: '-.02em', marginBottom: 16 }}>
            Find every opportunity, <em style={{ fontStyle: 'italic', color: '#00c9a7' }}>every day.</em>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(232,237,245,.55)', maxWidth: 500, lineHeight: 1.7 }}>
            Searches LinkedIn, Indeed, Glassdoor, Jobberman, MyJobMag, NGCareers and 10+ platforms simultaneously — Latest jobs only.
          </p>
        </section>

        {/* Search panel */}
        <section style={{ padding: '0 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ background: '#0f1f3d', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Input row */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#162747', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ padding: '0 14px', color: 'rgba(232,237,245,.28)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>🔍</div>
              <input style={inp} type="text" placeholder="e.g. Finance Manager Lagos  Software Engineer  HR Director Nigeria..." value={query} onChange={handleQueryChange} onKeyDown={handleKeyDown} autoComplete="off" spellCheck={false} />
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,.07)', flexShrink: 0 }} />
              <select value={location} onChange={e => setLocation(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'rgba(232,237,245,.55)', fontSize: 12, fontWeight: 500, padding: '0 14px', cursor: 'pointer', letterSpacing: '.02em', fontFamily: 'monospace' }}>
                {LOCATIONS.map(l => <option key={l.value} value={l.value} style={{ background: '#162747' }}>{l.label}</option>)}
              </select>
              <button onClick={() => { clearTimeout(debounceRef.current); stopBar(); doSearch(query); }} style={{ background: '#00c9a7', border: 'none', color: '#0a1628', fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 22px', minHeight: 48, cursor: 'pointer', transition: 'background .15s', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = '#00a98e'}
                onMouseLeave={e => e.currentTarget.style.background = '#00c9a7'}>
                Search
              </button>
            </div>

            {/* Typing progress bar */}
            <div style={{ height: 2, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden', opacity: barActive ? 1 : 0, transition: 'opacity .2s' }}>
              <div style={{ height: '100%', width: barWidth + '%', background: 'linear-gradient(90deg,#00c9a7,#f5a623)', borderRadius: 2, transition: barActive ? 'width 1.8s linear' : 'none' }} />
            </div>

            {/* Job type filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(232,237,245,.28)', fontWeight: 600, fontFamily: 'monospace', paddingRight: 4 }}>Type:</span>
              {JOB_TYPES.map(type => {
                const active = selectedType === type;
                const dotColor = TYPE_COLORS[type] || 'rgba(255,255,255,.3)';
                const activeStyles = active ? {
                  background: dotColor + '20', color: dotColor,
                  borderColor: dotColor + '66',
                } : {};
                return (
                  <button key={type} onClick={() => handleTypeSelect(type)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 4, border: '1px solid rgba(255,255,255,.07)', background: 'transparent', color: 'rgba(232,237,245,.55)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap', ...activeStyles }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />{type}
                  </button>
                );
              })}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(232,237,245,.28)', fontWeight: 600, fontFamily: 'monospace', paddingRight: 4, whiteSpace: 'nowrap' }}>Quick:</span>
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat.query;
                return (
                  <button key={cat.query} onClick={() => handleCategory(cat)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1px solid ${active ? '#00c9a7' : 'rgba(255,255,255,.07)'}`, background: active ? 'rgba(0,201,167,.1)' : 'transparent', color: active ? '#00c9a7' : 'rgba(232,237,245,.55)', fontSize: 11.5, fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.color = '#00c9a7'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = 'rgba(232,237,245,.55)'; }}}>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Status ticker */}
        {status && (
          <div style={{ margin: '24px 40px 0', padding: '12px 18px', background: status.isErr ? 'rgba(224,82,82,.05)' : 'rgba(0,201,167,.05)', border: `1px solid ${status.isErr ? 'rgba(224,82,82,.2)' : 'rgba(0,201,167,.18)'}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: status.isErr ? '#e05252' : '#00c9a7', fontFamily: 'monospace' }}>
            {!status.isErr && <Spin />}
            <span>{status.msg}</span>
            {!status.isErr && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['HotNigerianJobs','NGCareers','LinkedIn','Indeed','Glassdoor','Remotive'].map(p => (
                  <span key={p} style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 3, background: 'rgba(0,201,167,.08)', color: 'rgba(0,201,167,.7)', animation: 'jobBlink 1.4s ease-in-out infinite', fontFamily: 'monospace' }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results header */}
        {resultMeta && (
          <div style={{ padding: '28px 40px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1 }}>
                <span style={{ color: '#00c9a7' }}>{resultMeta.count}</span> jobs found
              </div>
              <div style={{ fontSize: 11, color: 'rgba(232,237,245,.28)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 4, fontFamily: 'monospace' }}>
                {resultMeta.query.toUpperCase()} · {resultMeta.location.toUpperCase()}
                {resultMeta.type ? ` · ${resultMeta.type.toUpperCase()}` : ''}
                {' · '}{resultMeta.srcCount} SOURCE{resultMeta.srcCount !== 1 ? 'S' : ''}
                {resultMeta.cached ? ' · CACHED' : ''}
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(232,237,245,.28)', textAlign: 'right', fontFamily: 'monospace' }}>
              <strong style={{ display: 'block', color: 'rgba(232,237,245,.55)', fontSize: 12, fontWeight: 500 }}>{resultMeta.time}</strong>
              Last updated
            </div>
          </div>
        )}

        {/* Jobs grid */}
        {showGrid && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 1, background: 'rgba(255,255,255,.07)', borderTop: '1px solid rgba(255,255,255,.07)' }}>
            {jobs.map((job, i) => <JobCard key={i} job={job} index={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!showGrid && (
          <div style={{ padding: '100px 40px', textAlign: 'center', borderTop: showEmpty ? '1px solid rgba(255,255,255,.07)' : 'none' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 80, color: 'rgba(0,201,167,.07)', lineHeight: 1, marginBottom: 20 }}>◆</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 600, color: 'rgba(232,237,245,.2)', marginBottom: 10 }}>
              {showEmpty ? 'No results found' : 'Start your search'}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(232,237,245,.15)', maxWidth: 380, margin: '0 auto', lineHeight: 1.7 }}>
              {showEmpty
                ? 'Try broader keywords or a different location.'
                : <>Type any job title or tap a <strong style={{ color: '#00c9a7', opacity: .6 }}>quick category</strong> — we scan LinkedIn, Indeed, Glassdoor, Jobberman, MyJobMag, NGCareers and more for the latest jobs.</>}
            </p>
          </div>
        )}

        {/* Footer */}
        <footer style={{ padding: '28px 40px', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 60, background: '#0f1f3d' }}>
          <div style={{ fontSize: 11, color: 'rgba(232,237,245,.55)', lineHeight: 1.6, fontFamily: 'monospace' }}>
            <strong style={{ color: 'rgba(232,237,245,.55)' }}>FM 360 Job Portal</strong> — Multi-source live job intelligence<br />
            LinkedIn · Indeed · Glassdoor · Jobberman · MyJobMag · NGCareers · HotNigerianJobs · Remotive · Jobicy · Himalayas
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['LinkedIn','Indeed','Glassdoor','Jobberman','MyJobMag','NGCareers','Remotive','Jobicy'].map(p => (
              <span key={p} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 3, background: 'rgba(255,255,255,.04)', color: 'rgba(232,237,245,.28)', border: '1px solid rgba(255,255,255,.07)', fontFamily: 'monospace' }}>{p}</span>
            ))}
          </div>
        </footer>
      </div>

      <AnalyticsPanel open={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </div>
  );
}
