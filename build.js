// Build pipeline for fhmic/home
//
// Edit your real pages in src/. Run `npm run build` before every commit/push.
// This produces docs/ — a concealed, minified, hashed-filename version of the
// site that GitHub Pages actually serves (set Pages source to "main /docs").
//
// Why not bundle with type="module" like fm-portal? These pages use inline
// onclick="fn()" style HTML attributes that call GLOBAL functions. Module
// scripts don't leak top-level declarations to the global scope, which would
// silently break every onclick handler. So JS/CSS here are extracted and
// minified but kept as classic (non-module) scripts, preserving the exact
// same execution order and global scope as the original inline blocks.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify } = require('terser');
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

function hashOf(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

async function processPage(page) {
  const srcPath = path.join(SRC_DIR, page.dir, 'index.html');
  let html = fs.readFileSync(srcPath, 'utf8');

  // Root page (page.dir === '') lives at docs/index.html, one level above
  // docs/assets/, so "./assets/..." is correct. Every subpage (e.g.
  // docs/portal/index.html) is one level DEEPER than docs/assets/, so it
  // needs "../assets/...". This computes that automatically regardless of
  // how deeply nested a page ever gets.
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

  // 2. Extract & minify inline <script>...</script> blocks (leaves CDN
  //    <script src="..."> tags completely untouched)
  const scriptRe = /<script>([\s\S]*?)<\/script>/g;
  let scriptIdx = 0;
  const scriptReplacements = [];
  const scriptTasks = [];
  html = html.replace(scriptRe, (match, js) => {
    scriptIdx++;
    const placeholder = `__SCRIPT_PLACEHOLDER_${scriptIdx}__`;
    scriptTasks.push({ placeholder, js, idx: scriptIdx });
    return placeholder;
  });

  for (const task of scriptTasks) {
    const result = await minify(task.js, {
      mangle: { toplevel: false }, // keep global fn names intact for onclick="fn()"
      compress: true,
      format: { comments: false },
    });
    const minified = result.code || '';
    const hash = hashOf(minified);
    const fname = `${page.name}-script${task.idx > 1 ? task.idx : ''}-${hash}.js`;
    scriptReplacements.push({ fname, content: minified });
    html = html.replace(task.placeholder, `<script src="${assetsPrefix}${fname}"></script>`);
  }

  const outHtmlDir = path.join(OUT_DIR, page.dir);
  fs.mkdirSync(outHtmlDir, { recursive: true });
  fs.writeFileSync(path.join(outHtmlDir, 'index.html'), html, 'utf8');

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  for (const { fname, content } of [...styleReplacements, ...scriptReplacements]) {
    fs.writeFileSync(path.join(ASSETS_DIR, fname), content, 'utf8');
  }

  console.log(`✔ ${page.name}: ${styleReplacements.length} style file(s), ${scriptReplacements.length} script file(s)`);
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  for (const page of PAGES) {
    await processPage(page);
  }
  for (const f of PASSTHROUGH_FILES) {
    const src = path.join(SRC_DIR, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(OUT_DIR, f));
    }
  }
  console.log('\nBuild complete →', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
