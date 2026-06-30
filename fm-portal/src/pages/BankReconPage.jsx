// src/pages/BankReconPage.jsx
// FM Bank Reconciliation Engine — full client-side recon, zero backend data calls

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

// ── CSS variables injected once ───────────────────────────────
const CSS = `
  @keyframes reconSpin { to { transform:rotate(360deg) } }
  @keyframes reconFU   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .recon-ani { animation: reconFU .35s ease both }
  .recon-tw  { overflow-x:auto; border-radius:10px; border:1px solid rgba(255,255,255,.07) }
  .recon-tw table { width:100%; border-collapse:collapse; font-size:12px }
  .recon-tw thead th { background:#162747; color:#4a6080; font-family:monospace; font-size:10px;
    letter-spacing:.06em; text-transform:uppercase; padding:9px 12px; text-align:left;
    border-bottom:1px solid rgba(255,255,255,.07); white-space:nowrap }
  .recon-tw tbody td { padding:8px 12px; border-bottom:1px solid rgba(255,255,255,.07);
    vertical-align:middle; color:#e8edf5 }
  .recon-tw tbody tr:last-child td { border-bottom:none }
  .recon-tw tbody tr:hover { background:rgba(255,255,255,.04) }
  .recon-tw .trt td { background:#162747; font-weight:600; font-family:monospace;
    border-top:1px solid rgba(255,255,255,.13)!important; border-bottom:none!important }
  .recon-tw .trm { background:rgba(0,201,167,.04) }
  .recon-tw .trm:hover { background:rgba(0,201,167,.08) }
  .recon-tw .tru { background:rgba(245,166,35,.04) }
  .recon-tw .tru:hover { background:rgba(245,166,35,.08) }
  .recon-tw .nm { font-family:monospace; text-align:right }
  .recon-tw .nr { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#8fa3bf }
`;

// ── Reconciliation engine (ported verbatim from HTML) ─────────
const AMT_TOL   = 0.005;
const DATE_WIN  = 7;
const SERIAL_MIN = 36526, SERIAL_MAX = 62091;
const STOPWORDS = new Set(['THE','AND','FOR','FROM','TO','IN','OF','ON','AT','BY','IS','A','AN','WITH','VIA',
  'REF','INFO','IFO','FRM','BG','BNG','BGT','NIP','TRF','MOB','PAN','PAC','PMT','PAY','PYT',
  'RPTY','RPYT','REPAYMENT','COOPERATIVE','COOP','SAVINGS','FUND','GIVEN','OUTWARD','INSTANT',
  'PAYMENT','TRANSFER','CUSTOMERS','BETWEEN','WITHDRAWAL','WDR','WTD','WIT','BNK','LTD','PLC',
  'NGN','NGT','NGO','PERSONAL','STAFF','CAPITAL','AFRICAN','HOLDINGS','BAL','BALANCE','DR','CR',
  'ACC','ACCT','ACCOUNT']);
const MON = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};

