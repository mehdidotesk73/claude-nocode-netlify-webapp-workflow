---
name: finish-setup
description: Personalize a freshly scaffolded project (README, CLAUDE.md, docs), connect Netlify, and protect the main branch — the one-time setup that gives the user a project that reads as their own, a preview link, a live production site, and a pull-request workflow. Use right after a project is scaffolded from the template, or any time setup was left unfinished (check the setup checklist in docs/TODO.md).
---

# Finish setting up the project

Three things, in this order. Each is required — skipping any one silently leaves something broken
or missing for the user:

| Step | Gives them | If skipped |
|---|---|---|
| Personalize the scaffold | A project that reads as theirs, not the template | Raw template docs forever; an unstripped `CLAUDE.md` tells a future session to bootstrap a second repo |
| Netlify | A preview link on every change, AND their real production site — one host does both | They can't see changes before they're live, and have no live site at all |
| Branch protection | Changes arrive as pull requests | No preview links at all — work lands straight on the live site |

**Resuming?** Check the setup checklist under **Next** in `docs/TODO.md` and do only what's still
unticked. Tick each item off as it completes, so an interrupted session can pick up cleanly. If
`docs/TODO.md` doesn't have a setup checklist yet, personalization (below) hasn't run — start there.

## 0. Personalize the scaffold

**Do this before Netlify or branch protection, not after.** `main` is still unprotected at this
point in setup — this is the last moment a direct commit to `main` is possible, so this step should
be one push, not a branch and PR. Use the purpose, UI shape, site name, and external-deps answers
already established earlier in this conversation; don't re-ask for them.

- **`README.md` — rewrite completely.** Drop everything about using the template (the quick-start
  prompt, "what you get", template customization). Write the project's own README instead: app name
  as the title, a short description from the purpose answer, the UI shape, "Built with Vue 3 +
  TypeScript + Vite (PWA)", local dev commands (`npm install` / `npm run dev` / `npm run build`),
  the live and preview URLs once known, and links to `docs/`. This is the file a visitor to the repo
  sees first — it should describe their app, not this template.

- **`CLAUDE.md` — delete the bootstrap, fill in the rest.** Keep the title and one-line intro at the
  very top. Remove everything from "⚠️ CRITICAL: Leave the Session's Current Repo Alone" through the
  end of "Step 5: Reload skills, then hand off to `finish-setup`", plus the References fill-in
  instructions and the Bitcoin example block. **Keep every remaining `##` section** — as of this
  writing: "What this is" (with every `<REF:*>` value substituted inline — no placeholders left
  anywhere), Getting Started, Development lifecycle, Build & verify, Deploys, Repo structure,
  Conventions & gotchas, Debugging on device, Reference docs. If you find a `##` section not in
  that list, keep it: the rule is "delete the named bootstrap range, keep the rest", not "keep only
  what's listed". **This is what stops a future session re-running the bootstrap on an
  already-created project** — an unstripped CLAUDE.md would tell it to go create another repo.

