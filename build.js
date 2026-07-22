// Build pipeline for fhmic/home
//
// Edit your real pages in src/. Run `npm run build` before every commit/push.
// This produces docs/ — a concealed, obfuscated, hashed-filename version of
// the site that GitHub Pages actually serves (Pages source: "main /docs").
//
// Why not bundle with type="module" like fm-portal? These pages use inline
// onclick="fn()" style HTML attributes that call GLOBAL functions. Module
// scripts don't leak top-level declarations to the global scope, which would
// silently break every onclick handler. So JS/CSS here are extracted and
// obfuscated but kept as classic (non-module) scripts, preserving the exact
// same execution order and global scope as the original inline blocks.
//
// To keep those onclick-style handlers working, this script scans each
// page's HTML for on*="..." attributes (onclick, onchange, oninput, onload,
// etc.) and any href="javascript:..." calls, pulls out the function names
// they invoke, and tells the obfuscator to leave exactly those names alone
// (reservedNames). Everything else — every other function, variable, and
// string literal — gets renamed/flattened/encoded and is not meant to be
// human-readable.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JavaScriptObfuscator = require('javascript-obfuscator');
const CleanCSS = require('clean-css');

const SRC_DIR = path.join(__dirname, 'src');
const OUT_DIR = path.join(__dirname, 'docs');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');

const PAGES = [
  { name: 'index', dir: '' },
  { name: 'capmax', dir: 'capmax' },
  { name: 'gmi', dir: 'gmi' },
  { name: 'job', dir: 'job' },
  { name: 'portal', dir: 'portal' },
  { name: 'receivables', dir: 'receivables' },
  { name: 'recon', dir: 'recon' },
  { name: 'treasury', dir: 'treasury' },
];

const PASSTHROUGH_FILES = ['img.jpg', 'pix.jpg'];

const JS_KEYWORDS = new Set([
  'if', 'else', 'return', 'this', 'void', 'new', 'typeof', 'window',
  'document', 'true', 'false', 'null', 'undefined', 'function', 'var',
  'let', 'const', 'for', 'while', 'switch', 'case', 'break', 'continue',
  'delete', 'in', 'of', 'instanceof', 'do', 'try', 'catch', 'finally',
  'throw', 'event', 'confirm', 'alert',
]);

function hashOf(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

// Scan the ORIGINAL (pre-obfuscation) HTML for every on*="..." / on*='...'
// attribute and href="javascript:..." call, and return the set of global
// function names that must survive obfuscation untouched.
function collectReservedNames(html) {
  const names = new Set();
  const attrPatterns = [
    /\son\w+\s*=\s*"([^"]*)"/gi,
    /\son\w+\s*=\s*'([^']*)'/gi,
    /href\s*=\s*"javascript:([^"]*)"/gi,
    /href\s*=\s*'javascript:([^']*)'/gi,
  ];
  for (const re of attrPatterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const body = m[1];
      for (const stmt of body.split(';')) {
        const call = stmt.trim().replace(/^return\s+/, '');
        const idMatch = call.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
        if (idMatch && !JS_KEYWORDS.has(idMatch[1])) {
          names.add(idMatch[1]);
        }
      }
    }
  }
  return Array.from(names);
}

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function obfuscateJs(code, reservedNames) {
  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: true,
    reservedNames: reservedNames.map((n) => `^${n}$`),
    selfDefending: false,
    debugProtection: false,
    disableConsoleOutput: false,
    target: 'browser',
  });
  return result.getObfuscatedCode();
}

function processPage(page) {
  const srcPath = path.join(SRC_DIR, page.dir, 'index.html');
  let html = fs.readFileSync(srcPath, 'utf8');

  const reservedNames = collectReservedNames(html);

  // Root page lives at docs/index.html (one level above docs/assets/), so
  // "./assets/..." is correct there. Every subpage (e.g. docs/portal/) is
  // one level DEEPER than docs/assets/, so it needs "../assets/...".
  const depth = page.dir ? page.dir.split('/').filter(Boolean).length : 0;
  const assetsPrefix = depth === 0 ? './assets/' : '../'.repeat(depth) + 'assets/';

  // 1. Extract & minify inline <style>...</style> blocks
  const styleRe = /<style>([\s\S]*?)<\/style>/g;
  let styleIdx = 0;
  const styleReplacements = [];
  html = html.replace(styleRe, (match, css) => {
    styleIdx++;
    const minified = new CleanCSS({ level: 2 }).minify(css).styles;
    const hash = hashOf(minified);
    const fname = `${page.name}-style${styleIdx > 1 ? styleIdx : ''}-${hash}.css`;
    styleReplacements.push({ fname, content: minified });
    return `<link rel="stylesheet" href="${assetsPrefix}${fname}">`;
  });

  // 2. Extract & obfuscate inline <script>...</script> blocks (leaves CDN
  //    <script src="..."> tags completely untouched)
  const scriptRe = /<script>([\s\S]*?)<\/script>/g;
  let scriptIdx = 0;
  const scriptReplacements = [];
  html = html.replace(scriptRe, (match, js) => {
    scriptIdx++;
    const obfuscated = obfuscateJs(js, reservedNames);
    const hash = hashOf(obfuscated);
    const fname = `${page.name}-script${scriptIdx > 1 ? scriptIdx : ''}-${hash}.js`;
    scriptReplacements.push({ fname, content: obfuscated });
    return `<script src="${assetsPrefix}${fname}"></script>`;
  });

  // 3. Strip HTML comments from the shell itself
  html = stripHtmlComments(html);

  const outHtmlDir = path.join(OUT_DIR, page.dir);
  fs.mkdirSync(outHtmlDir, { recursive: true });
  fs.writeFileSync(path.join(outHtmlDir, 'index.html'), html, 'utf8');

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const { fname, content } of [...styleReplacements, ...scriptReplacements]) {
    fs.writeFileSync(path.join(ASSETS_DIR, fname), content, 'utf8');
  }

  console.log(
    `✔ ${page.name}: ${styleReplacements.length} style file(s), ` +
    `${scriptReplacements.length} script file(s), ${reservedNames.length} reserved name(s)`
  );
}

function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  for (const page of PAGES) {
    processPage(page);
  }
  for (const f of PASSTHROUGH_FILES) {
    const src = path.join(SRC_DIR, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(OUT_DIR, f));
    }
  }
  console.log('\nBuild complete →', OUT_DIR);
}

main();
