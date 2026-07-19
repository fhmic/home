# fhmic/home

This repo has two parts:

- **`src/`** — the real, editable source. All HTML/CSS/JS lives here in
  plain, readable form. This is what you edit.
- **`docs/`** — generated output. Minified CSS/JS in hashed files under
  `docs/assets/`, referenced from thin HTML shells. This is what GitHub
  Pages actually serves — **never edit files in here directly**, they get
  overwritten on every build.

## Workflow

1. Edit files under `src/`.
2. Run:
   ```
   npm install   # first time only
   npm run build
   ```
3. Commit and push both `src/` and `docs/`.

## GitHub Pages setup (one-time)

Repo Settings → Pages → Source: **Deploy from a branch** → Branch:
**main**, folder: **/docs**.

## Why global functions aren't mangled

Pages here use inline `onclick="fn()"` HTML attributes that call global
functions. The build only extracts/minifies inline `<style>`/`<script>`
blocks into external classic (non-module) files — it does not convert
anything to ES modules or mangle top-level names — so those handlers keep
working exactly as before.
