# Claude No-Code Netlify Webapp Workflow

A Vue 3 + TypeScript + Vite template for building progressive web apps (PWAs), deployed on Netlify (production and preview). Designed for use with Claude Code — no coding experience required.

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
   - Ask you to describe the app in your own words — one paragraph, no form to fill in
   - Show you what it understood and let you correct it
   - Suggest a name for your project and walk you through the one-minute GitHub step
     (Claude gives you every value to fill in — you just click and paste the link back)
   - Set up the scaffold in your new project
   - Auto-fill all your project details
   - Connect Netlify, so you get a link you can open on your phone to see the app
3. **Describe your app** — what should it look like? what features should it have?
4. **Iterate** — Claude changes the code, you look at the preview link and say what to fix

**Prerequisites:**
- GitHub account (free at https://github.com)
- Netlify account (free at https://netlify.com — sign in with GitHub)
- Claude Code with GitHub authorization enabled

## What You Get

- ✅ **PWA** — works offline, feels like an installed app
- ✅ **Mobile-friendly** — responsive, touch-optimized
- ✅ **Hot reload** in dev — instant feedback on changes
- ✅ **Service-worker caching** — smart reload/update affordances
- ✅ **Help modal** — document your app's features
- ✅ **Debug panel** — on-device logging (mobile-friendly)
- ✅ **Netlify** — production site and a live preview on every branch/PR, one host

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

Claude Code asks you one open question: **describe the app you want, in your own words.** Write a
paragraph the way you'd explain it to a friend — what it's for, who'd use it, what they should be
able to do. There's no form and nothing technical to fill in.

For example, this is a complete answer:

> A simple grocery list manager. Users can add, remove and edit items, optionally tag them with a
> category like produce or frozen, and note which stores they prefer to buy each item from. They
> should be able to start a shopping session for the whole list or for one store, which shows the
> items grouped by category. Duplicate items shouldn't be added — if someone tries, suggest editing
> the existing one instead.

From that, Claude works out what to build, proposes a structure, and shows you what it understood so
you can correct it before anything is created. It fills the details into `CLAUDE.md` and the docs
itself — **no manual editing required.**

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
3. **Describe your app in a paragraph** — your own words, no form to fill in
4. **Check Claude's summary** — confirm it understood, or correct it
5. **Approve the suggested project name** (or ask for a different one)
6. **Create your project on GitHub** — Claude gives you every value to fill in
7. **Claude Code sets everything up** — scaffold, your project details, and Netlify
8. **Open your preview link** — confirm the page loads on your phone before building features
9. **Start changing things** — describe what you want, review the preview, repeat

---

Built for non-technical users who want to build web apps with AI assistance. Questions? Check the docs or ask Claude Code.
