# Claude No-Code Netlify Webapp Workflow

A Vue 3 + TypeScript + Vite template for building progressive web apps (PWAs) that deploy to GitHub Pages (production) and Netlify (preview). Designed for use with Claude Code — no coding experience required.

## Quick Start

1. **Clone this repo** to start your project
2. **Read [SETUP.md](./SETUP.md)** — step-by-step guide to connect GitHub and Netlify
3. **Customize [CLAUDE.md](./CLAUDE.md)** — fill in project details at the top
4. **Use Claude Code** — open this repo in Claude Code and describe what you want to build
5. **Iterate** — Claude handles code changes, you review via Netlify preview links

## What You Get

- ✅ **PWA** — works offline, feels like an installed app
- ✅ **Mobile-friendly** — responsive, touch-optimized
- ✅ **Hot reload** in dev — instant feedback on changes
- ✅ **Service-worker caching** — smart reload/update affordances
- ✅ **Help modal** — document your app's features
- ✅ **Debug panel** — on-device logging (mobile-friendly)
- ✅ **GitHub Pages** — free production hosting
- ✅ **Netlify preview** — live preview on every branch/PR

## Project Structure

```
src/
  App.vue              Header/footer shell + app content slot
  main.ts, pwa.ts      Bootstrap, PWA updates
  debug.ts             Mobile-friendly logging
  components/
    HelpModal.vue      In-app help/documentation
  api/, lib/           Ready for your code
docs/
  CLAUDE.md            Workflow + conventions (customize this)
  TODO.md              Project backlog
  experience.md        What you learned
  system-design.md     Technical architecture (see §2 for wrapper template)
  concepts/overview.md User-facing help docs
```

## Customize for Your Project

Before starting, fill in these placeholders in `CLAUDE.md`:

- `<REF:purpose>` — What does your app do?
- `<REF:UI-shape>` — How is it organized? (tabs, pages, etc.)
- `<REF:Netlify-app-name>` — Your Netlify site name (no spaces/underscores)
- `<REF:external-deps>` — Any external APIs or data sources?

## Development Workflow

See **[CLAUDE.md](./CLAUDE.md)** for the full workflow, but in short:

1. Create a branch: `git checkout -b claude/feature-name`
2. Edit files, test locally: `npm run dev`
3. Build before commit: `npm run build`
4. Push: `git push -u origin claude/feature-name`
5. Open PR on GitHub
6. Preview on Netlify (automatic)
7. Iterate based on feedback
8. Merge when ready (user does this)

## Local Development

```bash
npm install
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Type-check + bundle
npm run preview       # Test production build locally
```

## Common Tasks

**Add a dependency?** Ask Claude Code: "Add package X" and let it handle npm install + imports.

**Change something?** Describe it in Claude Code with screenshots. Claude will update the code and preview it for you on Netlify.

**Debug on device?** Check the footer's debug panel (expand via the build timestamp button).

**Cache issues?** Tap "Reload latest" in the footer or open in a private/incognito tab.

## Architecture Highlights

- **Header/footer wrapper** (see `docs/system-design.md` §2) — includes build info, update affordance, Help modal, and debug panel
- **Pure functions in `src/lib/`** — compute logic lives here, components stay thin
- **PWA service worker** — handles caching, updates, and offline capability
- **Mobile-first CSS** — responsive, tappable controls (no hover-only UX)

## Next Steps

1. Read [SETUP.md](./SETUP.md) to connect GitHub and Netlify
2. Customize [CLAUDE.md](./CLAUDE.md) with your project details
3. Open this repo in Claude Code and start describing your app
4. Watch Netlify preview URLs update as Claude iterates the code

---

Built for non-technical users who want to build web apps with AI assistance. Questions? Check the docs or ask Claude Code.
