# Experience — Lessons & History

Record what you learn as you build: patterns that work, ideas that didn't pan out, and a version history of major changes.

## What Didn't Work (Gotchas & Dead Ends)

### Mobile-First Design Constraints

Touch targets need to be at least 44×44px. Avoid hover-only interactions — users on mobile have no hover. Rethink interactions like "expand on hover" as "toggle on tap" or always-expanded. Test regularly on actual mobile devices, not just the browser's responsive mode.

### Service-Worker Caching & Stale Builds

A PWA caches aggressively to work offline. If a user opens your app, then you deploy a new version, the old bundle may keep serving until they:
- Manually tap "Reload latest" (we surface this in the footer)
- Force-refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Open in a private/incognito tab
- Wait for the service worker to auto-update (can take hours)

Always surface a visual "update ready" affordance so users know to reload. See `App.vue` for the implementation.

### ECharts Gotchas (if using charts)

On a **category x-axis**, `visualMap` (color ranges) and per-segment `lineStyle` colors do **not** bind as expected. If you need per-point coloring on a category axis, use a series with per-point `itemStyle` instead. Register new chart types explicitly with `echarts.use([LineChart, ...])` — ECharts doesn't auto-register components.

### Pure Logic vs. Components

Logic lives in `src/lib/` as plain functions over already-fetched arrays. They recompute instantly with no API refetch. Keep components thin — they should mostly render. This separation makes logic testable and reusable without rebuild cycles.

## Version History

(Record major releases here as you merge features. Example format below.)

### v0.1.0 — [Date]
- **Added:** Initial scaffold, header/footer wrapper, Help modal
- **Infrastructure:** GitHub Pages + Netlify preview deploys
- **Docs:** TODO, experience, system-design, concepts scaffold

---

*Tip: When you abandon a branch or realize something didn't work, add a short "What didn't work" entry above so future-you (or a teammate) doesn't re-walk the same dead end.*
