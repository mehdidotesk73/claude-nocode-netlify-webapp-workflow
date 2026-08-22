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

### Absolute Asset Paths Break GitHub Pages

GitHub Pages serves from `https://<owner>.github.io/<repo-name>/`, not the domain root. Any asset URL written with a leading slash (`/logo-192.png`, `/manifest.json`) resolves to the domain root and 404s in production — while working perfectly on Netlify and in local dev, so it's easy to miss. Use `./favicon.svg` in `index.html`, relative `src` values in the PWA manifest icons, or import assets so Vite rewrites them. The Pages workflow passes `VITE_BASE=/<repo-name>/`, which `vite.config.ts` reads as Vite's `base`; Netlify and dev leave it unset and fall back to `/`.

### Don't Hand-Write a Static `public/manifest.json`

`vite-plugin-pwa` generates `manifest.webmanifest` and injects its own `<link rel="manifest">`. A second static `public/manifest.json` linked from `index.html` produces two competing manifest links in the built HTML, and the static one wins in some browsers — pointing at icons the build never processed. Define the manifest once, in the `VitePWA({ manifest: ... })` block.

### Netlify's "No repositories found" on a Freshly Created Repo

Netlify installs as a GitHub App with a repository-access grant, and that grant is fixed at authorization time. A repo created afterwards isn't in it, so Netlify's import screen shows "No repositories found" — with the search box holding exactly the name you typed and nothing beneath it. It reads like the repo was never created, or was created somewhere else.

The fix is on that same screen: **Configure Netlify on GitHub** → **Repository access** → either **All repositories**, or add the new one under "Only select repositories" → **Save**.

This is guaranteed to hit anyone whose project is created during setup, which for this template is everyone.

**Warning about it isn't the fix — reordering is.** Grant the access first, as its own step (`https://github.com/apps/netlify` → Repository access → All repositories → Save), and then start the import. The empty list never appears.

The subtle part is why a warning alone was never going to be enough. The import flow's "authorize Netlify when it asks" step is where GitHub offers All repositories vs Only select repositories — but that screen only appears if Netlify *isn't already installed*. A returning user with an older, narrower grant is never asked, has nothing to answer, and lands on the empty list regardless of how carefully they read the instructions. Asking which button they saw — **Install** or **Configure** — distinguishes the two cases cheaply.

The Configure case needs one extra guardrail. The user arrives at a screen listing repositories that feed **existing, working Netlify sites**, to do something unrelated to those sites. If they treat "Select repositories" as choosing rather than adding, and de-select what's there, they silently break deploys for another project. Adding is additive, and the instructions have to say so *before* the click — a correction afterwards is a correction to damage already done.

Second-order lesson: when a setup step spans two websites, split it into parts and gate each one on the user confirming, rather than pasting the whole sequence. Someone bouncing between github.com and netlify.com loses their place in a seven-step list.

### Move Out of the Old Repo Rather Than Remembering to Avoid It

Claude Code always opens pointing at a repository — whatever the user last had open — and the template's first instruction was "ignore it". That works only as long as it keeps being remembered, across a setup that spans repo creation, scaffolding, a build, two external websites and a first feature. It failed exactly that way once: a session read the template, understood the plan, and started copying the scaffold into the unrelated repo it happened to be sitting in, because a system-level branch instruction for *that* repo was also in play.

Stronger warnings bought reliability but not a guarantee — a standing prohibition is only as good as the model's attention at every subsequent step. Cloning the new repo and moving into it converts the rule into a fact about where the session is: there is no longer an easy path to the old files, so a lapse in attention doesn't reach them.

Two details make it hold. Call `register_repo_root` after cloning so the session actually adopts the new directory as the project (and loads its `CLAUDE.md`), and check `git remote -v` before the first write — the cheap assertion that catches the case where the switch silently didn't happen. Also worth doing the scaffold work in a real clone rather than pushing files through the API: it's the only way to run `npm install && npm run build` and confirm the scaffold compiles before it lands in someone's repo.

The general shape: when a safety rule has to hold across many steps, look for a way to make the unsafe thing unreachable instead of repeatedly forbidden.

### Don't Make the User Fill In Your Data Model

The intake originally asked four labelled questions — purpose, UI shape, external data sources, site name — because those are the four values the template needs. That's the developer's schema leaking into the user's first interaction, and this template's whole premise is that its users don't have that vocabulary. "How should the UI be organized?" is not answerable by someone who has never thought about an app in terms of tabs and sections, and "what external data sources does it need?" invites a confused "I don't know?" from someone building an offline list.

In practice people describe an app in one paragraph that already contains all four answers, plus intent the form would have discarded. A real reply — a grocery list manager with categories, per-store tagging, shopping sessions grouped by category, and duplicate detection that suggests editing instead — yields purpose, an obvious two-screen structure, "no external data", and a name, without a single labelled question.

So: ask one open question, parse it, then **show the user what you understood and let them correct it**. The confirmation step is what makes inference safe — being wrong is cheap when it's visible and correctable, and far less costly than making every user translate their idea into your field names before they've seen anything.

