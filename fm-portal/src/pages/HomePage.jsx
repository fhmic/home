// src/pages/HomePage.jsx
// Felix Happy Michael — Personal Portfolio & Homepage

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Data ─────────────────────────────────────────────────────
const ROLES = ['Chartered Accountant','Financial Strategist','FinTech Builder','Treasury Specialist','Data Analysis','Certified Financial Modeller','Financial Consultant','IFRS Expert','CFO — FRC Certified'];
const MARQUEE_ITEMS = ['Chartered Accountant','Financial Strategist','IFRS Expert','Treasury Management','FinTech Builder','ECL Modelling','Bank Reconciliation','FMVA® Certified','CBN Compliance','Tax Optimisation','Investment Appraisal','VBA & Excel Expert','Web App Developer','Receivables Management','ERM Oversight','CFO — FRC Certified'];
const CREDS = ['ACA','ACTI','FMVA','BIDA','CBCA','CMSA','FPMWP','YDF-CIoD','CFO-FRC'];
const NAV_LINKS = [['#about','About'],['#experience','Experience'],['#certifications','Credentials'],['#courses','Training'],['#portfolio','Portfolio'],['#contact','Contact']];
const SKILLS = ['Financial Reporting','Treasury Management','IFRS Compliance','Tax Management','Financial Modelling','Data Analysis','Budgeting & Forecasting','Internal Controls','Audit Coordination','Investment Appraisal','Stakeholder Reporting','FinTech Development'];
const TIMELINE = [
  { company:'Factoring & Supply Chain Finance Ltd',     role:'Head, Finance and Admin (DGM)' },
  { company:'Catamaran Group Nigeria Limited',          role:'Group Finance Manager' },
  { company:'Max International Nigeria',               role:'Performance Reporting Manager · Lagos' },
  { company:'Max International Nigeria',               role:'Regional Head of Accounts · Port Harcourt' },
  { company:'Adewale Semiu & Co Chartered Accountants',role:'Audit Associate' },
  { company:'NNPC/DPR RSA — Lagos Branch',             role:'Account Officer' },
];
const CERTS = [
  { abbr:'ACA',   name:'Associate Chartered Accountant',                    body:'Institute of Chartered Accountant of Nigeria (ICAN)' },
  { abbr:'ACTI',  name:'Associate Chartered Tax Institute',                 body:'Chartered Institute of Taxation of Nigeria (CITN)' },
  { abbr:'FMVA®', name:'Financial Modelling & Valuation Analyst',           body:'Corporate Finance Institute (CFI) — Canada' },
  { abbr:'BIDA™', name:'Business Intelligence & Data Analyst',              body:'Corporate Finance Institute (CFI) — Canada' },
  { abbr:'CBCA™', name:'Commercial Banking & Credit Analyst',               body:'Corporate Finance Institute (CFI) — Canada' },
  { abbr:'CMSA®', name:'Capital Markets & Securities Analyst',              body:'Corporate Finance Institute (CFI) — Canada' },
  { abbr:'FPWMP®',name:'Financial Planning & Wealth Management Professional',body:'Corporate Finance Institute (CFI) — Canada' },
  { abbr:'CFO',   name:'Chief Financial Officer Certified',                 body:'Federal Reporting Council — Nigeria' },
  { abbr:'ACFE',  name:'Associate Chartered Fraud Examiner',                body:'Association of Chartered Fraud Examiner (ACFE) — USA' },
  { abbr:'YDF',   name:'Young Directors Forum',                             body:'Chartered Institute of Directors (CIoD) — Nigeria' },
  { abbr:'OSSA',  name:'OPSWAT Secure Storage Associate',                   body:'OPSWAT Academy' },
  { abbr:'OLSA',  name:'OPSWAT Legacy-System Security Associate',           body:'OPSWAT Academy' },
  { abbr:'ODSA',  name:'OPSWAT Data Transfer Security Associate',           body:'OPSWAT Academy' },
  { abbr:'OFSA',  name:'OPSWAT File Security Associate',                    body:'OPSWAT Academy' },
];
const EDUCATION = [
  { deg:'MBA — Finance',             inst:'University of Lagos' },
  { deg:'BSc — Accounting (In View)',inst:'Southwestern University' },
  { deg:'HND — Accounting',          inst:'Lagos State Polytechnic' },
  { deg:'ND — Accounting',           inst:'Lagos State Polytechnic' },
];
const COURSES = [
  { title:'Advanced Financial Instrument & ECL Modeling',              org:'GODP Consulting' },
  { title:'Advanced Diploma in Taxation & Fiscal Policy',              org:'OGE Business School / ATPL' },
  { title:'Advanced Diploma in Forensic Accounting & Fraud Investigation', org:'OGE Business School / AFAR' },
  { title:'International Financial Reporting Standards Masterclass',   org:'GODP Consulting' },
  { title:'IT Short-Course in Cyber Defence Strategies',               org:'Charles Sturt University, Australia' },
  { title:'Google Data Analytics Professional Certificate',            org:'Google Incorporation' },
  { title:'Executive Diploma in Strategy and Innovation',              org:'Institute of Management, Technology & Finance' },
  { title:'Executive Diploma in Financial Management',                 org:'Institute of Management, Technology & Finance' },
  { title:'Financial Analyst Professional Certification',              org:'Institute of Management, Technology & Finance' },
  { title:'Leadership Excellence in Business Management',              org:'Institute of Management, Technology & Finance' },
  { title:'QuickBooks Online International Certification',             org:'Intuit Incorporation' },
  { title:'Junior Cybersecurity Analyst',                              org:'CISCO Networking Academy' },
  { title:'Oracle Cloud Infrastructure',                               org:'Oracle University' },
  { title:'Mastering Internal Controls: Operations, Financial and Management', org:'Tom Associates' },
  { title:'Cybersecurity Fundamentals',                                org:'IBM Incorporation' },
  { title:'Diploma in Digital Forensic Investigation',                 org:'Alison Academics (CPD-UK) Certified' },
];
const TOOLS = ['Microsoft Excel','PowerPoint','Sage Accounting','QuickBooks','MS Dynamics','Oracle NetSuite','Gemini Core-Banking','BankOne Core-Banking','NIBSS','Remita','VBA / Macros','Power Query','MongoDB','Power BI','Tableau','MySQL','Google Analytics'];
const STATS = [
  { val:12,  suffix:'+',   label:'Years Experience' },
  { val:10,  suffix:'+',   label:'Certifications' },
  { val:600, prefix:'₦',  suffix:'M+', label:'Tax Savings Led' },
  { val:20,  suffix:'+',   label:'Apps & Models Built' },
];
const APP_CHIPS = ['Live Job Search Engine','Bank Reconciliation Engine','Receivables Tracker','Treasury Intelligence Platform','Capital Market & FX Console'];

