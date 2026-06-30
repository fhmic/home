// src/pages/PortalPage.jsx
// Complete portal: Login, Signup, Corporate flow, Admin Panel, Org Team Panel

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// ── Constants ────────────────────────────────────────────────
const APP_KEYS = ['jobs', 'markets', 'bankrecon', 'receivables', 'treasury', 'capmax'];
const APP_META = {
  jobs:        { title: 'Job Portal',                    desc: 'FM 360 Live Job Update: Find every opportunity, every day.',                                                    icon: '💼', path: '/jobs' },
  markets:     { title: 'Global Market Intelligence',    desc: 'FM 360 Live Capital Market & FX rate Update: Get up to date Capital Market & FX rate 24/7.',                    icon: '🏦', path: '/markets' },
  bankrecon:   { title: 'Bank Reconciliation',           desc: 'Automated bank-to-GL reconciliation engine with fuzzy matching, multi-pass logic and full audit trail.',        icon: '🏦', path: '/bankrecon' },
  receivables: { title: 'Receivables Tracker',           desc: 'Track debtors, manage outstanding invoices, ageing analysis and automated payment reminders.',                  icon: '🧾', path: '/receivables' },
  treasury:    { title: 'Treasury Dashboard',            desc: 'Cash position monitoring, liquidity management and investment portfolio tracking.',                             icon: '💰', path: '/treasury' },
  capmax:      { title: 'Capital Maximization',          desc: 'Nigerian Investor Portfolio Maximisation Strategy Platform.',                                                   icon: '📊', path: '/capmax' },
};
const APP_LABELS = {  markets: 'Markets', 
                      bankrecon: 'Bank Recon', 
                      receivables: 'Receivables', 
                      treasury: 'Treasury', 
                      jobs: 'Jobs', 
                      capmax: 'Capital Max' 
                   };

