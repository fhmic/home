const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const SRC_DIR = path.join(__dirname, '..', 'home');
const OUT_DIR = path.join(__dirname, 'dist');
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

  // 1. Extract & minify inline <style>...</style> blocks (no-attribute form only)
  const styleRe = /<style>([\s\S]*?)<\/style>/g;
  let styleIdx = 0;
  const styleReplacements = [];
  html = html.replace(styleRe, (match, css) => {
    styleIdx++;
    const minified = new CleanCSS({ level: 2 }).minify(css).styles;
    const hash = hashOf(minified);
    const fname = `${page.name}-style${styleIdx > 1 ? styleIdx : ''}-${hash}.css`;
    styleReplacements.push({ fname, content: minified });
    return `<link rel="stylesheet" href="./assets/${fname}">`;
  });

  // 2. Extract & minify inline <script>...</script> blocks (no-attribute form only,
  //    so CDN <script src="..."> tags are left completely untouched)
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
    // toplevel mangling left OFF (default) so top-level function/var names
    // stay global — required because the HTML uses onclick="fn()" style
    // attributes that call these functions by their global name.
    const result = await minify(task.js, {
      mangle: { toplevel: false },
      compress: true,
      format: { comments: false },
    });
    const minified = result.code || '';
    const hash = hashOf(minified);
    const fname = `${page.name}-script${task.idx > 1 ? task.idx : ''}-${hash}.js`;
    scriptReplacements.push({ fname, content: minified });
    html = html.replace(task.placeholder, `<script src="./assets/${fname}"></script>`);
  }

  // 3. Write output HTML (same relative folder as source)
  const outHtmlDir = path.join(OUT_DIR, page.dir);
  fs.mkdirSync(outHtmlDir, { recursive: true });
  fs.writeFileSync(path.join(outHtmlDir, 'index.html'), html, 'utf8');

  // 4. Write extracted assets
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