The narrower rule this sits under: a question is only worth asking if you can't infer the answer *and* it changes what you'd build. Anything else is better resolved by building the obvious reading and letting them react to it on their phone.

### Netlify Site Names Are a Global Namespace

Every Netlify site lives under `*.netlify.app`, one pool shared across the platform, so plain names like `grocery-assistant` are long gone. Propose a distinguished name (username, initials, an extra word), keep alternates in reserve, and warn the user it may be taken — then a rejection is a ten-second retry instead of a failure.

The subtler failure is **doc rot**: the name is chosen at intake and committed into the scaffold (README URLs, the deploy-preview pattern in the project's `CLAUDE.md`), but isn't tested against reality until Netlify setup several steps later. If it changes there and the docs aren't updated, the project's documentation points at a stranger's live site — a wrong link, not a broken one, so nothing surfaces it. Any value committed before external validation needs a write-back once the real value is known.

### Netlify's Project Name Field Is Blank and Silently Generates a Random Name

Netlify's "Review configuration" page auto-fills the build settings from `netlify.toml` — branch, build command, publish directory all correct — but leaves **Project name** empty. Blank means Netlify invents one: `dreamy-yeot-7cce7c`. It deploys fine, so nothing signals a mistake, but that string becomes the production URL *and* the host in every deploy-preview link from then on.

Two lessons, and the second is the more general one:

**"Leave the settings as they are" is unsafe wording on a page with a blank required field.** The build settings genuinely should be left alone; the field directly above them must be filled. An instruction that covers the page as a whole gets the empty field wrong.

**A value collected during setup has to be traced to where it's used.** The site name is question 4 of the intake, stored as `<REF:Netlify-app-name>` — and it was being collected, written into the docs, and then never handed to the user at the one moment they needed to type it. Worth checking, for each thing the intake asks for, that something downstream actually consumes it; an unused answer is a question that shouldn't have been asked, and here it was worse than unused because the rest of the workflow assumed it had been applied.

Recovery is easy but should happen immediately: **Project configuration → Change project name**.

### GitHub Pages Source Must Be "GitHub Actions"

Under Settings → Pages, the Source dropdown defaults to "Deploy from a branch". That's wrong for this project — it publishes the repo's raw source files, so visitors get the unbuilt `index.html` with a bare `<div id="app">` and no bundle. The project builds itself in `.github/workflows/deploy.yml`, so Source must be **GitHub Actions**. The failure is confusing because the deploy "succeeds" and the URL loads; it's just a blank page.

### Branch Protection: "Require Approvals" Is a Trap for Solo Projects

GitHub does not let anyone approve their own pull request — on your own PR, "Approve" is greyed out and only "Comment" is available. So "Require approvals: 1" on a one-person project is a rule that cannot be satisfied.

How bad that is depends on a second setting. "Do not allow bypassing the above settings" is unchecked by default, which means repo admins are exempt from branch protection entirely — you can still merge (with a red "bypass branch protections" warning) and still push directly to `main`. Check it, and the bypass is gone: with approvals required you're genuinely stuck and have to edit the rule to merge anything.

The combination that works for a solo project is "Require a pull request before merging" + "Do not allow bypassing the above settings", with approvals **off**. That enforces PR-only changes to `main` for everyone including the owner, while imposing no requirement the owner can't meet — opening and merging a PR satisfies the rule on its own.

### `npm ci` Needs a Committed Lockfile

The Pages workflow runs `npm ci`, which fails outright ("can only install packages when your package.json and package-lock.json are in sync") if `package-lock.json` isn't committed. It's tempting to gitignore lockfiles; don't. Commit it whenever dependencies change.

### `declaration: true` in an App's tsconfig

Emitting declarations for an *app* makes `vue-tsc` demand exported names for every type used in a component's public surface — a `defineProps` interface that isn't exported fails with `TS4082: Default export of the module has or is using private name 'Props'`. Declarations matter for libraries, not apps. Dropping `declaration`/`declarationMap` is the fix, not exporting every internal interface.

### Ambient Types for Build-Time Constants

`__BUILD_ID__` and `__BUILD_TIME__` are injected by Vite's `define`, and `virtual:pwa-register` only exists at build time. TypeScript knows about none of them without an `src/env.d.ts` declaring the constants and referencing `vite/client` and `vite-plugin-pwa/client`. Without it the build fails with `TS2304: Cannot find name '__BUILD_ID__'`.

## Version History

(Record major releases here as you merge features. Example format below.)

### v0.1.0 — [Date]
- **Added:** Initial scaffold, header/footer wrapper, Help modal
- **Infrastructure:** GitHub Pages + Netlify preview deploys
- **Docs:** TODO, experience, system-design, concepts scaffold

---

*Tip: When you abandon a branch or realize something didn't work, add a short "What didn't work" entry above so future-you (or a teammate) doesn't re-walk the same dead end.*
