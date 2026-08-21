# Claude No-Code Netlify Webapp Workflow

A Vue 3 + TypeScript + Vite template for building progressive web apps (PWAs) that deploy to GitHub Pages (production) and Netlify (preview). Designed for use with Claude Code — no coding experience required.

## ⚠️ Important: This Creates a NEW Repository

**This template is designed to create a brand-new, separate GitHub repository.** It is NOT meant to be cloned into an existing project.

When you paste the prompt below into Claude Code:
1. You will create a **new, empty GitHub repository** (e.g., `grocery-assistant`, `weather-tracker`, etc.)
2. Claude will clone this template scaffold into your new repo
3. Your webapp will live in its own separate project

**Do NOT try to integrate this template into an existing repo** — Claude Code will guide you through creating a new one.

## Quick Start

1. **Copy this exact prompt** and paste it into Claude Code:

```
I want to build a webapp based on this template https://github.com/mehdidotesk73/claude-nocode-netlify-webapp-workflow
```

2. **Claude Code will guide you through everything:**
   - Ask what you want to build (purpose, UI layout, external data, site name)
   - Create a new GitHub repository for you (with your authorization)
   - Clone the scaffold into that repo
   - Auto-fill all your project details
   - Optionally set up Netlify for preview deploys
3. **Describe your app** — what should it look like? what features should it have?
4. **Iterate** — Claude handles code changes, you review via Netlify preview links

**Prerequisites:**
- GitHub account (free at https://github.com)
- Claude Code with GitHub authorization enabled

2. **Claude Code will guide you through everything:**
   - Ask what you want to build (purpose, UI layout, external data, site name)
   - Suggest a GitHub repo name based on your project
   - Guide you through creating that repo ([SETUP.md](./SETUP.md) Step 1)
   - Clone the scaffold into your new repo
   - Auto-fill all your project details
   - Optionally set up Netlify for preview deploys
3. **Describe your app** — what should it look like? what features should it have?
4. **Iterate** — Claude handles code changes, you review via Netlify preview links

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

## How Claude Code Customizes This Template

When you first open this in Claude Code, it will ask you questions about your project:

- **Purpose** — What does your app do?
- **UI structure** — How is it organized? (tabs, pages, sections, etc.)
- **External data** — Does it fetch from any APIs or data sources?
- **Netlify site name** — What should your preview/production sites be called?

Claude Code automatically fills these details into `CLAUDE.md` and all the docs. **No manual editing required** — just answer in plain language.

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

1. **Copy the prompt** from the Quick Start section above
2. **Paste into Claude Code** and hit submit
3. **Answer Claude's questions** about your project (what it does, how it's organized, external data, site name)
4. **Approve the suggested GitHub repo name** (or suggest changes)
5. **Create the GitHub repo** — Claude will guide you through it (5 minutes, uses [SETUP.md](./SETUP.md) Step 1)
6. **Provide the repo link** when Claude asks
7. **Claude Code sets everything up** — clones scaffold, fills in details, optionally sets up Netlify
8. **Describe your app** — tell Claude what you want it to look like
9. **Watch it build** — Netlify preview links update as you iterate

---

Built for non-technical users who want to build web apps with AI assistance. Questions? Check the docs or ask Claude Code.