// ── Shared styles ────────────────────────────────────────────
const T = '#00c9a7'; // teal
const N = '#050d1a'; // darkest bg

const S = {
  body:     { fontFamily:"'DM Sans',sans-serif", background:N, color:'#e8edf5', lineHeight:1.65, overflowX:'hidden', WebkitFontSmoothing:'antialiased' },
  sLabel:   { fontFamily:'monospace', fontSize:10.5, letterSpacing:'.14em', textTransform:'uppercase', color:T, marginBottom:8, display:'flex', alignItems:'center', gap:6 },
  sTitle:   { fontFamily:"'Syne',sans-serif", fontSize:'clamp(1.8rem,3.5vw,2.6rem)', fontWeight:700, letterSpacing:'-.048em', lineHeight:1.08, marginBottom:16 },
  section:  { padding:'clamp(3.5rem,6vw,6rem) clamp(1.25rem,5vw,3rem)', position:'relative', zIndex:1 },
  inner:    { maxWidth:1100, margin:'0 auto', width:'100%' },
};

// ── Hooks ────────────────────────────────────────────────────
function useIntersect(threshold=0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

// ── Typed role animation ─────────────────────────────────────
function TypedRole() {
  const [text, setText] = useState('');
  const state = useRef({ ri:0, ci:0, deleting:false });

  useEffect(() => {
    let timer;
    function tick() {
      const { ri, ci, deleting } = state.current;
      const cur = ROLES[ri];
      if (!deleting) {
        const next = cur.slice(0, ci + 1);
        setText(next);
        if (ci + 1 === cur.length) {
          state.current.deleting = true;
          timer = setTimeout(tick, 1800);
        } else {
          state.current.ci += 1;
          timer = setTimeout(tick, 75);
        }
      } else {
        if (ci === 0) {
          state.current.deleting = false;
          state.current.ri = (ri + 1) % ROLES.length;
          timer = setTimeout(tick, 300);
        } else {
          setText(cur.slice(0, ci - 1));
          state.current.ci -= 1;
          timer = setTimeout(tick, 45);
        }
      }
    }
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'clamp(.95rem,1.8vw,1.25rem)', color:'#8fa3bf', fontStyle:'italic', fontWeight:300 }}>
      {text}
      <span style={{ borderRight:`2px solid ${T}`, paddingRight:2, animation:'blink 1s step-end infinite' }}/>
    </span>
  );
}