function stripTime(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function sameMonth(a,b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth(); }
function fmtDate(d) {
  if (!d) return '';
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')}-${mo[d.getMonth()]}-${d.getFullYear()}`;
}
function fmtPeriod(d) {
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${mo[d.getMonth()]} ${d.getFullYear()}`;
}
function parseMonthWord(s) {
  const re = /^(\d{1,2})[\s\-\/]+([A-Za-z]{3,9})[\s\-\/,]+(\d{2,4})$|^([A-Za-z]{3,9})[\s\-\/,]+(\d{1,2})[\s\-\/,]+(\d{2,4})$/;
  const m = s.match(re);
  if (!m) return null;
  let d, mn, y;
  if (m[1]) { d=+m[1]; mn=MON[m[2].toLowerCase().slice(0,3)]; y=+m[3]; }
  else       { mn=MON[m[4].toLowerCase().slice(0,3)]; d=+m[5]; y=+m[6]; }
  if (!mn) return null;
  if (y < 100) y += 2000;
  const dt = new Date(y, mn-1, d);
  return isNaN(dt.getTime()) ? null : dt;
}
function parseDate(raw, fmt) {
  if (raw===null||raw===undefined||raw==='') return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : stripTime(raw);
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)||raw<SERIAL_MIN||raw>SERIAL_MAX) return null;
    const d = new Date(Date.UTC(1899,11,30) + Math.round(raw)*86400000);
    return isNaN(d.getTime()) ? null : stripTime(d);
  }
  let s = String(raw).trim();
  if (!s || s.length < 6) return null;
  s = s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM))?$/i,'').trim();
  const nm = parseMonthWord(s);
  if (nm) return nm;
  s = s.replace(/\./g,'/').replace(/-/g,'/').replace(/,/g,'').replace(/\s+/g,'/');
  const p = s.split('/').filter(x=>x!=='');
  if (p.length !== 3) return null;
  let y,m,d;
  switch(fmt) {
    case 'DMY': d=+p[0]; m=+p[1]; y=+p[2]; break;
    case 'MDY': m=+p[0]; d=+p[1]; y=+p[2]; break;
    case 'YMD': y=+p[0]; m=+p[1]; d=+p[2]; break;
    default: return null;
  }
  if (!y||!m||!d) return null;
  if (y<100) y+=2000;
  if (m<1||m>12||d<1||d>31) return null;
  const dt = new Date(y,m-1,d);
  return isNaN(dt.getTime())||dt.getMonth()!==m-1 ? null : dt;
}
function parseAmt(v) {
  if (v===null||v===undefined||v==='') return 0;
  if (typeof v==='number') return isNaN(v)?0:Math.round(v*100)/100;
  let s=String(v).replace(/[₦$£€\s]/g,'').replace(/,/g,'').trim();
  if (s.startsWith('(')&&s.endsWith(')')) s='-'+s.slice(1,-1);
  s=s.replace(/[DdRr]{2}$/,'').replace(/[Cc][Rr]$/,'').trim();
  const n=parseFloat(s);
  return isNaN(n)?0:Math.round(n*100)/100;
}
function fuzzyScore(glNarr, bsNarr) {
  const SEP='-_|/.,;:#()[]{}';
  let glUp=String(glNarr||'').toUpperCase();
  const bsUp=String(bsNarr||'').toUpperCase();
  for(const c of SEP) glUp=glUp.split(c).join(' ');
  let bsNorm=bsUp;
  for(const c of SEP) bsNorm=bsNorm.split(c).join(' ');
  let hits=0;
  for(const w of glUp.split(' ')) {
    const tok=w.trim(); if(!tok) continue;
    const isNum=/^\d+$/.test(tok);
    if(STOPWORDS.has(tok)) continue;
    if(isNum&&tok.length<6) continue;
    if(!isNum&&tok.length<3) continue;
    if(bsUp.includes(tok)) {
      hits+=isNum?4:2;
    } else if(!isNum) {
      if(tok.length>=5&&bsUp.includes(tok.slice(0,5))) hits+=1;
      else if(tok.length>=4&&bsUp.includes(tok.slice(0,4))) hits+=1;
      if(tok.length>=5&&bsUp.length>=5&&tok.includes(bsUp.slice(0,5))) hits+=1;
    }
  }
  for(const w of bsNorm.split(' ')) {
    const tok=w.trim(); if(!tok) continue;
    const isNum=/^\d+$/.test(tok);
    if(STOPWORDS.has(tok)) continue;
    if(isNum&&tok.length<6) continue;
    if(!isNum&&tok.length<3) continue;
    if(!glUp.includes(tok)&&isNum) continue;
    if(glUp.includes(tok)&&!isNum) hits+=1;
    else if(glUp.includes(tok)&&isNum) hits+=3;
  }
  return hits;
}
function parseSheet(rows, fmt, sheetName, audit) {
  let start=-1;
  for(let i=0;i<rows.length;i++) {
    const row=rows[i]; if(!row||!row.length) continue;
    const cell=row[0]; if(cell===''||cell===null||cell===undefined) continue;
    if(parseDate(cell,fmt)) { start=i; break; }
  }
  if(start<0) return [];
  const data=[];
  for(let i=start;i<rows.length;i++) {
    const row=rows[i]; if(!row||!row.length) continue;
    const cell=row[0]; if(cell===''||cell===null||cell===undefined) continue;
    const dt=parseDate(cell,fmt);
    if(!dt) {
      const s=String(cell);
      if(s&&!/^(date|narration|amount|balance|description|particulars|ref|s\/n|#)/i.test(s))
        audit.push({sheet:sheetName,row:i+1,original:s,parsed:'',comment:'PARSE FAILED'});
      continue;
    }
    if(data.length>0) {
      const prev=data[data.length-1].date;
      if(!sameMonth(dt,prev)&&Math.abs(dt-prev)/86400000>60)
        audit.push({sheet:sheetName,row:i+1,original:String(cell),parsed:fmtDate(dt),comment:'NOTE – LARGE DATE GAP'});
    }
    audit.push({sheet:sheetName,row:i+1,original:String(cell),parsed:fmtDate(dt),comment:'PARSED OK'});
    data.push({date:dt,narr:String(row[1]||'').trim(),dr:parseAmt(row[2]),cr:parseAmt(row[3]),bal:parseAmt(row[4]),used:false});
  }
  return data;
}
function runRecon(bsRaw, glRaw, bsFmt, glFmt) {
  const audit=[];
  const bs=parseSheet(bsRaw,bsFmt,'Bank Statement',audit);
  const gl=parseSheet(glRaw,glFmt,'GL Account',audit);
  function aTol(amt,kw) { return kw>=4?Math.max(AMT_TOL,amt*0.0005):AMT_TOL; }
  function buildCandidates(src,sKey,tgt,tKey,win,minKw) {
    const cands=[];
    for(let i=0;i<src.length;i++) {
      if(src[i].used) continue;
      const sAmt=src[i][sKey]; if(sAmt<AMT_TOL) continue;
      for(let j=0;j<tgt.length;j++) {
        if(tgt[j].used) continue;
        const tAmt=tgt[j][tKey];
        const kw=fuzzyScore(tgt[j].narr,src[i].narr);
        if(kw<minKw) continue;
        if(Math.abs(tAmt-sAmt)>aTol(sAmt,kw)) continue;
        const dd=Math.abs(src[i].date-tgt[j].date)/86400000;
        if(!sameMonth(src[i].date,tgt[j].date)&&dd>win) continue;
        cands.push({i,j,kw,dd,score:kw*10000-dd});
      }
    }
    cands.sort((a,b)=>b.score-a.score);
    return cands;
  }
  function applyMatches(cands,src,sKey,tgt,tKey,out,pass) {
    const uS=new Set(),uT=new Set();
    for(const c of cands) {
      if(uS.has(c.i)||uT.has(c.j)) continue;
      const qual=c.kw>=4?'Strong Match (Ref#)':c.kw>=2?'Strong Match':c.kw>=1?'Keyword Match':'Amount & Date Match';
      out.push({bsDate:fmtDate(src[c.i].date),bsAmt:src[c.i][sKey],bsNarr:src[c.i].narr,
        glDate:fmtDate(tgt[c.j].date),glAmt:tgt[c.j][tKey],glNarr:tgt[c.j].narr,
        dateDiff:Math.round(c.dd),kwHits:c.kw,quality:qual+(pass?` [P${pass}]`:'')});
      uS.add(c.i); uT.add(c.j);
      src[c.i].used=true; tgt[c.j].used=true;
    }
  }
  function trySplit(src,sKey,tgt,tKey,out) {
    for(let i=0;i<src.length;i++) {
      if(src[i].used) continue;
      const sAmt=src[i][sKey]; if(sAmt<AMT_TOL) continue;
      let found=false;
      for(let j=0;j<tgt.length&&!found;j++) {
        if(tgt[j].used) continue;
        const a1=tgt[j][tKey]; if(a1>=sAmt||a1<AMT_TOL) continue;
        for(let k=j+1;k<tgt.length&&!found;k++) {
          if(tgt[k].used) continue;
          const a2=tgt[k][tKey];
          if(Math.abs(a1+a2-sAmt)>Math.max(AMT_TOL,sAmt*0.001)) continue;
          const dd1=Math.abs(src[i].date-tgt[j].date)/86400000;
          const dd2=Math.abs(src[i].date-tgt[k].date)/86400000;
          if(dd1>14||dd2>14) continue;
          if(!sameMonth(src[i].date,tgt[j].date)&&dd1>7) continue;
          if(!sameMonth(src[i].date,tgt[k].date)&&dd2>7) continue;
          const kw1=fuzzyScore(tgt[j].narr,src[i].narr);
          const kw2=fuzzyScore(tgt[k].narr,src[i].narr);
          if(kw1+kw2<1) continue;
          [{r:tgt[j],a:a1,d:Math.round(dd1),kw:kw1},{r:tgt[k],a:a2,d:Math.round(dd2),kw:kw2}].forEach(x=>{
            out.push({bsDate:fmtDate(src[i].date),bsAmt:x.a,bsNarr:src[i].narr+' [SPLIT]',
              glDate:fmtDate(x.r.date),glAmt:x.a,glNarr:x.r.narr,dateDiff:x.d,kwHits:x.kw,quality:'Split Match'});
          });
          src[i].used=tgt[j].used=tgt[k].used=true; found=true;
        }
      }
    }
  }
  const matchedOut=[],matchedIn=[];
  applyMatches(buildCandidates(bs,'dr',gl,'cr',DATE_WIN,0),bs,'dr',gl,'cr',matchedOut,'');
  applyMatches(buildCandidates(bs,'dr',gl,'cr',14,1),      bs,'dr',gl,'cr',matchedOut,'2');
  applyMatches(buildCandidates(bs,'dr',gl,'cr',365,4),     bs,'dr',gl,'cr',matchedOut,'3');
  trySplit(bs,'dr',gl,'cr',matchedOut);
  applyMatches(buildCandidates(bs,'cr',gl,'dr',DATE_WIN,0),bs,'cr',gl,'dr',matchedIn,'');
  applyMatches(buildCandidates(bs,'cr',gl,'dr',14,1),      bs,'cr',gl,'dr',matchedIn,'2');
  applyMatches(buildCandidates(bs,'cr',gl,'dr',365,4),     bs,'cr',gl,'dr',matchedIn,'3');
  trySplit(bs,'cr',gl,'dr',matchedIn);
  const bsDebitOnly=[],bsCreditOnly=[],glCreditOnly=[],glDebitOnly=[];
  for(const r of bs) {
    if(!r.used&&r.dr>=AMT_TOL) bsDebitOnly.push({date:fmtDate(r.date),amt:r.dr,narr:r.narr});
    if(!r.used&&r.cr>=AMT_TOL) bsCreditOnly.push({date:fmtDate(r.date),amt:r.cr,narr:r.narr});
  }
  for(const r of gl) {
    if(!r.used&&r.cr>=AMT_TOL) glCreditOnly.push({period:fmtPeriod(r.date),date:fmtDate(r.date),amt:r.cr,narr:r.narr});
    if(!r.used&&r.dr>=AMT_TOL) glDebitOnly.push({period:fmtPeriod(r.date),date:fmtDate(r.date),amt:r.dr,narr:r.narr});
  }
  const S=(a,k)=>a.reduce((t,r)=>t+r[k],0);
  const totMO=S(matchedOut,'bsAmt'),totMI=S(matchedIn,'bsAmt');
  const totBD=S(bsDebitOnly,'amt'),totBC=S(bsCreditOnly,'amt');
  const totGC=S(glCreditOnly,'amt'),totGD=S(glDebitOnly,'amt');
  const bsCBrow=[...bs].reverse().find(r=>r.bal!==0);
  const bsCB=bsCBrow?bsCBrow.bal:(bs.length?bs[bs.length-1].bal:0);
  const glBals=gl.map(r=>r.bal).filter(b=>Math.abs(b)>0.005);
  const cashbookBal=glBals.length>0?glBals[glBals.length-1]:gl.reduce((s,r)=>s+r.dr-r.cr,0);
  const adjBal=Math.round((bsCB+totBD-totBC+totGD-totGC)*100)/100;
  const variance=Math.round((adjBal-cashbookBal)*100)/100;
  const ok=audit.filter(a=>a.comment==='PARSED OK').length;
  const fail=audit.filter(a=>a.comment==='PARSE FAILED').length;
  const gap=audit.filter(a=>a.comment.includes('LARGE DATE GAP')).length;
  return {
    summary:{bsN:bs.length,glN:gl.length,
      bsTotDr:Math.round(bs.reduce((s,r)=>s+r.dr,0)*100)/100,
      bsTotCr:Math.round(bs.reduce((s,r)=>s+r.cr,0)*100)/100,
      glTotDr:Math.round(gl.reduce((s,r)=>s+r.dr,0)*100)/100,
      glTotCr:Math.round(gl.reduce((s,r)=>s+r.cr,0)*100)/100,
      mOutN:matchedOut.length,mInN:matchedIn.length,
      totMO,totMI,totBD,totBC,totGC,totGD,
      bsCB,adjBal,cashbookBal,variance,ok,fail,gap,
      integrity:fail===0?'PASS':'REVIEW',totalAudit:audit.length},
    matchedOut,matchedIn,bsDebitOnly,bsCreditOnly,glCreditOnly,glDebitOnly,audit
  };
}

// ── Excel export ───────────────────────────────────────────────
function exportXLSX(d) {
  const wb=XLSX.utils.book_new();
  const s=d.summary; const ts=new Date().toISOString().slice(0,10);
  const N=n=>(n==null||isNaN(+n))?0:+n;
  const vari=Math.round((N(s.adjBal)-N(s.cashbookBal))*100)/100;
  const rec=Math.abs(vari)<0.01;
  const sumAoa=[
    ['FM BANK RECONCILIATION SUMMARY','',''],
    ['Elites Integrated Systems · Bank-to-GL Reconciliation Report','',''],
    ['Generated: '+ts,'',''],['','',''],
    ['BANK STATEMENT','',''],
    ['  Total Transactions',s.bsN,'entries'],
    ['  Total Debit (Outflows)',N(s.bsTotDr),'NGN'],
    ['  Total Credit (Inflows)',N(s.bsTotCr),'NGN'],['','',''],
    ['GL ACCOUNT','',''],
    ['  Total GL Entries',s.glN,'entries'],
    ['  Total Debit in GL',N(s.glTotDr),'NGN'],
    ['  Total Credit in GL',N(s.glTotCr),'NGN'],['','',''],
    ['RECONCILIATION RESULTS','',''],
    ['  Matched Outflows',s.mOutN,'entries'],['  Matched Outflows Amount',N(s.totMO),'NGN'],
    ['  Matched Inflows',s.mInN,'entries'],['  Matched Inflows Amount',N(s.totMI),'NGN'],['','',''],
    ['  BS Debit NOT in GL',d.bsDebitOnly.length,'entries'],['  BS Debit NOT in GL Amount',N(s.totBD),'NGN'],
    ['  BS Credit NOT in GL',d.bsCreditOnly.length,'entries'],['  BS Credit NOT in GL Amount',N(s.totBC),'NGN'],
    ['  GL Credit NOT in BS',d.glCreditOnly.length,'entries'],['  GL Credit NOT in BS Amount',N(s.totGC),'NGN'],
    ['  GL Debit NOT in BS',d.glDebitOnly.length,'entries'],['  GL Debit NOT in BS Amount',N(s.totGD),'NGN'],['','',''],
    ['BALANCE RECONCILIATION','',''],
    ['  Bank Statement Closing Balance',N(s.bsCB),'NGN'],
    ['  Add: Debit in BS not in GL',N(s.totBD),'NGN (+)'],
    ['  Less: Credit in BS not in GL',-N(s.totBC),'NGN (-)'],
    ['  Add: Debit in GL not in BS',N(s.totGD),'NGN (+)'],
    ['  Less: Credit in GL not in BS',-N(s.totGC),'NGN (-)'],
    ['  ADJUSTED BANK BALANCE',N(s.adjBal),'NGN'],['','',''],
    ['  Cashbook Balance',N(s.cashbookBal),'NGN'],
    [rec?'  RESULT: RECONCILED':'  RESULT: VARIANCE DETECTED',rec?0:vari,rec?'':'NGN'],['','',''],
    ['DATE INTEGRITY','',''],['  Result',s.integrity,''],
    ['  Dates OK',s.ok,'rows'],['  Failures',s.fail,'rows'],
  ];
  const ws=XLSX.utils.aoa_to_sheet(sumAoa);
  ws['!cols']=[{wch:58},{wch:22},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws,'Recon Summary');
  function sht(name,rows,widths) {
    const ws2=XLSX.utils.json_to_sheet(rows.length?rows:[{'':'No entries'}]);
    if(widths) ws2['!cols']=widths.map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws2,name);
  }
  const moR=d.matchedOut.map((r,i)=>({'#':i+1,'BS Date':r.bsDate,'BS Amount':N(r.bsAmt),'BS Narration':r.bsNarr,'GL Date':r.glDate,'GL Amount':N(r.glAmt),'GL Description':r.glNarr,'Days Diff':r.dateDiff,'KW Hits':r.kwHits,'Quality':r.quality}));
  sht('Matched Outflows',moR,[4,13,16,38,13,16,38,9,8,20]);
  const miR=d.matchedIn.map((r,i)=>({'#':i+1,'BS Date':r.bsDate,'BS Amount':N(r.bsAmt),'BS Narration':r.bsNarr,'GL Date':r.glDate,'GL Amount':N(r.glAmt),'GL Description':r.glNarr,'Days Diff':r.dateDiff,'KW Hits':r.kwHits,'Quality':r.quality}));
  sht('Matched Inflows',miR,[4,13,16,38,13,16,38,9,8,20]);
  sht('BS Debit Not in GL',  d.bsDebitOnly.map((r,i)=>({'#':i+1,'Date':r.date,'Amount':N(r.amt),'Narration':r.narr})),[4,14,18,46]);
  sht('BS Credit Not in GL', d.bsCreditOnly.map((r,i)=>({'#':i+1,'Date':r.date,'Amount':N(r.amt),'Narration':r.narr})),[4,14,18,46]);
  sht('GL Credit Not in BS', d.glCreditOnly.map((r,i)=>({'#':i+1,'Period':r.period,'Date':r.date,'Amount':N(r.amt),'Description':r.narr})),[4,12,14,18,44]);
  sht('GL Debit Not in BS',  d.glDebitOnly.map((r,i)=>({'#':i+1,'Period':r.period,'Date':r.date,'Amount':N(r.amt),'Description':r.narr})),[4,12,14,18,44]);
  sht('Date Audit Log', d.audit.map(a=>({'Sheet':a.sheet,'Row':a.row,'Original':a.original,'Parsed':a.parsed||'—','Comment':a.comment})),[16,6,22,14,28]);
  XLSX.writeFile(wb,`FM-BankRecon-${ts}.xlsx`);
}

// ── Template download ──────────────────────────────────────────
function downloadTemplate() {
  const rows=[
    ['Date','Narration','DR Amount','CR Amount','Balance Amount'],
    ['01/01/2026','Opening Balance',0,0,500000],
    ['02/01/2026','POS Purchase',15000,0,485000],
    ['03/01/2026','Customer Deposit',0,250000,735000],
    ['05/01/2026','Transfer to Vendor',50000,0,685000],
    ['07/01/2026','Bank Charges',1500,0,683500],
  ];
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:14},{wch:40},{wch:16},{wch:16},{wch:18}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Template');
  XLSX.writeFile(wb,'FM-BankRecon-Template.xlsx');
}

// ── File reader ────────────────────────────────────────────────
function readFile(file) {
  return new Promise((res,rej) => {
    const fr=new FileReader();
    fr.onload=e=>{
      try {
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true,cellNF:false,cellText:false});
        const ws=wb.Sheets[wb.SheetNames[0]];
        res(XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true}));
      } catch(ex){rej(ex);}
    };
    fr.onerror=()=>rej(new Error('File read failed'));
    fr.readAsArrayBuffer(file);
  });
}

// ── Format number ──────────────────────────────────────────────
const fN = n => n==null||isNaN(n) ? '—' : Number(n).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2});

// ── Shared styles ──────────────────────────────────────────────
const C = {
  t: '#00c9a7', am: '#f5a623', rd: '#e05252', gr: '#22c55e',
  tx: '#e8edf5', tx2: '#8fa3bf', tx3: '#4a6080',
  n: '#0a1628', n2: '#0f1f3d', n3: '#162747',
  b: 'rgba(255,255,255,.07)', b2: 'rgba(255,255,255,.13)',
};
const card = { background:C.n2, border:`1px solid ${C.b}`, borderRadius:16, padding:'1.75rem 2rem', boxShadow:'0 1px 3px rgba(0,0,0,.4),0 4px 16px rgba(0,0,0,.3)' };
const btn  = (primary=false) => ({ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:primary?600:500, borderRadius:10, padding:'10px 22px', cursor:'pointer', border:`1px solid ${primary?C.t:C.b2}`, background:primary?C.t:'transparent', color:primary?C.n:C.tx2, transition:'all .2s', display:'inline-flex', alignItems:'center', gap:8, whiteSpace:'nowrap' });
const pill = (color, bg, border) => ({ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:20, fontSize:10, fontFamily:'monospace', fontWeight:500, whiteSpace:'nowrap', color, background:bg, border:`1px solid ${border}` });

// ── Sub-components ─────────────────────────────────────────────
function Spin() {
  return <span style={{ width:44, height:44, border:`3px solid ${C.b2}`, borderTopColor:C.t, borderRadius:'50%', display:'inline-block', animation:'reconSpin .8s linear infinite' }} />;
}

function StepBar({ step }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:40 }}>
      {[1,2,3].map((n,i) => (
        <>
          <div key={n} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, fontFamily:'monospace', color: step>n?C.t : step===n?C.tx:C.tx3, transition:'color .3s' }}>
            <div style={{ width:26, height:26, borderRadius:'50%', border:`1.5px solid ${step>n?C.t:step===n?C.tx:C.tx3}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, background:step>n?C.t:'transparent', color:step>n?C.n:'currentColor', transition:'all .3s', flexShrink:0 }}>
              {step>n?'✓':n}
            </div>
            <span style={{ display: window.innerWidth<680 ? 'none' : 'inline' }}>{['Upload files','Date formats','Results'][i]}</span>
          </div>
          {n<3 && <div key={`l${n}`} style={{ flex:1, height:1, background:step>n?C.t:C.b2, margin:'0 12px', minWidth:24, transition:'background .3s' }} />}
        </>
      ))}
    </div>
  );
}

