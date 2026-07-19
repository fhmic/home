# fhmic/home (private — source repo)

This is the private source repo. It is never deployed directly.

- **`src/`** — real, editable HTML/CSS/JS. Edit here.
- **`build.js`** — extracts inline `<style>`/`<script>` from each page in
  `src/`, minifies them (CSS via clean-css, JS via Terser — top-level names
  kept intact so `onclick="fn()"` handlers keep working), hashes the
  filenames, and writes the result to `docs/` (git-ignored, regenerated
  every build — never commit it here).
- **`.github/workflows/deploy.yml`** — on every push to `main`, this builds
  `src/` and pushes the resulting `docs/` output to the public
  `fhmic/home-site` repo, which is what GitHub Pages actually serves.

## One-time setup

1. Create the public repo `fhmic/home-site`, enable Pages on it
   (Settings → Pages → source: `main` / `/(root)`).
2. Create a fine-grained GitHub personal access token scoped only to
   `fhmic/home-site`, with **Contents: Read and write**.
3. Add it as a repo secret here: Settings → Secrets and variables →
   Actions → New repository secret → name `DEPLOY_TOKEN`.

## Day to day

Just edit files under `src/` (web UI or local) and push/commit to `main`.
The workflow builds and deploys automatically — nothing else to run.

To preview a build locally before pushing:
```
npm install
npm run build   # outputs to docs/ (git-ignored)
```
