---
name: add-github-pages
description: Add a GitHub Pages production mirror, independent of Netlify. Use when the user asks to deploy without depending on Netlify, wants a backup in case Netlify goes down, asks about GitHub Pages by name, or asks what happens if they leave/lose Netlify. Not part of default setup — only act on explicit request.
---

# Add a GitHub Pages mirror

The project deploys entirely through Netlify by default — production and PR previews, one host.
This skill adds a **second, independent copy of the production site** on GitHub Pages, for someone
who specifically wants hosting that doesn't depend on their Netlify account.

## Say the trade-off before doing anything

This is a one-way piece of information the user needs before they decide, not after:

> This gives you a backup production copy on GitHub Pages, so your site stays up even if Netlify
> has an outage or you ever move off it. What it doesn't give you: PR preview links on that copy —
> GitHub Pages publishes one static site per repo, with no equivalent of Netlify's per-branch
> Deploy Preview. You'd keep using Netlify's previews to review changes either way; this is a
> backup for the live site, not a replacement for the review workflow. Want me to set it up?

Only proceed on a clear yes.

## This is a normal change — use `ship-feature`

Branch protection means there's no other way in: a direct push to `main` is rejected. Treat this
exactly like shipping any other feature — branch, build, push, PR, doc gate, hand over the links —
with these two file changes as the content:

**1. Add `.github/workflows/deploy-pages.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_BUILD_ID: ${{ github.sha }}
          VITE_BASE: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

**2. In `vite.config.ts`, read the base path from that env var** — Netlify and local dev leave it
unset and fall back to `/`, so neither is affected by this change:

```ts
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  // ...rest of the config unchanged
})
```

Verify `npm run build` still passes with `VITE_BASE` unset before pushing — this is the same build
Netlify and CI use, and it must stay unaffected.

The PR's doc gate should update `docs/system-design.md`'s Deploys section to mention the mirror —
that's an architecture change, which the gate already asks about for any branch.

## After merge: the one manual step

There's no API for this — the user has to click it themselves. Give it as a normal guided step:

> One last thing, on GitHub: go to **Settings → Pages**, and under **Source** choose **GitHub
> Actions** — not "Deploy from a branch", which would publish the raw source files instead of the
> built app.

Gate on confirmation, same as any guided step. Once done, the site goes live at
`https://<owner>.github.io/<repo-name>/`, updating a couple of minutes after every future merge —
alongside Netlify, not instead of it.
