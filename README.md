# Claude No-Code Netlify Webapp Workflow

A Vue 3 + TypeScript + Vite template for building progressive web apps (PWAs) that deploy to GitHub Pages (production) and Netlify (preview). Designed for use with Claude Code — no coding experience required.

## Quick Start

1. **Create a new GitHub repo** for your project (see [SETUP.md](./SETUP.md) for Step 1 instructions)
2. **Copy this exact prompt** and paste it into Claude Code:

```
I want to build a webapp based on this template https://github.com/mehdidotesk73/claude-nocode-netlify-webapp-workflow
```

3. **Claude Code will:**
   - Read the template's CLAUDE.md and README
   - Ask you about your project (purpose, UI structure, external APIs, Netlify site name)
   - Ask for your GitHub repo link (the one you created in step 1)
   - Clone the scaffold into your new repo
   - Auto-fill all the project details
   - Guide you through connecting GitHub + Netlify
4. **Describe your app** — what should it look like? what should it do?
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

1. **Create your GitHub repo** — follow [SETUP.md](./SETUP.md) Step 1 (takes 2 minutes)
2. **Copy the prompt** from the Quick Start section above
3. **Paste into Claude Code** and hit submit
4. **Answer Claude's questions** about your project (purpose, UI layout, external data, site name)
5. **Provide your GitHub repo link** when asked
6. **Claude Code sets everything up** — clones scaffold, fills in details, guides GitHub + Netlify setup
7. **Describe your app** — tell Claude what you want it to look like
8. **Watch it build** — Netlify preview links update as you iterate

---

Built for non-technical users who want to build web apps with AI assistance. Questions? Check the docs or ask Claude Code.
