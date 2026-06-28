# TODO — CapMax enterprise upgrade (Treasury design + new navigation)

## Phase 1: Treasury chrome + navigation
- [x] Update `capmax/index.html` topbar to include:
  - [x] Back to Portal button
  - [x] Home button
  - [x] Sign out button
  - [x] Keep existing permission guard + token logic
- [ ] Replace existing sidebar navigation with the 9-item menu:
  - [ ] Dashboard
  - [ ] Portfolio
  - [ ] Markets
  - [ ] Analytics
  - [ ] Research
  - [ ] Reports
  - [ ] Advisor
  - [ ] Alerts
  - [ ] Settings
- [ ] Add view router mapping these 9 items to `view-*` containers.

## Phase 2: Feature distribution (scaffold + reuse)
- [ ] Dashboard view:
  - [ ] Macro Dashboard section (reuse existing macro content)
  - [ ] High-level KPIs + portfolio overview placeholders
- [ ] Portfolio view:
  - [ ] Portfolio Builder (scaffold)
  - [ ] Buy/Sell Ledger (scaffold)
  - [ ] Automatic Rebalancing controls (hook to existing rebalance logic)
- [ ] Markets view:
  - [ ] NGX Watchlists (scaffold)
  - [ ] Dividend Calendar (scaffold)
- [ ] Analytics view:
  - [ ] Historical Charts (scaffold; Chart.js)
  - [ ] Sector Pie Charts (scaffold; Chart.js)
  - [ ] Risk Analytics (scaffold)
- [ ] Research view:
  - [ ] AI Recommendation Engine (scaffold)
- [ ] Reports view:
  - [ ] Excel Import/Export (scaffold; use xlsx library if available)
- [ ] Advisor view:
  - [ ] Advisor Workspace (scaffold; recommendations + rebalance actions)
- [ ] Alerts view:
  - [ ] Alerts centre (scaffold; watchlist/dividend/risk)
- [ ] Settings view:
  - [ ] Admin Workspace (admin-only UI placeholder)

## Phase 3: QA
- [ ] Verify sign out clears `FM_token` and redirects to `../portal/`
- [ ] Verify Back to Portal always routes to `../portal/`
- [ ] Verify navigation updates active state and shows correct view
- [ ] Verify no console errors due to missing DOM IDs or functions

## Phase 4: Next iterations (not part of this PR unless requested)
- [ ] Wire each scaffold to real backend endpoints when available
- [ ] Add persistent cloud sync for new modules (portfolio builder, ledger, watchlists)