function UploadBox({ icon, label, hint, file, rows, onFile, id }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const preview = rows?.slice(0,6);

  return (
    <div>
      <div onClick={() => inputRef.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)onFile(f);}}
        style={{ border:`1.5px dashed ${file||drag?C.t:C.b2}`, borderStyle:file?'solid':'dashed', borderRadius:10, padding:'1.75rem 1.25rem', textAlign:'center', cursor:'pointer', transition:'all .2s', background:file||drag?'rgba(0,201,167,.13)':'rgba(0,201,167,.06)' }}>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.xlsm" style={{ display:'none' }} onChange={e=>e.target.files[0]&&onFile(e.target.files[0])} />
        <div style={{ fontSize:'2rem', marginBottom:10, lineHeight:1 }}>{icon}</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:11, color:C.tx3 }}>{file ? '' : hint}</div>
        {file && <div style={{ fontSize:12, color:C.t, fontFamily:'monospace', marginTop:6, wordBreak:'break-all' }}>{file.name}</div>}
        {rows && <div style={{ fontSize:11, color:C.tx2, marginTop:2 }}>{rows.length} rows read</div>}
      </div>
      {preview && preview.length > 0 && (
        <div style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${C.b}`, borderRadius:10, overflow:'auto', maxHeight:160, marginTop:14 }}>
          <div style={{ fontSize:11, fontFamily:'monospace', color:C.tx3, padding:'6px 10px', borderBottom:`1px solid ${C.b}` }}>Preview — first {preview.length} rows</div>
          <div className="recon-tw"><table><thead><tr>{['Date','Narration','DR','CR','Balance'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>{preview.map((r,i)=><tr key={i}>{[0,1,2,3,4].map(c=><td key={c} className={c>=2?'nm':c===1?'nr':''}>{r[c]??''}</td>)}</tr>)}</tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}

// ── Metric cards ───────────────────────────────────────────────
function MetricCards({ result }) {
  const s=result.summary, d=result;
  const items=[
    {l:'BS Transactions',v:`Total: ${s.bsN}`,sub:`DR: ${d.bsDebitOnly.length+s.mOutN} | CR: ${d.bsCreditOnly.length+s.mInN}`,ac:false},
    {l:'GL Entries',v:`Total: ${s.glN}`,sub:`DR: ${d.glDebitOnly.length+s.mInN} | CR: ${d.glCreditOnly.length+s.mOutN}`,ac:false},
    {l:'Total BS Outflows',v:`₦${fN(s.bsTotDr)}`,sub:'',ac:false},
    {l:'Total BS Inflows',v:`₦${fN(s.bsTotCr)}`,sub:'',ac:false},
    {l:'Total GL Debits',v:`₦${fN(s.glTotDr)}`,sub:'',ac:false},
    {l:'Total GL Credits',v:`₦${fN(s.glTotCr)}`,sub:'',ac:false},
    {l:'Matched Outflows',v:s.mOutN,sub:`₦${fN(s.totMO)}`,ac:true,vc:C.t},
    {l:'Matched Inflows',v:s.mInN,sub:`₦${fN(s.totMI)}`,ac:false,vc:C.gr},
    {l:'BS Debit Not in GL',v:d.bsDebitOnly.length,sub:`₦${fN(s.totBD)}`,ac:false,vc:C.am},
    {l:'BS Credit Not in GL',v:d.bsCreditOnly.length,sub:`₦${fN(s.totBC)}`,ac:false,vc:C.am},
    {l:'GL Credit Not in BS',v:d.glCreditOnly.length,sub:`₦${fN(s.totGC)}`,ac:false,vc:d.glCreditOnly.length?C.am:''},
    {l:'GL Debit Not in BS',v:d.glDebitOnly.length,sub:`₦${fN(s.totGD)}`,ac:false,vc:d.glDebitOnly.length?C.am:''},
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(148px,1fr))', gap:10, marginBottom:28 }}>
      {items.map(m=>(
        <div key={m.l} style={{ background:m.ac?'rgba(0,201,167,.13)':C.n3, border:`1px solid ${m.ac?'rgba(0,201,167,.3)':C.b}`, borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontFamily:'monospace', color:C.tx3, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:6 }}>{m.l}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:600, letterSpacing:'-.03em', lineHeight:1, color:m.vc||C.tx }}>{m.v}</div>
          {m.sub && <div style={{ fontSize:10, fontFamily:'monospace', color:C.tx2, marginTop:4 }}>{m.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Summary tab ────────────────────────────────────────────────
function SummaryTab({ result }) {
  const s=result.summary;
  const vari=Math.round((s.adjBal-s.cashbookBal)*100)/100;
  const rec=Math.abs(vari)<0.01;
  const rows=[
    {l:'Bank Statement Closing Balance',v:`₦${fN(s.bsCB)}`,c:''},
    {l:'Add: Debit in BS not in GL',v:`₦${fN(s.totBD)}`,c:C.gr},
    {l:'Less: Credit in BS not in GL',v:`(₦${fN(s.totBC)})`,c:C.rd},
    {l:'Add: Debit in GL not in BS',v:`₦${fN(s.totGD)}`,c:C.gr},
    {l:'Less: Credit in GL not in BS',v:`(₦${fN(s.totGC)})`,c:C.rd},
  ];
  return (
    <div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:600, marginBottom:16 }}>Balance Reconciliation Statement</div>
      <div style={{ background:C.n3, border:`1px solid ${C.b}`, borderRadius:10, overflow:'hidden', maxWidth:490 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}><td style={{ padding:'10px 16px', borderBottom:`1px solid ${C.b}`, color:C.tx2 }}>{r.l}</td><td style={{ padding:'10px 16px', borderBottom:`1px solid ${C.b}`, textAlign:'right', fontFamily:'monospace', color:r.c||C.tx }}>{r.v}</td></tr>
            ))}
            <tr style={{ background:'rgba(0,201,167,.13)', borderTop:`1px solid ${C.t}` }}>
              <td style={{ padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700 }}>Adjusted Bank Balance</td>
              <td style={{ padding:'10px 16px', textAlign:'right', fontFamily:'monospace', color:C.t, fontSize:16, fontWeight:600 }}>₦{fN(s.adjBal)}</td>
            </tr>
            <tr><td style={{ padding:'10px 16px', borderTop:`1px solid ${C.b}`, fontWeight:600 }}>Cashbook Balance</td><td style={{ padding:'10px 16px', borderTop:`1px solid ${C.b}`, textAlign:'right', fontFamily:'monospace', fontWeight:600 }}>₦{fN(s.cashbookBal)}</td></tr>
            <tr style={{ background:rec?'rgba(34,197,94,.08)':'rgba(224,82,82,.08)', borderTop:`1px solid ${rec?'rgba(34,197,94,.25)':'rgba(224,82,82,.2)'}` }}>
              <td style={{ padding:'10px 16px', fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700 }}>{rec?'✓ RECONCILED':'✗ VARIANCE'}</td>
              <td style={{ padding:'10px 16px', textAlign:'right', fontFamily:'monospace', fontSize:15, fontWeight:600, color:rec?C.gr:C.rd }}>{rec?'₦0.00':'₦'+fN(vari)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:490, marginTop:24 }}>
        {[['Total BS Outflows',`₦${fN(s.bsTotDr)}`],['Total BS Inflows',`₦${fN(s.bsTotCr)}`],['Total GL Debits',`₦${fN(s.glTotDr)}`],['Total GL Credits',`₦${fN(s.glTotCr)}`]].map(([l,v])=>(
          <div key={l} style={{ background:C.n3, border:`1px solid ${C.b}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:10, fontFamily:'monospace', color:C.tx3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:600 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Matched table ──────────────────────────────────────────────
function MatchedTable({ data, tot, isOut }) {
  if (!data.length) return <div style={{ textAlign:'center', padding:'3rem', color:C.tx3, fontFamily:'monospace', fontSize:12 }}>✓ No matched {isOut?'outflow':'inflow'} entries</div>;
  return (
    <div className="recon-tw"><table>
      <thead><tr>{['#','BS Date','BS Amount (₦)','BS Narration','GL Date','GL Amount (₦)','GL Description','Days','KW','Quality'].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>
        {data.map((r,i)=>(
          <tr key={i} className="trm">
            <td style={{ color:C.tx3 }}>{i+1}</td>
            <td style={{ fontFamily:'monospace', fontSize:11 }}>{r.bsDate}</td>
            <td className="nm">₦{fN(r.bsAmt)}</td>
            <td className="nr" title={r.bsNarr}>{r.bsNarr}</td>
            <td style={{ fontFamily:'monospace', fontSize:11 }}>{r.glDate}</td>
            <td className="nm">₦{fN(r.glAmt)}</td>
            <td className="nr" title={r.glNarr}>{r.glNarr}</td>
            <td className="nm">{r.dateDiff}</td>
            <td className="nm">{r.kwHits}</td>
            <td><span style={r.kwHits>=1?pill(C.t,'rgba(0,201,167,.13)','rgba(0,201,167,.2)'):pill('#63b3ed','rgba(99,179,237,.1)','rgba(99,179,237,.2)')}>
              {r.kwHits>=1?'Strong Match':'Amt & Date'}
            </span></td>
          </tr>
        ))}
        <tr className="trt"><td colSpan={2} style={{ textAlign:'right', color:C.tx3 }}>TOTAL</td><td className="nm">₦{fN(tot)}</td><td colSpan={7}/></tr>
      </tbody>
    </table></div>
  );
}

// ── Unmatched BS table ─────────────────────────────────────────
function UnmatchedBSTable({ data, tot, note }) {
  if (!data.length) return <div style={{ textAlign:'center', padding:'3rem', color:C.tx3, fontFamily:'monospace', fontSize:12 }}>✓ No entries in this category</div>;
  return (
    <>
      <div style={{ background:'rgba(245,166,35,.07)', border:'1px solid rgba(245,166,35,.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.tx2, marginBottom:16, lineHeight:1.5 }}>{note}</div>
      <div className="recon-tw"><table>
        <thead><tr>{['#','Date','Amount (₦)','Narration / Remarks'].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {data.map((r,i)=>(
            <tr key={i} className="tru">
              <td style={{ color:C.tx3 }}>{i+1}</td>
              <td style={{ fontFamily:'monospace', fontSize:11 }}>{r.date}</td>
              <td className="nm">₦{fN(r.amt)}</td>
              <td className="nr" title={r.narr}>{r.narr}</td>
            </tr>
          ))}
          <tr className="trt"><td colSpan={2} style={{ textAlign:'right', color:C.tx3 }}>TOTAL</td><td className="nm">₦{fN(tot)}</td><td/></tr>
        </tbody>
      </table></div>
    </>
  );
}

// ── Unmatched GL table ─────────────────────────────────────────
function UnmatchedGLTable({ data, tot, note }) {
  if (!data.length) return <div style={{ textAlign:'center', padding:'3rem', color:C.tx3, fontFamily:'monospace', fontSize:12 }}>✓ No entries in this category</div>;
  return (
    <>
      <div style={{ background:'rgba(245,166,35,.07)', border:'1px solid rgba(245,166,35,.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.tx2, marginBottom:16, lineHeight:1.5 }}>{note}</div>
      <div className="recon-tw"><table>
        <thead><tr>{['#','Period','GL Date','Amount (₦)','GL Description'].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {data.map((r,i)=>(
            <tr key={i} className="tru">
              <td style={{ color:C.tx3 }}>{i+1}</td>
              <td style={{ fontFamily:'monospace', fontSize:11 }}>{r.period}</td>
              <td style={{ fontFamily:'monospace', fontSize:11 }}>{r.date}</td>
              <td className="nm">₦{fN(r.amt)}</td>
              <td className="nr" title={r.narr}>{r.narr}</td>
            </tr>
          ))}
          <tr className="trt"><td colSpan={3} style={{ textAlign:'right', color:C.tx3 }}>TOTAL</td><td className="nm">₦{fN(tot)}</td><td/></tr>
        </tbody>
      </table></div>
    </>
  );
}

// ── Date audit tab ─────────────────────────────────────────────
function AuditTab({ audit, summary: s }) {
  const issues=audit.filter(a=>a.comment!=='PARSED OK');
  return (
    <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        {[{l:`Total: ${audit.length}`,c:pill('#63b3ed','rgba(99,179,237,.1)','rgba(99,179,237,.2)')},
          {l:`OK: ${s.ok}`,c:pill(C.gr,'rgba(34,197,94,.1)','rgba(34,197,94,.2)')},
          s.fail?{l:`Failed: ${s.fail}`,c:pill(C.rd,'rgba(224,82,82,.1)','rgba(224,82,82,.2)')}:null,
          s.gap?{l:`Gaps: ${s.gap}`,c:pill(C.am,'rgba(245,166,35,.1)','rgba(245,166,35,.2)')}:null,
        ].filter(Boolean).map(({l,c})=><span key={l} style={c}>{l}</span>)}
      </div>
      {!issues.length
        ? <div style={{ textAlign:'center', padding:'3rem', color:C.tx3, fontFamily:'monospace', fontSize:12 }}>✓ All dates parsed cleanly — no issues to review</div>
        : <div className="recon-tw"><table>
            <thead><tr>{['Sheet','Row','Original Value','Parsed Date','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {issues.slice(0,500).map((a,i)=>{
                const pc=a.comment.includes('FAILED')?pill(C.rd,'rgba(224,82,82,.1)','rgba(224,82,82,.2)'):a.comment.includes('GAP')?pill(C.am,'rgba(245,166,35,.1)','rgba(245,166,35,.2)'):pill(C.gr,'rgba(34,197,94,.1)','rgba(34,197,94,.2)');
                return <tr key={i}><td>{a.sheet}</td><td style={{ fontFamily:'monospace' }}>{a.row}</td><td style={{ fontFamily:'monospace', fontSize:11 }}>{a.original}</td><td style={{ fontFamily:'monospace', fontSize:11 }}>{a.parsed||'—'}</td><td><span style={pc}>{a.comment}</span></td></tr>;
              })}
            </tbody>
          </table></div>
      }
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function BankReconPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]           = useState(1);
  const [bsFile, setBsFile]       = useState(null);
  const [glFile, setGlFile]       = useState(null);
  const [bsRaw, setBsRaw]         = useState(null);
  const [glRaw, setGlRaw]         = useState(null);
  const [bsFmt, setBsFmt]         = useState('DMY');
  const [glFmt, setGlFmt]         = useState('DMY');
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState('Processing...');
  const [error, setError]         = useState('');
  const [result, setResult]       = useState(null);
  const [activeTab, setActiveTab] = useState('sum');
  const [dlOpen, setDlOpen]       = useState(false);

  const TABS = [
    {key:'sum',label:'Summary'},
    {key:'out',label:'Matched outflows'},
    {key:'inf',label:'Matched inflows'},
    {key:'bsd',label:'BS debit not in GL'},
    {key:'bsc',label:'BS credit not in GL'},
    {key:'glc',label:'GL credit not in BS'},
    {key:'gld',label:'GL debit not in BS'},
    {key:'aud',label:'Date audit'},
  ];

  const LOAD_MSGS = ['Parsing date columns...','Normalising amounts...','Running fuzzy match engine...','Building result tables...'];

  async function handleFile(file, which) {
    try {
      const raw = await readFile(file);
      if (which === 'bs') { setBsFile(file); setBsRaw(raw); }
      else                { setGlFile(file); setGlRaw(raw); }
    } catch(e) {
      setError('File error: ' + e.message);
    }
  }

  async function handleRun() {
    if (!bsRaw || !glRaw) return;
    setLoading(true); setError('');
    let mi=0;
    setLoadMsg(LOAD_MSGS[0]);
    const tk = setInterval(() => { mi=(mi+1)%LOAD_MSGS.length; setLoadMsg(LOAD_MSGS[mi]); }, 850);
    try {
      await new Promise(r => setTimeout(r,80));
      const res = runRecon(bsRaw, glRaw, bsFmt, glFmt);
      setResult(res);
      setStep(3);
    } catch(e) {
      setError('Error: ' + e.message);
    } finally {
      clearInterval(tk); setLoading(false);
    }
  }

  function handleReset() {
    setBsFile(null); setGlFile(null); setBsRaw(null); setGlRaw(null);
    setResult(null); setStep(1); setError(''); setActiveTab('sum');
  }

  function handleLogout() {
    if (!confirm('Sign out?')) return;
    logout(); navigate('/portal');
  }

  const navBtn = (href, label) => (
    <a href={href} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:`1px solid ${C.b2}`, borderRadius:10, padding:'6px 14px', fontSize:12, fontFamily:'monospace', color:C.tx3, cursor:'pointer', transition:'all .2s', textDecoration:'none' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';e.currentTarget.style.color=C.tx;}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.tx3;}}>{label}</a>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.n, color:C.tx, minHeight:'100vh', lineHeight:1.6 }}>
      <style>{CSS}</style>

      {/* Nav bar */}
      <div style={{ background:C.n2, borderBottom:`1px solid ${C.b}`, padding:'0 2rem', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, gap:12 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, letterSpacing:'-.03em', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:C.t, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:C.n, fontWeight:700, letterSpacing:'-.5px', flexShrink:0 }}>FM</div>
          FM BankRecon <span style={{ color:C.t }}>App</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:C.tx3, fontFamily:'monospace' }}>
          {error && <span style={{ color:C.rd, fontSize:11 }}>{error}</span>}
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,.04)', border:`1px solid ${C.b2}`, borderRadius:20, padding:'5px 12px', fontSize:12, color:C.tx2 }}>
            👤 {user?.name || '...'}
          </div>
          {navBtn('../','🏠 Home')}
          {navBtn('/portal','← Portal')}
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:`1px solid ${C.b2}`, borderRadius:10, padding:'6px 14px', fontSize:12, fontFamily:'monospace', color:C.tx3, cursor:'pointer', transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(224,82,82,.1)';e.currentTarget.style.borderColor='rgba(224,82,82,.3)';e.currentTarget.style.color=C.rd;}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=C.b2;e.currentTarget.style.color=C.tx3;}}>
            ⬅ Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1140, margin:'0 auto', padding:'2.5rem 1.5rem 0' }}>
        <StepBar step={step} />

        {/* Step 1 — Upload */}
        {step === 1 && (
          <div className="recon-ani" style={card}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:600, letterSpacing:'-.02em', marginBottom:6 }}>Upload source files</div>
            <div style={{ fontSize:13, color:C.tx2, marginBottom:28, lineHeight:1.55 }}>
              Accepts CSV, XLSX, XLS or XLSM. &nbsp;
              <button onClick={downloadTemplate} style={{ background:'none', border:'none', color:C.t, textDecoration:'underline', fontWeight:600, cursor:'pointer', fontSize:13, padding:0 }}>Download sample template</button>
              <br/>Fill in your data using this format before upload. Headers and blank rows are auto-skipped. Multi-month statements are fully supported.
            </div>
            {error && <div style={{ background:'rgba(224,82,82,.1)', border:'1px solid rgba(224,82,82,.3)', borderRadius:10, padding:'12px 16px', fontSize:13, color:C.rd, marginBottom:24 }}>{error}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
              <UploadBox icon="🏦" label="Bank Statement" hint="Click or drop file here" file={bsFile} rows={bsRaw} onFile={f=>handleFile(f,'bs')} id="bs" />
              <UploadBox icon="📒" label="GL Account"     hint="Click or drop file here" file={glFile} rows={glRaw} onFile={f=>handleFile(f,'gl')} id="gl" />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button onClick={()=>setStep(2)} disabled={!bsFile||!glFile} style={btn(true)}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Date formats */}
        {step === 2 && (
          <div className="recon-ani" style={card}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:600, letterSpacing:'-.02em', marginBottom:6 }}>Date format settings</div>
            <div style={{ fontSize:13, color:C.tx2, marginBottom:28 }}>Select the date format used in each file. Critical for correct parsing — wrong format misreads dates.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
              {[['Bank Statement date format','bf',bsFmt,setBsFmt],['GL Account date format','gf',glFmt,setGlFmt]].map(([label,,val,set])=>(
                <div key={label}>
                  <label style={{ display:'block', fontSize:11, fontFamily:'monospace', color:C.tx2, marginBottom:7, letterSpacing:'.04em', textTransform:'uppercase' }}>{label}</label>
                  <select value={val} onChange={e=>set(e.target.value)} style={{ width:'100%', padding:'10px 36px 10px 14px', background:'rgba(255,255,255,.04)', border:`1px solid ${C.b2}`, borderRadius:10, color:C.tx, fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:'pointer', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238fa3bf' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center' }}>
                    <option value="DMY">DMY — dd/mm/yyyy (Nigerian default)</option>
                    <option value="MDY">MDY — mm/dd/yyyy</option>
                    <option value="YMD">YMD — yyyy-mm-dd</option>
                  </select>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${C.b}`, borderLeft:`3px solid ${C.t}`, borderRadius:10, padding:'12px 16px', fontSize:12, color:C.tx2, lineHeight:1.65, marginBottom:24 }}>
              <strong style={{ color:C.tx, fontFamily:'monospace', fontSize:11, display:'block', marginBottom:4, letterSpacing:'.04em' }}>MATCHING LOGIC</strong>
              Outflows: BS Debit ↔ GL Credit &nbsp;·&nbsp; Inflows: BS Credit ↔ GL Debit<br/>
              Amount tolerance ₦0.005 &nbsp;·&nbsp; Date: same month OR within ±7 days across months (Pass 2: ±14 days)<br/>
              Fuzzy scoring: separators replaced in GL narration only; long numeric tokens (NUBAN accounts) score 4 pts
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
              <button onClick={()=>setStep(1)} style={btn(false)}>← Back</button>
              <button onClick={handleRun} style={btn(true)}>▶ Run reconciliation</button>
            </div>
          </div>
        )}

        {/* Step 3 — Results */}
        {step === 3 && result && (
          <div className="recon-ani">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:700, letterSpacing:'-.03em' }}>Reconciliation results</div>
                <div style={{ fontSize:12, color:C.tx3, fontFamily:'monospace', marginTop:4 }}>{bsFile?.name} · {glFile?.name}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={result.summary.integrity==='PASS'
                  ? { display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:40, fontFamily:'monospace', fontSize:12, fontWeight:500, letterSpacing:'.06em', background:'rgba(34,197,94,.12)', color:C.gr, border:'1px solid rgba(34,197,94,.25)' }
                  : { display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:40, fontFamily:'monospace', fontSize:12, fontWeight:500, letterSpacing:'.06em', background:'rgba(245,166,35,.12)', color:C.am, border:'1px solid rgba(245,166,35,.25)' }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
                  DATE INTEGRITY: {result.summary.integrity}
                </span>
                {/* Download button */}
                <div style={{ position:'relative', display:'inline-flex' }}>
                  <button onClick={()=>exportXLSX(result)} style={{ ...btn(true), borderRadius:'10px 0 0 10px', borderRight:'1px solid rgba(0,0,0,.15)' }}>
                    ⬇ Download Excel
                  </button>
                  <button onClick={e=>{e.stopPropagation();setDlOpen(v=>!v);}} style={{ ...btn(true), padding:'10px 13px', borderRadius:'0 10px 10px 0', borderLeft:'1px solid rgba(0,0,0,.2)' }}>▾</button>
                  {dlOpen && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:C.n2, border:`1px solid ${C.b2}`, borderRadius:10, minWidth:175, boxShadow:'0 4px 24px rgba(0,0,0,.5)', zIndex:50, overflow:'hidden' }}>
                      <button onClick={()=>{setDlOpen(false);exportXLSX(result);}} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', fontSize:13, cursor:'pointer', color:C.tx2, background:'transparent', border:'none', width:'100%', textAlign:'left', transition:'all .15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                        📊 Download as .xlsx
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleReset} style={btn(false)}>↺ New reconciliation</button>
              </div>
            </div>

            <MetricCards result={result} />

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:`1px solid ${C.b}`, marginBottom:24, overflowX:'auto' }}>
              {TABS.map(t=>(
                <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{ padding:'10px 16px', fontSize:12, fontFamily:'monospace', whiteSpace:'nowrap', border:'none', background:'transparent', color:activeTab===t.key?C.t:C.tx3, borderBottom:`2px solid ${activeTab===t.key?C.t:'transparent'}`, marginBottom:-1, borderRadius:0, transition:'all .2s', cursor:'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            {activeTab==='sum' && <SummaryTab result={result} />}
            {activeTab==='out' && <MatchedTable data={result.matchedOut} tot={result.summary.totMO} isOut={true} />}
            {activeTab==='inf' && <MatchedTable data={result.matchedIn}  tot={result.summary.totMI} isOut={false} />}
            {activeTab==='bsd' && <UnmatchedBSTable data={result.bsDebitOnly}  tot={result.summary.totBD} note="These are amounts the bank has debited with no corresponding credit entry in the GL. Common causes: bank charges, NIP fees, third-party debits or missed postings." />}
            {activeTab==='bsc' && <UnmatchedBSTable data={result.bsCreditOnly} tot={result.summary.totBC} note="These are amounts credited into your bank account not yet recorded in the GL. Investigate and post the missing receipt entries." />}
            {activeTab==='glc' && <UnmatchedGLTable data={result.glCreditOnly} tot={result.summary.totGC} note="Payments recorded in the GL as credits but not yet on the bank statement — in-transit items or timing differences. Follow up with the bank." />}
            {activeTab==='gld' && <UnmatchedGLTable data={result.glDebitOnly}  tot={result.summary.totGD} note="Receipts recorded in the GL as debits not yet on bank statement — cheques in clearing or pending reversals." />}
            {activeTab==='aud' && <AuditTab audit={result.audit} summary={result.summary} />}
          </div>
        )}

        <div style={{ textAlign:'center', padding:'24px 1rem 32px', fontFamily:'monospace', fontSize:11, color:C.tx3, borderTop:'1px solid rgba(255,255,255,.06)', marginTop:48, letterSpacing:'.04em' }}>
          © {new Date().getFullYear()} <span style={{ color:C.t }}>Michael Felix Happy</span> · BRS · All rights reserved
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,22,40,.9)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20 }}>
          <Spin />
          <div style={{ fontFamily:'monospace', fontSize:13, color:C.tx2 }}>{loadMsg}</div>
        </div>
      )}
    </div>
  );
}