// ── Tiny helpers ─────────────────────────────────────────────
function Spinner() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(10,22,40,.3)', borderTopColor: '#0a1628', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}
function ErrBox({ msg }) {
  if (!msg) return null;
  return <div style={{ background: 'rgba(224,82,82,.1)', border: '1px solid rgba(224,82,82,.3)', borderRadius: 10, padding: '9px 13px', fontSize: 12, color: '#e05252', marginBottom: 12, fontFamily: 'monospace' }}>{msg}</div>;
}
function OkBox({ msg }) {
  if (!msg) return null;
  return <div style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 10, padding: '9px 13px', fontSize: 12, color: '#22c55e', marginBottom: 12, fontFamily: 'monospace', lineHeight: 1.6 }}>{msg}</div>;
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, fontFamily: 'monospace', color: '#8fa3bf', marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}
function Inp({ style, ...props }) {
  return (
    <input style={{ width: '100%', padding: '10px 13px', background: '#0f1f3d', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#e8edf5', fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none', ...style }} {...props} />
  );
}
function Btn({ children, color = '#00c9a7', loading, style, ...props }) {
  return (
    <button disabled={loading || props.disabled} style={{ width: '100%', padding: '11px', background: color, border: 'none', borderRadius: 10, color: '#0a1628', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, opacity: (loading || props.disabled) ? 0.6 : 1, ...style }} {...props}>
      {loading ? <><Spinner /> Saving...</> : children}
    </button>
  );
}
function GhostBtn({ children, ...props }) {
  return (
    <button style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#8fa3bf', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 8 }} {...props}>{children}</button>
  );
}
function Modal({ open, onClose, children, maxWidth = 430 }) {
  if (!open) return null;
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(5,13,26,.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <div style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,.13)', borderRadius: 18, width: '100%', maxWidth, padding: '2rem 1.9rem 1.8rem', position: 'relative', margin: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
function ModalClose({ onClose }) {
  return <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: '1px solid rgba(255,255,255,.13)', color: '#4a6080', padding: '5px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>✕</button>;
}
function ModalBrand({ color = '#00c9a7', title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 38, height: 38, background: color, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: '#0a1628', flexShrink: 0 }}>FM</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, letterSpacing: '-.02em' }}>{title}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN: LOGIN
// ═══════════════════════════════════════════════════════════
function LoginScreen({ onOpenSignup, onOpenForgot, onOpenContact }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usr, setUsr] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleLogin() {
    setErr('');
    if (!usr || !pwd) { setErr('Please enter both username and password.'); return; }
    setLoading(true);
    try {
      const { ok, data } = await api.post('/api/auth/login', { username: usr, password: pwd });
      if (!ok) { setErr(data.message || 'Login failed.'); setPwd(''); return; }
      login(data.token, data.user);
      navigate('/portal/dashboard');
    } catch (e) { setErr(e.message); setPwd(''); }
    finally { setLoading(false); }
  }

  function handleKey(e) { if (e.key === 'Enter') handleLogin(); }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32, background: '#050d1a', position: 'relative' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} .portal-fade{animation:fadeUp .4s ease both}`}</style>
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(0,201,167,.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div className="portal-fade" style={{ width: '100%', maxWidth: 880, display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,.13)', boxShadow: '0 4px 24px rgba(0,0,0,.5)' }}>

        {/* Left hero panel */}
        <div style={{ background: 'linear-gradient(135deg,#0a1628 0%,#0f2a4a 50%,#0a1e38 100%)', padding: '2.75rem 2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.2)', borderRadius: 20, padding: '5px 13px', fontFamily: 'monospace', fontSize: 10, color: '#00c9a7', marginBottom: 28 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00c9a7', display: 'inline-block' }} />
              Resources Portal
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1.08, marginBottom: 10 }}>Felix <span style={{ color: '#00c9a7' }}>Michael</span></div>
            <div style={{ fontSize: 12, color: '#8fa3bf', lineHeight: 1.6, marginBottom: 24 }}>ACA · ACTI · FMVA® · BIDA™ · FPMWP · CMSA<br />Strategic Financial Professional</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['ACA','ACTI','FMVA','BIDA','CBCA','CMSA','FPMWP','YDF-CIoD','CFO-FRC'].map(c => (
                <span key={c} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 5, padding: '3px 9px', fontSize: 10, fontFamily: 'monospace', color: '#4a6080' }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#4a6080', fontFamily: 'monospace', marginTop: 28 }}>FM Financial Tools · Lagos, Nigeria</div>
        </div>

        {/* Right form panel */}
        <div style={{ background: '#0a1628', padding: '2.75rem 2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 38, height: 38, background: '#00c9a7', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, color: '#0a1628' }}>FM</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: '-.03em' }}>Resources <span style={{ color: '#00c9a7' }}>Portal</span></div>
          </div>

          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-.03em', marginBottom: 4 }}>Welcome!</div>
          <div style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 20 }}>Sign in to access tools and resources</div>

          <ErrBox msg={err} />

          <Field label="Username or Email">
            <Inp type="text" placeholder="Enter your username or email" value={usr} onChange={e => setUsr(e.target.value)} onKeyDown={handleKey} autoComplete="username" />
          </Field>

          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <Inp type={showPwd ? 'text' : 'password'} placeholder="Enter your password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={handleKey} style={{ paddingRight: 40 }} />
              <button onClick={() => setShowPwd(v => !v)} type="button" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#4a6080', cursor: 'pointer', padding: 4 }}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </Field>

          <Btn loading={loading} onClick={handleLogin}>Sign in →</Btn>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 11.5, fontFamily: 'monospace', color: '#4a6080' }}>
            <button onClick={onOpenForgot} style={{ background: 'none', border: 'none', color: '#f5a623', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11.5, padding: 0, textDecoration: 'underline' }}>Forgot password?</button>
            <button onClick={onOpenContact} style={{ background: 'none', border: 'none', color: '#f5a623', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11.5, padding: 0, textDecoration: 'underline' }}>Contact Admin</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#4a6080', fontFamily: 'monospace' }}>
            New here? <button onClick={onOpenSignup} style={{ background: 'none', border: 'none', color: '#00c9a7', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12, textDecoration: 'underline' }}>Request access</button>
          </div>

          <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4a6080', fontFamily: 'monospace' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />Secured · FM Financial Tools</span>
            <span>v6.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: ACCOUNT TYPE PICKER
// ═══════════════════════════════════════════════════════════
function AccountTypePicker({ open, onClose, onIndividual, onCorporate }) {
  const [type, setType] = useState('individual');
  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand title="Request Access" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>How will you be using FM Resources Portal?</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { key: 'individual', icon: '👤', name: 'Individual', desc: 'Personal account. Full access to all tools.' },
          { key: 'corporate',  icon: '🏢', name: 'Corporate',  desc: 'Company account. Admin assigns team access.' },
        ].map(t => (
          <button key={t.key} onClick={() => setType(t.key)} style={{ background: type === t.key ? 'rgba(0,201,167,.06)' : '#0f1f3d', border: `1.5px solid ${type === t.key ? '#00c9a7' : 'rgba(255,255,255,.13)'}`, borderRadius: 12, padding: '1rem .9rem', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: type === t.key ? '#00c9a7' : 'rgba(0,201,167,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 16 }}>{t.icon}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13.5, fontWeight: 700, marginBottom: 4, color: '#e8edf5' }}>{t.name}</div>
            <div style={{ fontSize: 10.5, color: '#4a6080', lineHeight: 1.5 }}>{t.desc}</div>
          </button>
        ))}
      </div>
      <Btn onClick={() => type === 'individual' ? onIndividual() : onCorporate()}>Continue →</Btn>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#4a6080', fontFamily: 'monospace' }}>Already have access? <span onClick={onClose} style={{ color: '#00c9a7', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</span></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: INDIVIDUAL SIGNUP
// ═══════════════════════════════════════════════════════════
function IndividualSignup({ open, onClose, onBack }) {
  const [form, setForm] = useState({ surname: '', otherNames: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setErr(''); setOk('');
    if (!form.surname || !form.otherNames || !form.email || !form.phone) { setErr('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const { ok: success, data } = await api.post('/api/auth/signup', form);
      if (!success) { setErr(data.message); return; }
      setOk(data.message);
      setForm({ surname: '', otherNames: '', email: '', phone: '' });
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand title="Individual Sign Up" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>Fill in your details. A confirmation email will be sent to complete setup.</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <Field label="Surname"><Inp placeholder="e.g. Michael" value={form.surname} onChange={set('surname')} /></Field>
      <Field label="Other Names"><Inp placeholder="e.g. Felix Happy" value={form.otherNames} onChange={set('otherNames')} /></Field>
      <Field label="Email Address"><Inp type="email" placeholder="e.g. felix@company.com" value={form.email} onChange={set('email')} /></Field>
      <Field label="Phone Number"><Inp type="tel" placeholder="e.g. 08012345678" value={form.phone} onChange={set('phone')} /></Field>
      <Btn loading={loading} onClick={handleSubmit}>Sign up →</Btn>
      <GhostBtn onClick={onBack}>← Back</GhostBtn>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#4a6080', fontFamily: 'monospace' }}>Already have access? <span onClick={onClose} style={{ color: '#00c9a7', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</span></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: CORPORATE — DOMAIN CHECK
// ═══════════════════════════════════════════════════════════
function CorpDomainCheck({ open, onClose, onBack, onCreateOrg, onJoinOrg, onBlocked }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleCheck() {
    setErr('');
    if (!email || !email.includes('@')) { setErr('Please enter a valid work email.'); return; }
    setLoading(true);
    try {
      const { ok: success, data } = await api.post('/api/auth/check-domain', { email });
      if (!success) { setErr(data.message); return; }
      if (!data.allowed) { onBlocked(email, data.domain); return; }
      if (data.orgExists) onJoinOrg(email, data.orgName);
      else                onCreateOrg(email);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand color="#a78bfa" title="Corporate Sign Up" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>Enter your work email. We'll check if your company's domain is approved.</p>
      <ErrBox msg={err} />
      <Field label="Work Email Address"><Inp type="email" placeholder="e.g. you@company.com" value={email} onChange={e => setEmail(e.target.value)} /></Field>
      <Btn loading={loading} color="#a78bfa" onClick={handleCheck}>Check domain →</Btn>
      <GhostBtn onClick={onBack}>← Back</GhostBtn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: CORPORATE — CREATE NEW ORG
// ═══════════════════════════════════════════════════════════
function CorpCreateOrg({ open, onClose, onBack, prefillEmail }) {
  const [form, setForm] = useState({ surname: '', otherNames: '', phone: '', orgName: '', orgSize: '1-10', orgDescription: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setErr(''); setOk('');
    if (!form.surname || !form.otherNames || !form.phone || !form.orgName) { setErr('Please fill in all required fields.'); return; }
    setLoading(true);
    try {
      const { ok: success, data } = await api.post('/api/auth/register-org', { ...form, email: prefillEmail });
      if (!success) { setErr(data.message); return; }
      setOk(data.message);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <ModalClose onClose={onClose} />
      <ModalBrand color="#a78bfa" title="Create Organisation" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>Your domain is approved and no organisation exists for it yet. You'll be the organisation admin.</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Surname"><Inp placeholder="e.g. Michael" value={form.surname} onChange={set('surname')} /></Field>
        <Field label="Other Names"><Inp placeholder="e.g. Felix Happy" value={form.otherNames} onChange={set('otherNames')} /></Field>
        <Field label="Work Email"><Inp value={prefillEmail} disabled style={{ opacity: .55 }} /></Field>
        <Field label="Phone Number"><Inp type="tel" placeholder="e.g. 08012345678" value={form.phone} onChange={set('phone')} /></Field>
      </div>
      <Field label="Organisation Name"><Inp placeholder="e.g. Acme Finance Ltd" value={form.orgName} onChange={set('orgName')} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Company Size">
          <select value={form.orgSize} onChange={set('orgSize')} style={{ width: '100%', padding: '10px 13px', background: '#0f1f3d', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#e8edf5', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
            <option value="1-10">1–10 employees</option>
            <option value="11-50">11–50 employees</option>
            <option value="51-200">51–200 employees</option>
            <option value="200+">200+ employees</option>
          </select>
        </Field>
        <Field label="Description (optional)"><Inp placeholder="What your company does" value={form.orgDescription} onChange={set('orgDescription')} /></Field>
      </div>
      <Btn loading={loading} color="#a78bfa" onClick={handleSubmit}>Create organisation →</Btn>
      <GhostBtn onClick={onBack}>← Back</GhostBtn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: CORPORATE — JOIN EXISTING ORG
// ═══════════════════════════════════════════════════════════
function CorpJoinOrg({ open, onClose, onBack, prefillEmail, orgName }) {
  const [form, setForm] = useState({ surname: '', otherNames: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setErr(''); setOk('');
    if (!form.surname || !form.otherNames || !form.phone) { setErr('Please fill in all required fields.'); return; }
    setLoading(true);
    try {
      const { ok: success, data } = await api.post('/api/auth/join-org', { ...form, email: prefillEmail });
      if (!success) { setErr(data.message); return; }
      setOk(data.message);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand color="#a78bfa" title="Join Organisation" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}><strong style={{ color: '#e8edf5' }}>{orgName}</strong> already has an organisation set up. Request to join — the admin will assign your access.</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <Field label="Surname"><Inp placeholder="e.g. Michael" value={form.surname} onChange={set('surname')} /></Field>
      <Field label="Other Names"><Inp placeholder="e.g. Felix Happy" value={form.otherNames} onChange={set('otherNames')} /></Field>
      <Field label="Work Email"><Inp value={prefillEmail} disabled style={{ opacity: .55 }} /></Field>
      <Field label="Phone Number"><Inp type="tel" placeholder="e.g. 08012345678" value={form.phone} onChange={set('phone')} /></Field>
      <Btn loading={loading} color="#a78bfa" onClick={handleSubmit}>Request to join →</Btn>
      <GhostBtn onClick={onBack}>← Back</GhostBtn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: DOMAIN NOT APPROVED
// ═══════════════════════════════════════════════════════════
function CorpBlocked({ open, onClose, onBack, onContactAdmin, onIndividual, domain }) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand color="#e05252" title="Domain Not Approved" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 20, lineHeight: 1.6 }}>
        The domain <strong style={{ color: '#e8edf5' }}>@{domain}</strong> isn't approved for corporate access. Contact the admin to request approval, or continue with an Individual account.
      </p>
      <Btn color="#f5a623" onClick={onContactAdmin}>Contact Admin →</Btn>
      <GhostBtn onClick={onIndividual}>Continue as Individual instead</GhostBtn>
      <GhostBtn onClick={onBack}>← Back</GhostBtn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: SET PASSWORD (from confirmation email link)
// ═══════════════════════════════════════════════════════════
function SetPasswordModal({ open, token, greeting }) {
  const [pwd, setPwd] = useState('');
  const [cpwd, setCpwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function handleSubmit() {
    setErr(''); setOk('');
    if (pwd.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (pwd !== cpwd) { setErr('Passwords do not match.'); return; }
    if (!token) { setErr('Invalid session. Use your confirmation email link.'); return; }
    setLoading(true);
    try {
      const { ok: success, data } = await api.post('/api/auth/set-password', { token, password: pwd });
      if (!success) { setErr(data.message); return; }
      setOk(data.message + ' Redirecting to login...');
      setTimeout(() => { window.history.replaceState({}, '', window.location.pathname); }, 2500);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={() => {}}>
      <ModalBrand title="Set Your Password" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>{greeting || 'Welcome! Create your password to complete setup.'}</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <Field label="New Password"><Inp type="password" placeholder="Minimum 8 characters" value={pwd} onChange={e => setPwd(e.target.value)} /></Field>
      <Field label="Confirm Password"><Inp type="password" placeholder="Re-enter your password" value={cpwd} onChange={e => setCpwd(e.target.value)} /></Field>
      <Btn loading={loading} onClick={handleSubmit}>Set Password & Continue →</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════
function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function handleSubmit() {
    setErr(''); setOk('');
    if (!email) { setErr('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      setOk(data.message);
      setEmail('');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand color="#f5a623" title="Forgot Password?" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>Enter your registered email and we'll send a reset link.</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <Field label="Email Address"><Inp type="email" placeholder="Your registered email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
      <Btn loading={loading} color="#f5a623" onClick={handleSubmit}>Send Reset Link →</Btn>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#4a6080', fontFamily: 'monospace' }}>Remembered it? <span onClick={onClose} style={{ color: '#00c9a7', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</span></div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: RESET PASSWORD (from reset email link)
// ═══════════════════════════════════════════════════════════
function ResetPasswordModal({ open, token, greeting }) {
  const [pwd, setPwd] = useState('');
  const [cpwd, setCpwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function handleSubmit() {
    setErr(''); setOk('');
    if (!token) { setErr('Invalid session. Use your reset email link.'); return; }
    if (pwd.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (pwd !== cpwd) { setErr('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { ok: success, data } = await api.post('/api/auth/reset-password', { token, password: pwd });
      if (!success) { setErr(data.message); return; }
      setOk(data.message + ' Redirecting to login...');
      setTimeout(() => { window.history.replaceState({}, '', window.location.pathname); }, 2500);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={() => {}}>
      <ModalBrand color="#f5a623" title="Reset Password" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>{greeting || 'Enter your new password.'}</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <Field label="New Password"><Inp type="password" placeholder="Minimum 8 characters" value={pwd} onChange={e => setPwd(e.target.value)} /></Field>
      <Field label="Confirm New Password"><Inp type="password" placeholder="Re-enter password" value={cpwd} onChange={e => setCpwd(e.target.value)} /></Field>
      <Btn loading={loading} color="#f5a623" onClick={handleSubmit}>Reset Password →</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: CONTACT ADMIN
// ═══════════════════════════════════════════════════════════
function ContactAdminModal({ open, onClose, prefillEmail }) {
  const [form, setForm] = useState({ username: '', email: prefillEmail || '', message: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (prefillEmail) setForm(f => ({ ...f, email: prefillEmail })); }, [prefillEmail]);

  async function handleSubmit() {
    setErr(''); setOk('');
    if (!form.username || !form.email || !form.message) { setErr('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/contact-admin', form);
      setOk(data.message);
      setForm({ username: '', email: '', message: '' });
      setTimeout(onClose, 3000);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand color="#f5a623" title="Contact Admin" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>Send a message to the administrator. You'll receive a reply at your email address.</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <Field label="Username"><Inp placeholder="Your username" value={form.username} onChange={set('username')} /></Field>
      <Field label="Email Address"><Inp type="email" placeholder="Your email address" value={form.email} onChange={set('email')} /></Field>
      <Field label="Message / Request">
        <textarea placeholder="Describe your request..." value={form.message} onChange={set('message')} style={{ width: '100%', padding: '10px 13px', background: '#0f1f3d', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#e8edf5', fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 85 }} />
      </Field>
      <Btn loading={loading} color="#f5a623" onClick={handleSubmit}>Send Message →</Btn>
      <p style={{ textAlign: 'center', fontSize: 10.5, color: '#4a6080', fontFamily: 'monospace', marginTop: 10 }}>Your Username is usually surname.othername</p>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// MODAL: CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════
function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setErr(''); setOk('');
    if (!form.current || !form.newPwd || !form.confirm) { setErr('All fields are required.'); return; }
    if (form.newPwd.length < 8) { setErr('New password must be at least 8 characters.'); return; }
    if (form.newPwd !== form.confirm) { setErr('New passwords do not match.'); return; }
    setLoading(true);
    try {
      const { ok: success, data } = await api.put('/api/auth/change-password', { currentPassword: form.current, newPassword: form.newPwd });
      if (!success) { setErr(data.message); return; }
      setOk(data.message);
      setTimeout(onClose, 2000);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalClose onClose={onClose} />
      <ModalBrand title="Change Password" />
      <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16 }}>Enter your current password and choose a new one.</p>
      <ErrBox msg={err} /><OkBox msg={ok} />
      <Field label="Current Password"><Inp type="password" placeholder="Your current password" value={form.current} onChange={set('current')} /></Field>
      <Field label="New Password"><Inp type="password" placeholder="Minimum 8 characters" value={form.newPwd} onChange={set('newPwd')} /></Field>
      <Field label="Confirm New Password"><Inp type="password" placeholder="Re-enter new password" value={form.confirm} onChange={set('confirm')} /></Field>
      <Btn loading={loading} onClick={handleSubmit}>Change Password →</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN: PORTAL DASHBOARD
// ═══════════════════════════════════════════════════════════
function PortalDashboard({ onShowAdmin, onShowOrg, onChangePwd, onLogout }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  if (!user) return null;

  function handleAppClick(path) { navigate(path); }

  return (
    <div style={{ background: '#050d1a', minHeight: '100vh', color: '#e8edf5' }}>
      {/* Top bar */}
      <div style={{ background: '#0a1628', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 1.75rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: '-.03em', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: '#00c9a7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#0a1628', fontWeight: 700 }}>FM</div>
          Resources <span style={{ color: '#00c9a7', marginLeft: 5 }}>Portal</span>
          {user.accountType === 'organisation' && user.orgName && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.25)', borderRadius: 20, padding: '4px 11px', fontSize: 10.5, fontFamily: 'monospace', color: '#a78bfa', marginLeft: 4 }}>🏢 {user.orgName}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user.accountType === 'organisation' && user.orgRole === 'admin' && (
            <button onClick={onShowOrg} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.25)', borderRadius: 10, padding: '6px 13px', fontSize: 11.5, fontFamily: 'monospace', color: '#a78bfa', cursor: 'pointer' }}>👥 Team &amp; Permissions</button>
          )}
          {user.role === 'admin' && (
            <button onClick={onShowAdmin} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,201,167,.08)', border: '1px solid rgba(0,201,167,.25)', borderRadius: 10, padding: '6px 13px', fontSize: 11.5, fontFamily: 'monospace', color: '#00c9a7', cursor: 'pointer' }}>⚙️ Admin Panel</button>
          )}
          <a href="../" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, padding: '6px 13px', fontSize: 11.5, fontFamily: 'monospace', color: '#4a6080', textDecoration: 'none' }}>🏠 Home</a>

          {/* User chip with dropdown */}
          <div style={{ position: 'relative' }} onClick={e => { e.stopPropagation(); setDropOpen(v => !v); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.13)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#8fa3bf', fontFamily: 'monospace', cursor: 'pointer' }}>
              👤 {user.name} ▾
            </div>
            {dropOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#0a1628', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, minWidth: 200, boxShadow: '0 4px 24px rgba(0,0,0,.5)', zIndex: 50, overflow: 'hidden' }}>
                <button onClick={() => { setDropOpen(false); onChangePwd(); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', fontSize: 12.5, cursor: 'pointer', color: '#8fa3bf', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'DM Sans, sans-serif' }}>🔒 Change Password</button>
                <div style={{ height: 1, background: 'rgba(255,255,255,.07)' }} />
                <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', fontSize: 12.5, cursor: 'pointer', color: '#e05252', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'DM Sans, sans-serif' }}>⬅️ Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '2.75rem 1.5rem 4rem' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '-.04em', marginBottom: 6 }}>
            Welcome! <span style={{ color: '#00c9a7' }}>{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ fontSize: 13, color: '#8fa3bf' }}>
            {user.accountType === 'organisation' && user.orgName
              ? `Signed in to ${user.orgName}. Select a tool below to get started.`
              : 'Select a tool or resource below to get started.'}
          </p>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4a6080', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          Available Tools
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.07)', display: 'block' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16, marginBottom: 40 }}>
          {APP_KEYS.map((key, i) => {
            const meta = APP_META[key];
            const allowed = user.role === 'admin' || !!user.permissions?.[key];
            return (
              <div key={key} onClick={() => allowed && handleAppClick(meta.path)} style={{ background: '#0a1628', border: `1px solid ${allowed ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)'}`, borderRadius: 14, padding: '1.6rem', cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.4, transition: 'all .25s', position: 'relative', animationDelay: `${i * 0.08}s` }}
                onMouseEnter={e => { if (allowed) { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = allowed ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 46, height: 46, borderRadius: 11, background: 'rgba(0,201,167,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>{meta.icon}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 6 }}>
                  {meta.title} {!allowed && '🔒'}
                </div>
                <div style={{ fontSize: 12.5, color: '#8fa3bf', lineHeight: 1.55, marginBottom: 14 }}>{meta.desc}</div>
                {allowed
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontFamily: 'monospace', background: 'rgba(34,197,94,.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,.2)' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />Live</span>
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontFamily: 'monospace', background: 'rgba(224,82,82,.1)', color: '#e05252', border: '1px solid rgba(224,82,82,.2)' }}>No access — contact your admin</span>}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.07)', fontFamily: 'monospace', fontSize: 11, color: '#4a6080' }}>
          © {new Date().getFullYear()} <span style={{ color: '#00c9a7' }}>Felix Happy Michael</span> · FM Financial Tools · All rights reserved
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN: ADMIN PANEL
// ═══════════════════════════════════════════════════════════
function AdminPanel({ onBack, onLogout }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: 'ok' });
  const [editUser, setEditUser] = useState(null);  // null = add, object = edit
  const [userModal, setUserModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => { loadUsers(); loadDomains(); }, []);

  function flash(text, type = 'ok') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'ok' }), 4000); }

  async function loadUsers() {
    try { const { data } = await api.get('/api/users'); setUsers(data.users || []); }
    catch (e) { flash(e.message, 'err'); }
  }
  async function loadDomains() {
    try { const { data } = await api.get('/api/admin/allowed-domains'); setDomains(data.domains || []); }
    catch (e) { flash(e.message, 'err'); }
  }
  async function deleteUser(id, username) {
    if (!confirm(`Permanently delete user "${username}"?`)) return;
    try { await api.delete('/api/users/' + id); flash('User deleted.'); loadUsers(); }
    catch (e) { flash(e.message, 'err'); }
  }
  async function addDomain() {
    if (!newDomain) { flash('Please enter a domain.', 'err'); return; }
    try { await api.post('/api/admin/allowed-domains', { domain: newDomain, label: newLabel }); flash(`Domain "${newDomain}" whitelisted.`); setNewDomain(''); setNewLabel(''); loadDomains(); }
    catch (e) { flash(e.message, 'err'); }
  }
  async function deleteDomain(id, domain) {
    if (!confirm(`Remove "${domain}" from the whitelist?`)) return;
    try { await api.delete('/api/admin/allowed-domains/' + id); flash('Domain removed.'); loadDomains(); }
    catch (e) { flash(e.message, 'err'); }
  }

  const barStyle = { background: '#0a1628', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 1.75rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 };
  const tabStyle = active => ({ background: 'transparent', border: 'none', color: active ? '#00c9a7' : '#4a6080', fontFamily: 'monospace', fontSize: 12, padding: '9px 4px', cursor: 'pointer', borderBottom: `2px solid ${active ? '#00c9a7' : 'transparent'}`, marginRight: 20 });
  const thStyle = { background: '#0f1f3d', color: '#4a6080', fontFamily: 'monospace', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', padding: '9px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,.07)' };
  const tdStyle = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.07)', verticalAlign: 'middle', fontSize: 12.5 };

  return (
    <div style={{ background: '#050d1a', minHeight: '100vh', color: '#e8edf5' }}>
      <div style={barStyle}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: '#00c9a7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#0a1628', fontWeight: 700 }}>FM</div>
          Admin <span style={{ color: '#00c9a7', marginLeft: 5 }}>Panel</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, padding: '6px 13px', fontSize: 11.5, fontFamily: 'monospace', color: '#4a6080', cursor: 'pointer' }}>← Back to Portal</button>
          <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid rgba(224,82,82,.3)', borderRadius: 10, padding: '6px 13px', fontSize: 11.5, fontFamily: 'monospace', color: '#e05252', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        {msg.text && <div style={{ padding: '9px 13px', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', marginBottom: 16, background: msg.type === 'ok' ? 'rgba(34,197,94,.1)' : 'rgba(224,82,82,.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,.25)' : 'rgba(224,82,82,.3)'}`, color: msg.type === 'ok' ? '#22c55e' : '#e05252' }}>{msg.text}</div>}

        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>Users</button>
          <button style={tabStyle(tab === 'domains')} onClick={() => setTab('domains')}>Domain Whitelist</button>
        </div>

        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#4a6080', fontFamily: 'monospace' }}>All registered users</span>
              <button onClick={() => { setEditUser(null); setUserModal(true); }} style={{ background: '#00c9a7', border: 'none', borderRadius: 10, color: '#0a1628', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', cursor: 'pointer' }}>+ Add User</button>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>{['Username','Name','Email','Type','Role','Status','Last Login','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{u.username}</td>
                      <td style={tdStyle}>{u.name}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#8fa3bf' }}>{u.email}</td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#4a6080', fontFamily: 'monospace' }}>{u.accountType === 'organisation' ? `Corp${u.orgName ? ' · ' + u.orgName : ''}` : 'Individual'}</td>
                      <td style={tdStyle}><span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontFamily: 'monospace', background: u.role === 'admin' ? 'rgba(0,201,167,.12)' : 'rgba(255,255,255,.08)', color: u.role === 'admin' ? '#00c9a7' : '#4a6080', border: `1px solid ${u.role === 'admin' ? 'rgba(0,201,167,.25)' : 'rgba(255,255,255,.13)'}` }}>{u.role}</span></td>
                      <td style={tdStyle}><span style={{ width: 7, height: 7, borderRadius: '50%', background: u.active ? '#22c55e' : '#e05252', display: 'inline-block', marginRight: 6 }} />{u.active ? 'Active' : 'Inactive'}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: '#4a6080' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ ...tdStyle, display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditUser(u); setUserModal(true); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.13)', color: '#8fa3bf', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>Edit</button>
                        <button onClick={() => deleteUser(u._id, u.username)} style={{ background: 'transparent', border: '1px solid rgba(224,82,82,.3)', color: '#e05252', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'domains' && (
          <>
            <p style={{ fontSize: 12.5, color: '#8fa3bf', marginBottom: 16, lineHeight: 1.6 }}>Only email domains listed here can register a Corporate account.</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input placeholder="e.g. company.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} style={{ flex: 1, minWidth: 160, padding: '9px 13px', background: '#0f1f3d', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#e8edf5', fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none' }} />
              <input placeholder="Label (optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ flex: 1, minWidth: 160, padding: '9px 13px', background: '#0f1f3d', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#e8edf5', fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none' }} />
              <button onClick={addDomain} style={{ background: '#00c9a7', border: 'none', borderRadius: 10, color: '#0a1628', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', cursor: 'pointer' }}>Add Domain</button>
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead><tr>{['Domain','Label','Added By','Date','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {domains.map(d => (
                    <tr key={d._id}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#00c9a7' }}>{d.domain}</td>
                      <td style={tdStyle}>{d.label || '—'}</td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#4a6080', fontFamily: 'monospace' }}>{d.addedBy || '—'}</td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#4a6080', fontFamily: 'monospace' }}>{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                      <td style={tdStyle}><button onClick={() => deleteDomain(d._id, d.domain)} style={{ background: 'transparent', border: '1px solid rgba(224,82,82,.3)', color: '#e05252', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* User add/edit modal */}
      <UserFormModal open={userModal} onClose={() => { setUserModal(false); setEditUser(null); }} editData={editUser} onSaved={() => { setUserModal(false); setEditUser(null); loadUsers(); flash(editUser ? 'User updated.' : 'User created.'); }} />
    </div>
  );
}

// ── User form modal (used inside AdminPanel) ─────────────────
function UserFormModal({ open, onClose, editData, onSaved }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'user', active: 'true' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (editData) setForm({ name: editData.name, username: editData.username, email: editData.email, password: '', role: editData.role, active: String(editData.active) });
    else setForm({ name: '', username: '', email: '', password: '', role: 'user', active: 'true' });
    setErr('');
  }, [editData, open]);

  async function handleSubmit() {
    setErr('');
    if (!form.name) { setErr('Name is required.'); return; }
    if (!isEdit && (!form.username || !form.email || !form.password)) { setErr('All fields required for new user.'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        const body = { name: form.name, role: form.role, active: form.active === 'true' };
        if (form.password) body.password = form.password;
        await api.put('/api/users/' + editData._id, body);
      } else {
        await api.post('/api/users', { name: form.name, username: form.username, email: form.email, password: form.password, role: form.role });
      }
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const sEl = { width: '100%', padding: '9px 13px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#e8edf5', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer', outline: 'none' };

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 20, letterSpacing: '-.02em' }}>{isEdit ? 'Edit User' : 'Add New User'}</div>
      <Field label="Full Name"><Inp placeholder="e.g. John Doe" value={form.name} onChange={set('name')} /></Field>
      {!isEdit && <>
        <Field label="Username"><Inp placeholder="e.g. john.doe" value={form.username} onChange={set('username')} autoComplete="off" /></Field>
        <Field label="Email Address"><Inp type="email" placeholder="e.g. john@company.com" value={form.email} onChange={set('email')} /></Field>
      </>}
      <Field label={isEdit ? 'Password (leave blank to keep current)' : 'Password'}><Inp type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
      <Field label="Role"><select value={form.role} onChange={set('role')} style={sEl}><option value="user">User</option><option value="admin">Admin</option></select></Field>
      {isEdit && <Field label="Status"><select value={form.active} onChange={set('active')} style={sEl}><option value="true">Active</option><option value="false">Inactive</option></select></Field>}
      {err && <div style={{ fontSize: 12, color: '#e05252', fontFamily: 'monospace', marginTop: 8 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.13)', color: '#8fa3bf', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{ background: '#00c9a7', border: 'none', color: '#0a1628', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}</button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN: ORG TEAM & PERMISSIONS PANEL
// ═══════════════════════════════════════════════════════════
function OrgPanel({ onBack, onLogout }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [moduleDefs, setModuleDefs] = useState({});
  const [msg, setMsg] = useState({ text: '', type: 'ok' });
  const [addModal, setAddModal] = useState(false);

  function flash(text, type = 'ok') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'ok' }), 4000); }

  async function loadTeam() {
    try {
      const { data } = await api.get('/api/org/team');
      setMembers(data.members || []);
      setModuleDefs(data.moduleDefs || {});
    } catch (e) { flash(e.message, 'err'); }
  }

  useEffect(() => { loadTeam(); }, []);

  async function togglePerm(memberId, appKey, currentOn) {
    const body = { permissions: { [appKey]: !currentOn } };
    try { await api.put('/api/org/team/' + memberId + '/permissions', body); loadTeam(); }
    catch (e) { flash(e.message, 'err'); }
  }
  async function changeRole(memberId, role) {
    try { await api.put('/api/org/team/' + memberId + '/permissions', { orgRole: role }); flash('Role updated.'); loadTeam(); }
    catch (e) { flash(e.message, 'err'); }
  }
  async function updateModulePerm(memberId, appKey, modKey, level) {
    const body = { modulePermissions: { [appKey]: { [modKey]: level } } };
    try { await api.put('/api/org/team/' + memberId + '/permissions', body); flash(`${modKey} set to ${level}.`); }
    catch (e) { flash(e.message, 'err'); }
  }
  async function removeMember(memberId, name) {
    if (!confirm(`Remove ${name} from the organisation?`)) return;
    try { await api.delete('/api/org/team/' + memberId); flash(`${name} removed.`); loadTeam(); }
    catch (e) { flash(e.message, 'err'); }
  }

  const barStyle = { background: '#0a1628', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 1.75rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 };
  const thStyle = { background: '#0f1f3d', color: '#4a6080', fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', padding: '9px 8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.07)' };

  return (
    <div style={{ background: '#050d1a', minHeight: '100vh', color: '#e8edf5' }}>
      <div style={barStyle}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: '#00c9a7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#0a1628', fontWeight: 700 }}>FM</div>
          Team <span style={{ color: '#a78bfa', marginLeft: 5 }}>&amp; Permissions</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, padding: '6px 13px', fontSize: 11.5, fontFamily: 'monospace', color: '#4a6080', cursor: 'pointer' }}>← Back to Portal</button>
          <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid rgba(224,82,82,.3)', borderRadius: 10, padding: '6px 13px', fontSize: 11.5, fontFamily: 'monospace', color: '#e05252', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-.03em', margin: 0 }}><span style={{ color: '#a78bfa' }}>{user?.orgName || 'Your'}</span> Team</h2>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a6080', marginTop: 3 }}>@{user?.email?.split('@')[1] || ''}</div>
          </div>
          <button onClick={() => setAddModal(true)} style={{ background: '#00c9a7', border: 'none', borderRadius: 10, color: '#0a1628', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', cursor: 'pointer' }}>+ Add Team Member</button>
        </div>

        {msg.text && <div style={{ padding: '9px 13px', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', marginBottom: 16, background: msg.type === 'ok' ? 'rgba(34,197,94,.1)' : 'rgba(224,82,82,.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,.25)' : 'rgba(224,82,82,.3)'}`, color: msg.type === 'ok' ? '#22c55e' : '#e05252' }}>{msg.text}</div>}

        <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 12 }}>Member</th>
                <th style={thStyle}>Role</th>
                {APP_KEYS.map(k => <th key={k} style={thStyle}>{APP_LABELS[k]}</th>)}
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const perms = m.permissions || {};
                const isSelf = user && m._id === user.id;
                return (
                  <tr key={m._id}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,.07)', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{m.name}{isSelf ? ' (you)' : ''}</div>
                      <div style={{ fontSize: 10.5, color: '#4a6080', fontFamily: 'monospace' }}>{m.email}</div>
                    </td>
                    <td style={{ padding: '9px 8px', borderBottom: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
                      <select value={m.orgRole || 'member'} onChange={e => changeRole(m._id, e.target.value)} disabled={isSelf} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.13)', borderRadius: 6, color: '#e8edf5', fontFamily: 'monospace', fontSize: 10.5, padding: '4px 6px', cursor: isSelf ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.5 : 1 }}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    {APP_KEYS.map(k => {
                      const on = !!perms[k];
                      const hasMods = moduleDefs[k]?.length > 0;
                      return (
                        <td key={k} style={{ padding: '9px 8px', borderBottom: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
                          <span onClick={() => togglePerm(m._id, k, on)} style={{ display: 'inline-block', width: 34, height: 19, borderRadius: 20, background: on ? 'rgba(0,201,167,.25)' : 'rgba(255,255,255,.08)', border: `1px solid ${on ? '#00c9a7' : 'rgba(255,255,255,.13)'}`, position: 'relative', cursor: 'pointer', verticalAlign: 'middle', transition: 'all .2s' }}>
                            <span style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 13, height: 13, borderRadius: '50%', background: on ? '#00c9a7' : '#4a6080', transition: 'all .2s' }} />
                          </span>
                          {hasMods && on && (
                            <details style={{ display: 'inline-block', marginLeft: 4 }}>
                              <summary style={{ cursor: 'pointer', fontSize: 10, color: '#4a6080', listStyle: 'none' }}>⚙</summary>
                              <div style={{ position: 'absolute', background: '#0f1f3d', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, padding: 12, zIndex: 50, minWidth: 180 }}>
                                {(moduleDefs[k] || []).map(modKey => {
                                  const lvl = m.modulePermissions?.[k]?.[modKey] || 'none';
                                  return (
                                    <div key={modKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8fa3bf', textTransform: 'capitalize' }}>{modKey}</span>
                                      <select value={lvl} onChange={e => updateModulePerm(m._id, k, modKey, e.target.value)} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.13)', borderRadius: 6, color: '#e8edf5', fontFamily: 'monospace', fontSize: 10, padding: '3px 5px', cursor: 'pointer' }}>
                                        <option value="none">None</option>
                                        <option value="view">View</option>
                                        <option value="edit">Edit</option>
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '9px 8px', borderBottom: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
                      {!isSelf && <button onClick={() => removeMember(m._id, m.name)} style={{ background: 'transparent', border: '1px solid rgba(224,82,82,.3)', color: '#e05252', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>Remove</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddTeamMemberModal open={addModal} onClose={() => setAddModal(false)} onSaved={() => { setAddModal(false); flash('Invitation sent.'); loadTeam(); }} />
    </div>
  );
}

function AddTeamMemberModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', orgRole: 'member' });
  const [perms, setPerms] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setErr('');
    if (!form.name || !form.email) { setErr('Name and email are required.'); return; }
    setLoading(true);
    try {
      const { ok, data } = await api.post('/api/org/team', { ...form, permissions: perms });
      if (!ok) { setErr(data.message); return; }
      onSaved();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Add Team Member</div>
      <Field label="Full Name"><Inp placeholder="e.g. Jane Doe" value={form.name} onChange={set('name')} /></Field>
      <Field label="Work Email"><Inp type="email" placeholder="e.g. jane@yourcompany.com" value={form.email} onChange={set('email')} /></Field>
      <Field label="Role">
        <select value={form.orgRole} onChange={set('orgRole')} style={{ width: '100%', padding: '9px 13px', background: '#0f1f3d', border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, color: '#e8edf5', fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      <Field label="App Access">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          {APP_KEYS.map(k => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.13)', borderRadius: 8, padding: '7px 10px', fontSize: 11.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!perms[k]} onChange={e => setPerms(p => ({ ...p, [k]: e.target.checked }))} style={{ accentColor: '#00c9a7', width: 14, height: 14, cursor: 'pointer' }} />
              {APP_LABELS[k]}
            </label>
          ))}
        </div>
      </Field>
      {err && <div style={{ fontSize: 12, color: '#e05252', fontFamily: 'monospace', marginTop: 8 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.13)', color: '#8fa3bf', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{ background: '#00c9a7', border: 'none', color: '#0a1628', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>{loading ? 'Sending...' : 'Send Invitation'}</button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// ROOT: PortalPage — wires everything together
// ═══════════════════════════════════════════════════════════
export default function PortalPage() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  // Which screen is active
  const [screen, setScreen] = useState('login'); // 'login' | 'dashboard' | 'admin' | 'org'

  // Which modals are open
  const [modal, setModal] = useState(null); // 'atype'|'signup'|'corpCheck'|'corpCreate'|'corpJoin'|'corpBlocked'|'forgot'|'contact'|'changePwd'|'setpwd'|'resetpwd'

  // Data passed between steps
  const [corpEmail, setCorpEmail] = useState('');
  const [corpOrgName, setCorpOrgName] = useState('');
  const [blockedDomain, setBlockedDomain] = useState('');
  const [contactPrefillEmail, setContactPrefillEmail] = useState('');
  const [tokenData, setTokenData] = useState({ confirmToken: null, confirmGreeting: '', resetToken: null, resetGreeting: '' });

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (isLoggedIn) setScreen('dashboard');
  }, [isLoggedIn]);

  // Check URL for ?confirm= or ?reset= tokens (from email links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ct = params.get('confirm');
    const rt = params.get('reset');
    if (ct) {
      api.get('/api/auth/confirm/' + ct).then(({ data }) => {
        setTokenData(td => ({ ...td, confirmToken: ct, confirmGreeting: data.valid ? `Welcome, ${data.otherNames} ${data.surname}! Create your password.` : '' }));
        setModal('setpwd');
      }).catch(() => { setTokenData(td => ({ ...td, confirmToken: ct })); setModal('setpwd'); });
    }
    if (rt) {
      api.get('/api/auth/verify-reset/' + rt).then(({ data }) => {
        setTokenData(td => ({ ...td, resetToken: rt, resetGreeting: data.valid ? `Hi ${data.name}! Enter your new password.` : '' }));
        setModal('resetpwd');
      }).catch(() => { setTokenData(td => ({ ...td, resetToken: rt })); setModal('resetpwd'); });
    }
  }, []);

  function handleLogout() {
    if (!confirm('Sign out?')) return;
    logout();
    setScreen('login');
  }

  // Signup flow navigation
  function openSignupFlow() { setModal('atype'); }
  function handleAtypeIndividual() { setModal('signup'); }
  function handleAtypeCorporate() { setModal('corpCheck'); }
  function handleDomainCreateOrg(email) { setCorpEmail(email); setModal('corpCreate'); }
  function handleDomainJoinOrg(email, orgName) { setCorpEmail(email); setCorpOrgName(orgName); setModal('corpJoin'); }
  function handleDomainBlocked(email, domain) { setCorpEmail(email); setBlockedDomain(domain); setModal('corpBlocked'); }
  function handleBlockedContact() { setContactPrefillEmail(corpEmail); setModal('contact'); }
  function handleBlockedIndividual() { setModal('signup'); }

  const closeModal = () => setModal(null);

  if (screen === 'admin') return <AdminPanel onBack={() => setScreen('dashboard')} onLogout={handleLogout} />;
  if (screen === 'org')   return <OrgPanel   onBack={() => setScreen('dashboard')} onLogout={handleLogout} />;
  if (screen === 'dashboard') return (
    <>
      <PortalDashboard
        onShowAdmin={() => setScreen('admin')}
        onShowOrg={() => setScreen('org')}
        onChangePwd={() => setModal('changePwd')}
        onLogout={handleLogout}
      />
      <ChangePasswordModal open={modal === 'changePwd'} onClose={closeModal} />
    </>
  );

  return (
    <>
      <LoginScreen onOpenSignup={openSignupFlow} onOpenForgot={() => setModal('forgot')} onOpenContact={() => setModal('contact')} />

      <AccountTypePicker  open={modal === 'atype'}      onClose={closeModal} onIndividual={handleAtypeIndividual} onCorporate={handleAtypeCorporate} />
      <IndividualSignup   open={modal === 'signup'}     onClose={closeModal} onBack={() => setModal('atype')} />
      <CorpDomainCheck    open={modal === 'corpCheck'}  onClose={closeModal} onBack={() => setModal('atype')} onCreateOrg={handleDomainCreateOrg} onJoinOrg={handleDomainJoinOrg} onBlocked={handleDomainBlocked} />
      <CorpCreateOrg      open={modal === 'corpCreate'} onClose={closeModal} onBack={() => setModal('corpCheck')} prefillEmail={corpEmail} />
      <CorpJoinOrg        open={modal === 'corpJoin'}   onClose={closeModal} onBack={() => setModal('corpCheck')} prefillEmail={corpEmail} orgName={corpOrgName} />
      <CorpBlocked        open={modal === 'corpBlocked'} onClose={closeModal} onBack={() => setModal('corpCheck')} onContactAdmin={handleBlockedContact} onIndividual={handleBlockedIndividual} domain={blockedDomain} />
      <ForgotPasswordModal open={modal === 'forgot'}   onClose={closeModal} />
      <ContactAdminModal  open={modal === 'contact'}   onClose={closeModal} prefillEmail={contactPrefillEmail} />
      <SetPasswordModal   open={modal === 'setpwd'}    token={tokenData.confirmToken} greeting={tokenData.confirmGreeting} />
      <ResetPasswordModal open={modal === 'resetpwd'}  token={tokenData.resetToken}   greeting={tokenData.resetGreeting} />
    </>
  );
}