- **`docs/experience.md` — keep only these sections, remove everything else:** Mobile-First Design
  Constraints, Service-Worker Caching & Stale Builds, ECharts Gotchas, Pure Logic vs. Components,
  Don't Hand-Write a Static `public/manifest.json`, `npm ci` Needs a Committed Lockfile,
  `declaration: true` in an App's tsconfig, Ambient Types for Build-Time Constants, and Version
  History (reset to the placeholder format, not the template's own history). The test, if you hit an
  entry not on that list: **does this teach something about building a Vue/Vite PWA, or about
  building the template's setup flow?** Keep the first, drop the second. Most of what's there is the
  second — onboarding flow, Netlify UX, skills design — and has no bearing on a project that will
  never re-run that bootstrap. Shipping it verbatim would hand every project a confusing journal
  about a different piece of software.

- **`docs/TODO.md` — seed the one-time setup checklist** under **Next**:

  ```
  ## Next (Current Sprint)

  - [ ] Connect Netlify (finish-setup) — required; gives previews AND the production site
  - [ ] Protect `main` (finish-setup) — required; makes changes arrive as PRs with previews
  - [ ] First feature: <their first described feature>
  ```

- **`.claude/skills/` — leave untouched.** Already generic; nothing to personalize.

Verify `npm run build` passes, commit (e.g. "Personalize scaffold for `<project name>`"), and push
directly to `main`.

## How to give every step

These steps happen on websites you can't see. The user is your only sensor.

1. **Say what they'll be looking at** — which site, which page, what it's headed.
2. **Give exact values, never placeholders.** If a field needs `grocery-assistant`, write
   `grocery-assistant`. They should be copying, not deciding.
3. **Name the field that needs their input, and the ones that don't.** "Leave the settings as they
   are" is wrong when one field on the page is blank and required.
4. **Describe the successful result concretely** — the URL, the label that turns green, the text
   that appears.
5. **Close with an `AskUserQuestion` gate.** Never advance on silence or a bare "done" — someone who
   did something slightly different will say "done" in good faith. Offer:
   - **"Yes — <restate what they did and what they should now be seeing>"**, spelled out, so
     choosing it is a claim about the result rather than a "next" button
   - **"It didn't work as expected"** with the free-text box
   - A third option when there's a known fork worth catching, e.g. *"It worked but the URL has a
     random name like dreamy-yeot-7cce7c."*

When they report a problem, diagnose from what they describe before sending them anywhere new. Ask
for a screenshot if it's ambiguous — faster than three rounds of questions.

**Never end a turn on "I'll check back in a few minutes."** Deploys here take one to three minutes
and the user is sitting right there. Poll the run yourself in-turn, or hand the check to them as a
gate. Background scheduling is for long or unattended waits.

## 1. Netlify

Don't ask whether they want it — state it as the next task:

> Next we need to connect Netlify — that's what gives you a link to open on your phone so you can
> see the app as we build it. It's a few clicks and takes about two minutes.

Three gated parts. Give one, wait, give the next — a wall of seven steps spanning two websites is
where people lose their place.

**Part A — Netlify account.** Sign up with GitHub. If they already have one, skip to Part B.

**Part B — repository access. Never skip or reorder this.** Send them to
https://github.com/apps/netlify **before** they go looking for the project on Netlify, and ask which
button they see:

- **Install** — first-time connection. Choose **All repositories** and install.
- **Configure** — Netlify is already connected from an earlier project, almost certainly with
  **Only select repositories** and a list that can't include one created minutes ago. This is the
  case that produces an empty import screen, and GitHub gives them no prompt about it. Either
  switch to **All repositories**, or open **Select repositories** and add the new project.
- If they stay selective, say **before they click** that adding is additive and **not to remove the
  project already listed** — that one feeds an existing site, and de-selecting it breaks that site's
  deploys. It's a destructive misstep on a screen they're visiting for an unrelated reason.

Wait for confirmation that Part B saved.

**Part C — import the project.** Now send them to **Add new site → Import an existing project**.

- **Give them the Project name to type** — this is the site name from intake. The "Review
  configuration" page leaves **Project name** blank, and blank means Netlify generates something
  like `dreamy-yeot-7cce7c`, which then appears in the production URL *and* every preview URL. Tell
  them the exact string and the URL it produces; tell them to leave **Build settings** untouched.
- **Expect "name already taken"** — the namespace is global. Offer your reserve alternates, make
  clear it isn't their mistake, move on. Usually one retry.
- **If the final name differs from what you scaffolded with, update the docs and push before
  continuing.** The README's URLs and the deploy-preview pattern in `CLAUDE.md` were committed with
  the original name and would otherwise point at a stranger's live site.
- **Got a random name like `dreamy-yeot-7cce7c` anyway?** The Project name field was left blank.
  Fix it now, not later, since the name appears in every preview link: in Netlify, open the project
  → **Project configuration** (older accounts: **Site configuration**) → **Change project name** →
  enter the intended name → Save. URL becomes `https://<name>.netlify.app`.

**If they still hit "No repositories found"** after Part B, the grant didn't save or was applied to
a different GitHub account than the one owning the project:
1. Click **Configure Netlify on GitHub** on that same screen
2. Check the account name at the top matches the one that owns the project
3. Set **Repository access** to **All repositories** → **Save**
4. Return to Netlify and refresh the page — the list doesn't always update on its own

**If the build itself fails** (not the import — an actual red build), the logs are in Netlify's
dashboard. Usually `npm run build` failing locally will reproduce it faster than reading the log.

**Then confirm they can see it.** Once the first deploy is green, give them the URL and ask them to
open it on their phone and say what they see. Don't move on until they confirm the page loads — a
broken deploy found now costs minutes; found later it's a whole feature built blind.

This same first deploy of `main` is also their **production site** — Netlify serves both from one
project, so there's no separate hosting step. The URL from Part C (`https://<name>.netlify.app`) is
what to hand them going forward as "your live site."

## 2. Protect `main`

This is what makes every change arrive as a pull request, and a pull request is what produces a
Netlify deploy preview. Without it, work goes straight onto `main` with no preview link and nothing
for the user to review — the loop this whole template is built around stops existing, silently.

Use a **branch ruleset** (the green "Add branch ruleset" button), not the classic rule beside it:

- **Enforcement status: Active** — starts at *Disabled*, so a ruleset can be fully configured and
  enforce nothing. Have them confirm it lists as Active.
- **Bypass list: empty** — this is what applies the rule to repo admins, including **you**. After
  this your own pushes to `main` are rejected. That's the point: it makes "always work on a branch"
  enforced rather than remembered.
- Target: **default branch**
- Rules: **Require a pull request before merging** ✅ with **Required approvals: 0** (they can't
  approve their own PRs) · **Require status checks to pass** ✅ with `build` · **Block force
  pushes** ✅. Leave **Require branches to be up to date** off.

The `build` check comes from `.github/workflows/ci.yml`, which builds every PR. Requiring it stops a
non-compiling change reaching `main` — worth more here than usual, since the user can't run the app
locally to notice.

**If their GitHub only offers "Add classic branch protection rule"** (older UI, no ruleset button):
1. Click **Add classic branch protection rule**
2. **Branch name pattern:** `main`
3. Check **Require a pull request before merging**
4. Leave **Require approvals** unchecked
5. Check **Do not allow bypassing the above settings** near the bottom — classic rules exempt repo
   admins by default, and this is what closes that
6. Click **Create**

**If the controls are greyed out or missing entirely**, the repo is private on a free GitHub plan —
branch protection needs a paid plan there. Offer making the repo public (Settings → General →
bottom → Change visibility), or proceed by convention and say plainly that nothing is enforcing it.

## Done

Confirm both TODO items are ticked, then hand off:

> Your project is all set, and you've got a live link. Now tell me what your app should look like —
> describe it, show me a screenshot, or tell me what you want people to be able to do.

**The first feature goes on a branch like every feature after it** — use the `ship-feature` skill.
Setup is over; don't commit to `main` just because setup happened to leave you there. The first
feature is where the loop gets established, so make it visible: say you're working on a branch, hand
over the preview URL when it's green, let them try it, then give them the merge link.