// ── Animated counter ─────────────────────────────────────────
function Counter({ val, prefix='', suffix='+' }) {
  const [cur, setCur] = useState(0);
  const [ref, vis] = useIntersect(0.5);
  const done = useRef(false);

  useEffect(() => {
    if (!vis || done.current) return;
    done.current = true;
    let n = 0;
    const step = Math.max(1, Math.round(val / 40));
    const iv = setInterval(() => {
      n = Math.min(n + step, val);
      setCur(n);
      if (n >= val) clearInterval(iv);
    }, 1800 / val);
    return () => clearInterval(iv);
  }, [vis, val]);

  return (
    <span ref={ref} style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:800, letterSpacing:'-.05em', color:T, lineHeight:1 }}>
      {prefix}{cur}{suffix}
    </span>
  );
}

// ── Reveal wrapper ────────────────────────────────────────────
function Reveal({ children, delay=0, style={} }) {
  const [ref, vis] = useIntersect(0.1);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(24px)', transition:`opacity .65s ${delay}s cubic-bezier(.22,1,.36,1), transform .65s ${delay}s cubic-bezier(.22,1,.36,1)`, ...style }}>
      {children}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────
function Nav({ onPortal }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  function closeMenu() { setMobileOpen(false); document.body.style.overflow = ''; }

  return (
    <>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes marqScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        @keyframes heroZoom{from{transform:scale(1.04)}to{transform:scale(1.10)}}
        @keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(0,201,167,.5),0 0 0 4px rgba(0,201,167,.1)}50%{box-shadow:0 0 0 5px rgba(0,201,167,.2),0 0 0 10px rgba(0,201,167,.04)}}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#050d1a}
        ::-webkit-scrollbar-thumb{background:#162747;border-radius:6px}
        ::-webkit-scrollbar-thumb:hover{background:#00a98e}
        ::selection{background:rgba(0,201,167,.25);color:#e8edf5}
        html{scroll-behavior:smooth}
      `}</style>

      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(1.25rem,4vw,2.75rem)', background: scrolled ? 'rgba(5,13,26,.96)' : 'rgba(5,13,26,0)', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,.06)' : 'transparent'}`, boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,.35)' : 'none', transition:'background .4s,box-shadow .4s,border-color .4s' }}>
        <a href="#hero" style={{ display:'flex', alignItems:'center', gap:11, textDecoration:'none' }}>
          <div style={{ width:36, height:36, background:T, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontSize:11.5, fontWeight:800, color:N }}>FM</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, letterSpacing:'-.04em', color:'#e8edf5' }}>Felix <em style={{ fontStyle:'normal', color:T }}>Michael</em></span>
        </a>

        <div style={{ display:'flex', alignItems:'center', gap:32 }} className="desktop-nav">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize:11.5, color:'#4a6080', fontFamily:'monospace', letterSpacing:'.04em', transition:'color .2s', textDecoration:'none' }}
              onMouseEnter={e => e.target.style.color=T} onMouseLeave={e => e.target.style.color='#4a6080'}>{label}</a>
          ))}
        </div>

        <button onClick={onPortal} style={{ padding:'9px 20px', borderRadius:9, fontFamily:"'Syne',sans-serif", fontSize:12.5, fontWeight:600, background:T, color:N, border:'none', cursor:'pointer', transition:'all .25s', whiteSpace:'nowrap' }}
          onMouseEnter={e => { e.target.style.background='#00a98e'; e.target.style.transform='translateY(-2px)'; }}
          onMouseLeave={e => { e.target.style.background=T; e.target.style.transform='none'; }}>
          Access Resources →
        </button>

        {/* Hamburger */}
        <button onClick={() => { setMobileOpen(v => !v); document.body.style.overflow = mobileOpen ? '' : 'hidden'; }} style={{ display:'none', flexDirection:'column', gap:5, padding:6, borderRadius:7, background:'transparent', border:'none', cursor:'pointer' }} aria-label="Toggle menu" className="hamburger-btn">
          {[0,1,2].map(i => <span key={i} style={{ width:22, height:2, background:'#e8edf5', borderRadius:2, display:'block', transition:'all .3s', transform: mobileOpen ? (i===0?'translateY(7px) rotate(45deg)':i===2?'translateY(-7px) rotate(-45deg)':'scaleX(0)') : 'none' }} />)}
        </button>
      </nav>

      {/* Mobile nav */}
      <div style={{ position:'fixed', top:64, left:0, right:0, bottom:0, zIndex:199, background:'rgba(5,13,26,.97)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32, transform: mobileOpen ? 'none' : 'translateX(100%)', transition:'transform .4s cubic-bezier(.77,0,.18,1)' }}>
        {[...NAV_LINKS, ['portal/','Access Resources →']].map(([href, label]) => (
          <a key={href} href={href} onClick={closeMenu} style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(1.5rem,6vw,2rem)', fontWeight:700, color: href.includes('portal') ? T : '#8fa3bf', letterSpacing:'-.03em', textDecoration:'none' }}>{label}</a>
        ))}
      </div>
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero({ onPortal }) {
  return (
    <section id="hero" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'calc(64px + 3rem) clamp(1.25rem,5vw,3rem) 4rem', position:'relative', overflow:'hidden' }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, zIndex:0, background:"url('pix.jpg') center 20% / cover no-repeat", filter:'brightness(.18) saturate(.4)', transform:'scale(1.04)', animation:'heroZoom 150s ease-in-out infinite alternate' }} />
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(0,201,167,.06) 0%,transparent 70%), linear-gradient(to bottom,rgba(5,13,26,.85) 0%,rgba(5,13,26,.6) 40%,rgba(5,13,26,.9) 100%)' }} />

      <div style={{ maxWidth:1100, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:20, position:'relative', zIndex:2 }}>

        {/* Photo */}
        <div style={{ animation:'fadeUp .8s .05s cubic-bezier(.22,1,.36,1) both' }}>
          <img src="pix.jpg" alt="Felix Happy Michael" style={{ width:'clamp(96px,12vw,136px)', height:'clamp(96px,12vw,136px)', borderRadius:'50%', objectFit:'cover', objectPosition:'center top', border:'3px solid rgba(0,201,167,.55)', boxShadow:'0 0 0 7px rgba(0,201,167,.1),0 16px 56px rgba(0,0,0,.65)', display:'block', margin:'0 auto' }} />
        </div>

        <div style={{ width:'100%', maxWidth:1000 }}>
          {/* Eyebrow */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:9, background:'rgba(0,201,167,.07)', border:'1px solid rgba(0,201,167,.2)', borderRadius:20, padding:'5px 14px', marginBottom:18, fontFamily:'monospace', fontSize:10, color:T, letterSpacing:'.04em', animation:'fadeUp .7s .15s cubic-bezier(.22,1,.36,1) both' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:T, animation:'breathe 2.2s ease-in-out infinite', flexShrink:0 }} />
            Finance Leader &nbsp;·&nbsp; FinTech Builder
          </div>

          {/* Name */}
          <div style={{ marginBottom:14, animation:'fadeUp .8s .25s cubic-bezier(.22,1,.36,1) both' }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(1.9rem,5vw,3.6rem)', fontWeight:800, letterSpacing:'-.04em', lineHeight:1.0, color:'#e8edf5', textTransform:'uppercase', margin:0 }}>
              Felix H. <span style={{ color:T, textShadow:`0 0 20px rgba(0,201,167,.6),0 0 40px rgba(0,201,167,.3)` }}>Michael</span>
            </h1>
            <div style={{ marginTop:10 }}><TypedRole /></div>
          </div>

          {/* Description */}
          <p style={{ fontSize:'clamp(13px,1.5vw,15px)', color:'#4a6080', maxWidth:660, margin:'0 auto 28px', lineHeight:1.78, animation:'fadeUp .8s .38s cubic-bezier(.22,1,.36,1) both' }}>
            Chartered Accountant driving financial excellence, regulatory compliance, and digital transformation across complex organisations. I build the tools others only talk about.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:14, marginBottom:40, animation:'fadeUp .8s .48s cubic-bezier(.22,1,.36,1) both' }}>
            <button onClick={onPortal} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:11, fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, background:T, color:N, border:'none', cursor:'pointer', transition:'all .28s', letterSpacing:'-.015em' }}
              onMouseEnter={e => { e.currentTarget.style.background='#00a98e'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 10px 34px rgba(0,201,167,.32)'; }}
              onMouseLeave={e => { e.currentTarget.style.background=T; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              Access Resources
            </button>
            <a href="#contact" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:11, fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, background:'transparent', border:'1px solid rgba(255,255,255,.14)', color:'#8fa3bf', textDecoration:'none', transition:'all .28s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.09)'; e.currentTarget.style.color='#e8edf5'; e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#8fa3bf'; e.currentTarget.style.transform='none'; }}>
              Get in Touch
            </a>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'clamp(1.5rem,4vw,4rem)', padding:'1.5rem clamp(1rem,3vw,2.5rem)', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:16, animation:'fadeUp .8s .6s cubic-bezier(.22,1,.36,1) both' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ position:'relative', ...(i > 0 ? { paddingLeft:'clamp(.75rem,2vw,2rem)' } : {}) }}>
                {i > 0 && <span style={{ position:'absolute', left:0, top:'15%', height:'70%', width:1, background:'#2a3f58', display:'block' }} />}
                <Counter val={s.val} prefix={s.prefix||''} suffix={s.suffix} />
                <div style={{ fontSize:10.5, color:'#4a6080', fontFamily:'monospace', marginTop:6, letterSpacing:'.02em', lineHeight:1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Marquee ───────────────────────────────────────────────────
function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow:'hidden', borderTop:'1px solid rgba(255,255,255,.09)', borderBottom:'1px solid rgba(255,255,255,.09)', background:'#071020', padding:'.7rem 0', position:'relative', zIndex:1, maskImage:'linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%)', WebkitMaskImage:'linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%)' }}>
      <div style={{ display:'flex', width:'max-content', animation:'marqScroll 80s linear infinite' }}>
        {[0,1].map(set => (
          <div key={set} style={{ display:'flex', flexShrink:0 }} aria-hidden={set===1}>
            {MARQUEE_ITEMS.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'0 28px', whiteSpace:'nowrap', fontFamily:'monospace', fontSize:11.5, color:'#4a6080', letterSpacing:'.04em' }}>
                <span style={{ width:4, height:4, borderRadius:'50%', background:T, opacity:.55, flexShrink:0 }} />
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" style={{ ...S.section, background:'#071020' }}>
      <div style={S.inner}>
        <Reveal><div style={S.sLabel}><span style={{ opacity:.5 }}>//</span>About</div></Reveal>
        <Reveal><h2 style={S.sTitle}>Financial Excellence<br/>Meets Digital Innovation</h2></Reveal>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(2rem,4vw,3.5rem)', alignItems:'start', marginTop:40 }}>
          <Reveal>
            <div style={{ display:'flex', flexDirection:'column', gap:15 }}>
              {[
                'I am a <strong>proven finance professional</strong> with a track record of <strong>driving financial excellence and ensuring regulatory compliance, offering expertise in financial reporting, tax management, and strategic financial planning</strong> to support business growth.',
                'My core competencies include <strong>meticulous management and analysis of financial data, proficiency in financial modeling, adept budget management, knowledge of Nigerian tax law, IFRS financial reporting and tech-savvy.</strong>',
                'Beyond core finance functions, I build <strong>bespoke financial solutions</strong> — advanced Excel/VBA applications, web-based bank reconciliation engines, ECL models, receivables trackers, and automated reporting platforms — leveraging AI & domain knowledge to solve real business problems with technology.',
              ].map((p, i) => (
                <p key={i} style={{ fontSize:13.5, color:'#8fa3bf', lineHeight:1.82, margin:0 }} dangerouslySetInnerHTML={{ __html:p.replace(/<strong>/g,'<strong style="color:#e8edf5;font-weight:600">') }} />
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ fontFamily:'monospace', fontSize:10.5, color:'#4a6080', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:14 }}>Core Competencies</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {SKILLS.map(sk => (
                <div key={sk} style={{ background:'#0f1f3d', border:'1px solid rgba(255,255,255,.05)', borderRadius:7, padding:'8px 12px', fontSize:11.5, fontFamily:'monospace', color:'#8fa3bf', display:'flex', alignItems:'center', gap:8, transition:'all .22s', cursor:'default' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,201,167,.3)'; e.currentTarget.style.color=T; e.currentTarget.style.background='rgba(0,201,167,.04)'; e.currentTarget.style.transform='translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.05)'; e.currentTarget.style.color='#8fa3bf'; e.currentTarget.style.background='#0f1f3d'; e.currentTarget.style.transform='none'; }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:T, flexShrink:0 }} />{sk}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Experience ────────────────────────────────────────────────
function Experience() {
  return (
    <section id="experience" style={S.section}>
      <div style={S.inner}>
        <Reveal><div style={S.sLabel}><span style={{ opacity:.5 }}>//</span>Experience</div></Reveal>
        <Reveal><h2 style={S.sTitle}>Career Journey</h2></Reveal>
        <div style={{ position:'relative', paddingLeft:32, marginTop:40 }}>
          <div style={{ position:'absolute', left:0, top:10, bottom:0, width:1, background:'linear-gradient(to bottom,#00c9a7 0%,rgba(0,201,167,.2) 60%,transparent 100%)' }} />
          {TIMELINE.map((item, i) => (
            <Reveal key={i} delay={i * 0.1} style={{ position:'relative', marginBottom:40 }}>
              <div style={{ position:'absolute', left:-32, top:7, width:10, height:10, borderRadius:'50%', background:T, border:'2px solid #050d1a', boxShadow:'0 0 0 3px rgba(0,201,167,.2),0 0 14px rgba(0,201,167,.3)' }} />
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(14px,1.6vw,16px)', fontWeight:700, letterSpacing:'-.025em', marginBottom:4 }}>{item.company}</div>
              <div style={{ fontSize:12, color:'#8fa3bf', fontFamily:'monospace' }}>{item.role}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Certifications ────────────────────────────────────────────
function Certifications() {
  return (
    <section id="certifications" style={{ ...S.section, background:'#071020' }}>
      <div style={S.inner}>
        <Reveal><div style={S.sLabel}><span style={{ opacity:.5 }}>//</span>Credentials</div></Reveal>
        <Reveal><h2 style={S.sTitle}>Certifications &amp; Education</h2></Reveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginTop:36 }}>
          {CERTS.map(c => (
            <Reveal key={c.abbr}>
              <div style={{ background:'#0f1f3d', border:'1px solid rgba(255,255,255,.05)', borderRadius:13, padding:'1.15rem 1.25rem', transition:'all .25s', cursor:'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,201,167,.3)'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.05)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:T, marginBottom:4 }}>{c.abbr}</div>
                <div style={{ fontSize:11.5, color:'#8fa3bf', lineHeight:1.4, marginBottom:5 }}>{c.name}</div>
                <div style={{ fontSize:10, fontFamily:'monospace', color:'#4a6080' }}>{c.body}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1} style={{ marginTop:32 }}>
          <div style={{ fontFamily:'monospace', fontSize:10.5, color:'#4a6080', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:14 }}>Education</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:10 }}>
            {EDUCATION.map(e => (
              <div key={e.deg} style={{ background:'#0f1f3d', border:'1px solid rgba(255,255,255,.05)', borderRadius:9, padding:'12px 15px', display:'flex', flexDirection:'column', gap:3, transition:'all .2s' }}
                onMouseEnter={el => { el.currentTarget.style.borderColor='rgba(99,179,237,.3)'; el.currentTarget.style.transform='translateX(3px)'; }}
                onMouseLeave={el => { el.currentTarget.style.borderColor='rgba(255,255,255,.05)'; el.currentTarget.style.transform='none'; }}>
                <div style={{ fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600, color:'#e8edf5' }}>{e.deg}</div>
                <div style={{ fontSize:11, fontFamily:'monospace', color:'#4a6080' }}>{e.inst}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Courses ───────────────────────────────────────────────────
function Courses() {
  return (
    <section id="courses" style={S.section}>
      <div style={S.inner}>
        <Reveal><div style={S.sLabel}><span style={{ opacity:.5 }}>//</span>Training</div></Reveal>
        <Reveal><h2 style={S.sTitle}>Other Courses &amp; Programmes</h2></Reveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, marginTop:36 }}>
          {COURSES.map((c, i) => (
            <Reveal key={i} delay={(i % 4) * 0.07}>
              <div style={{ background:'#0f1f3d', border:'1px solid rgba(255,255,255,.05)', borderRadius:12, padding:'1.1rem 1.25rem', display:'flex', alignItems:'flex-start', gap:12, transition:'all .25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(245,166,35,.25)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.05)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(245,166,35,.08)', border:'1px solid rgba(245,166,35,.18)', fontSize:16 }}>📋</div>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:600, color:'#e8edf5', lineHeight:1.35, marginBottom:3 }}>{c.title}</div>
                  <div style={{ fontSize:10.5, fontFamily:'monospace', color:'#4a6080' }}>{c.org}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Tools ─────────────────────────────────────────────────────
function Tools() {
  return (
    <section id="tools" style={{ ...S.section, background:'#071020' }}>
      <div style={S.inner}>
        <Reveal><div style={S.sLabel}><span style={{ opacity:.5 }}>//</span>Tech Stack</div></Reveal>
        <Reveal><h2 style={S.sTitle}>Tools &amp; Platforms</h2></Reveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))', gap:8, marginTop:36 }}>
          {TOOLS.map(t => (
            <div key={t} style={{ background:'#0f1f3d', border:'1px solid rgba(255,255,255,.05)', borderRadius:8, padding:'10px 14px', fontSize:11.5, fontFamily:'monospace', color:'#8fa3bf', textAlign:'center', transition:'all .22s', cursor:'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,201,167,.3)'; e.currentTarget.style.color=T; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.05)'; e.currentTarget.style.color='#8fa3bf'; e.currentTarget.style.transform='none'; }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Portfolio ─────────────────────────────────────────────────
function Portfolio({ onPortal }) {
  return (
    <section id="portfolio" style={{ ...S.section, background:'linear-gradient(160deg,#0f1f3d 0%,rgba(0,201,167,.04) 40%,#0f1f3d 100%)', borderTop:'1px solid rgba(255,255,255,.09)', borderBottom:'1px solid rgba(255,255,255,.09)' }}>
      <div style={S.inner}>
        <div style={{ textAlign:'center', maxWidth:680, margin:'0 auto' }}>
          <Reveal><div style={{ ...S.sLabel, justifyContent:'center' }}><span style={{ opacity:.5 }}>//</span>Portfolio</div></Reveal>
          <Reveal><h2 style={{ ...S.sTitle, textAlign:'center' }}>Tools &amp; Applications</h2></Reveal>
          <Reveal><p style={{ fontSize:14, color:'#8fa3bf', lineHeight:1.75, marginBottom:0 }}>Bespoke financial tools built from deep domain expertise. Sign in to access the full suite.</p></Reveal>
          <Reveal delay={0.1}>
            <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:12, margin:'32px 0' }}>
              {APP_CHIPS.map(chip => (
                <div key={chip} style={{ display:'flex', alignItems:'center', gap:9, background:'#162747', border:'1px solid rgba(255,255,255,.14)', borderRadius:10, padding:'10px 18px', fontSize:12.5, color:'#8fa3bf', transition:'all .25s', cursor:'default' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=T; e.currentTarget.style.color=T; e.currentTarget.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.14)'; e.currentTarget.style.color='#8fa3bf'; e.currentTarget.style.transform='none'; }}>
                  <span style={{ color:T }}>▸</span> {chip}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <button onClick={onPortal} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:11, fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, background:T, color:N, border:'none', cursor:'pointer', transition:'all .28s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#00a98e'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 10px 34px rgba(0,201,167,.32)'; }}
              onMouseLeave={e => { e.currentTarget.style.background=T; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              🔒 Access Resources
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" style={{ ...S.section, background:'#071020' }}>
      <div style={S.inner}>
        <Reveal><div style={S.sLabel}><span style={{ opacity:.5 }}>//</span>Contact</div></Reveal>
        <Reveal><h2 style={S.sTitle}>Let's Connect</h2></Reveal>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(2rem,4vw,3.5rem)', marginTop:40, alignItems:'start' }}>
          <Reveal>
            <p style={{ fontSize:13.5, color:'#8fa3bf', lineHeight:1.75, marginBottom:24 }}>Available for strategic CFO engagements, financial consulting, and collaboration on fintech projects. Open to board advisory roles.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { icon:'💼', label:'LinkedIn', value:'linkedin.com/in/fhmichael', href:'https://www.linkedin.com/in/fhmichael', color:'rgba(0,119,181,.1)' },
                { icon:'🔗', label:'Portfolio Suite', value:'Access Resources Portal', href:'portal/', color:'rgba(0,201,167,.1)' },
              ].map(c => (
                <div key={c.label} style={{ background:'#0f1f3d', border:'1px solid rgba(255,255,255,.09)', borderRadius:11, padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:13, transition:'all .22s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,201,167,.3)'; e.currentTarget.style.transform='translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.09)'; e.currentTarget.style.transform='none'; }}>
                  <div style={{ width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:c.color, flexShrink:0, fontSize:18 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize:10, fontFamily:'monospace', color:'#4a6080', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>{c.label}</div>
                    <div style={{ fontSize:13, color:'#e8edf5' }}><a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener" style={{ color:'#63b3ed', transition:'color .2s' }} onMouseEnter={e => e.target.style.color=T} onMouseLeave={e => e.target.style.color='#63b3ed'}>{c.value}</a></div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ fontFamily:'monospace', fontSize:10.5, color:'#4a6080', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:14 }}>Quick Links</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[['#about','👤','About & Profile'],['#experience','💼','Work Experience'],['#certifications','🎓','Certifications & Education'],['#portfolio','📊','Tools & Applications']].map(([href, icon, label]) => (
                <a key={href} href={href} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#0f1f3d', border:'1px solid rgba(255,255,255,.05)', borderRadius:10, fontSize:12.5, color:'#8fa3bf', textDecoration:'none', transition:'all .22s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=T; e.currentTarget.style.color=T; e.currentTarget.style.transform='translateX(5px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.05)'; e.currentTarget.style.color='#8fa3bf'; e.currentTarget.style.transform='none'; }}>
                  <span>{icon}</span>{label}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding:'1.5rem clamp(1.25rem,5vw,3rem)', borderTop:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, position:'relative', zIndex:1 }}>
      <div style={{ fontSize:10.5, color:'#4a6080', fontFamily:'monospace' }}>&copy; {new Date().getFullYear()} <span style={{ color:T }}>Felix Happy Michael</span> · All rights reserved</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:20 }}>
        {[['#hero','Home'],['#about','About'],['#experience','Experience'],['portal/','Portal']].map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize:10.5, fontFamily:'monospace', color:'#4a6080', textDecoration:'none', transition:'color .2s' }}
            onMouseEnter={e => e.target.style.color=T} onMouseLeave={e => e.target.style.color='#4a6080'}>{label}</a>
        ))}
      </div>
    </footer>
  );
}

// ── Back to top ───────────────────────────────────────────────
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} aria-label="Back to top" style={{ position:'fixed', bottom:28, right:28, zIndex:150, width:42, height:42, borderRadius:11, background:'#0f1f3d', border:'1px solid rgba(255,255,255,.14)', display:'flex', alignItems:'center', justifyContent:'center', color:'#8fa3bf', cursor:'pointer', transition:'all .3s', opacity: show ? 1 : 0, pointerEvents: show ? 'auto' : 'none' }}
      onMouseEnter={e => { e.currentTarget.style.background=T; e.currentTarget.style.color=N; e.currentTarget.style.borderColor=T; e.currentTarget.style.transform='translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background='#0f1f3d'; e.currentTarget.style.color='#8fa3bf'; e.currentTarget.style.borderColor='rgba(255,255,255,.14)'; e.currentTarget.style.transform='none'; }}>
      ▲
    </button>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  function goPortal() { navigate('/portal'); }

  return (
    <div style={S.body}>
      {/* Noise texture overlay */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")", opacity:.45, mixBlendMode:'overlay' }} />
      <Nav onPortal={goPortal} />
      <Hero onPortal={goPortal} />
      <Marquee />
      <About />
      <Experience />
      <Certifications />
      <Courses />
      <Tools />
      <Portfolio onPortal={goPortal} />
      <Contact />
      <Footer />
      <BackToTop />
    </div>
  );
}
