---
name: finish-setup
description: Finish setting up a newly created project — personalize it (README, CLAUDE.md, docs), connect Netlify for preview and production hosting, and protect the main branch. Use whenever the user asks to finish, continue, or complete setting up this project, or says setup was left unfinished. Also use on any repo containing docs/setup-brief.md, which means a project was scaffolded but never personalized; that file holds the answers from the session that created it, so read it first rather than asking again.
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

**Read `docs/setup-brief.md` first — it holds everything you need.** The session that created this
repo wrote it: repo name, Netlify site name (plus reserve alternates), purpose, UI shape, external
deps, their first feature, and their original description verbatim. **Don't re-ask the user for any
of it** — they described their app already, in a conversation this session can't see, and being
asked twice is the clearest possible signal that nothing was carried over.

If the brief is missing but `CLAUDE.md` still has `<REF:` placeholders, something went wrong in the
handoff: say so and ask the user to describe their app, rather than guessing or personalizing with
placeholder text still in place.

**Do this before Netlify or branch protection, not after.** `main` is still unprotected at this
point in setup — this is the last moment a direct commit to `main` is possible, so this step should
be one push, not a branch and PR.

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

- **`docs/setup-brief.md` — delete it.** Its whole job was carrying the intake across the repo
  switch, and that's done. Removing it is also what marks setup as no longer pending: the guard at
  the top of `CLAUDE.md` keys off its presence, and a stripped `CLAUDE.md` plus an absent brief are
  two independent reasons a later session won't try to re-bootstrap this project.

Verify `npm run build` passes, commit (e.g. "Personalize scaffold for `<project name>`"), and push
directly to `main`.

**Then trigger the CI workflow once, and don't wait for it.** Run `.github/workflows/ci.yml` via
its `workflow_dispatch` trigger (`actions_run_trigger`, or the **Actions → CI → Run workflow**
button). Fire it and move straight on to Netlify — it finishes in about a minute, long before
branch protection needs it.

Two reasons this is worth doing here rather than later:

- **It makes `build` selectable instead of typeable.** GitHub's ruleset check-picker only lists
  checks it has actually seen run. Without this, step 2 has the user hand-typing a check name on a
  phone that autocapitalizes — the single worst failure mode in this whole setup (see step 2). One
  run now turns that into picking an item off a list.
- **It proves CI works before anything depends on it.** The local `npm run build` above and the CI
  run are different tests: CI does a clean `npm ci` against the committed lockfile on a fresh
  runner. If the lockfile is out of sync, this is where it surfaces — while it's still a simple
  fix, rather than as a mysteriously stuck first PR.

If the run fails, fix it before continuing; a red `build` becomes a required check shortly.

## Show them where they are

Setup is a handful of steps across two websites, and from the user's side it's easy to lose track
of how much is left. **Open with the whole list, then re-post it with the current step marked each
time you move on.** Keep it to one compact block:

> **Setup progress**
> ✅ Netlify account
> ✅ Give Netlify access to your project
> ▶️ **Import the project** ← you're here
> ⬜ Protect your live site
> ⬜ First feature

Cheap to render, and it answers the two questions someone silently has partway through a multi-step
process: how much more of this is there, and is it nearly done. Mirror `docs/TODO.md`'s setup
checklist so the two never disagree — tick items there as you tick them here.

## How to give every step

These steps happen on websites you can't see. The user is your only sensor.

**Know more than you say.** This skill documents every trap because *you* need them; the user needs
the click. A step with a warning bolted onto every line is harder to follow than the task itself,
and it reads as though the whole thing is fragile. Aim for five short numbered lines someone can
follow on a phone while looking at another tab. Keep a caveat inline only when acting on the
obvious-looking thing would take them somewhere wrong — otherwise hold it and use it if they report
trouble.

1. **Say what they'll be looking at** — which site, which page, what it's headed.
2. **Give exact values, never placeholders.** If a field needs `grocery-assistant`, write
   `grocery-assistant`. They should be copying, not deciding.
3. **Name the field that needs their input, and the ones that don't.** "Leave the settings as they
   are" is wrong when one field on the page is blank and required.
   - **When an exact string matters, say so and say the casing.** They're typing on a phone, and
     mobile keyboards autocapitalize the first letter of a text field — so any identifier you ask
     them to type arrives capitalized unless you flag it. For anything matched literally (check
     names, branch names, project names), write "all lowercase" and have them read back what's in
     the field before they commit it.
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

**Part C — import the project.** Send something close to this, and no longer:

> Now let's bring your project into Netlify:
>
> 1. Click **Add new project**
> 2. **Scroll past the "describe your idea" box** — that one builds a different app from scratch.
>    Further down, under **Bringing your own code?**, click **GitHub**
> 3. Pick **`<repo-name>`** from the list
> 4. On the page that appears, fill in **Project name**: `<site-name>` — all lowercase, and check
>    what's actually in the box, since phones like to capitalize the first letter
> 5. Leave everything else as it is and click **Deploy**
>
> It'll build for a minute or two, then show **Published** and your address:
> `https://<site-name>.netlify.app`

**Everything below is for you, not for them.** Don't recite it — a five-step list with a caveat
attached to each step is harder to follow than the task itself, and this person is on a phone
switching between two websites. Surface a trap when they hit it, not in advance.

- **The "describe your idea" box is the real hazard**, which is why it's the one warning that stays
  inline. Someone told to "import your project" sees a box inviting them to describe what they
  want, and typing their app idea there is the reasonable reading — it builds an unrelated
  Netlify-generated project and spends their agent credits. The page also shows a "Low on credits"
  banner that looks like a problem and isn't.
- **If labels have shifted**, the shape is stable: *start a new project → skip anything offering to
  build it for you → import from GitHub*.
- **Project name is the only blank field.** Blank means Netlify invents `dreamy-yeot-7cce7c`, which
  becomes the production URL *and* every preview URL. Build settings come from `netlify.toml` and
  are already right.
- **If they report a random name anyway:** Netlify → the project → **Project configuration**
  (older accounts: **Site configuration**) → **Change project name** → save. Do it now; the name is
  in every future preview link.
- **If the name is taken**, offer a reserve alternate, make clear it isn't their mistake, move on.
  Usually one retry.
- **If the final name differs from what you scaffolded with**, update the docs and push before
  continuing — the README URLs and `CLAUDE.md`'s deploy-preview pattern still name the old one and
  would point at a stranger's site.
- **Deploy button label** varies: **Deploy `<name>`** or **Deploy site**.

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

Send something close to this, and no longer. **Give the link, not a click-path**, and **give the
ruleset name as a value they copy** — it's a required field with nothing in it, the same shape of
trap as Netlify's blank Project name:

> One more setup step, on GitHub. Open this link — it's your project's rules page:
>
> `https://github.com/<owner>/<repo>/settings/rules`
>
> 1. Click **New ruleset → New branch ruleset** (the green button, top right)
> 2. **Ruleset Name**: `protect main`
> 3. **Enforcement status**: change it from **Disabled** to **Active** — it won't do anything
>    otherwise
> 4. Under **Target branches**, click **Add target → Include default branch**
> 5. Tick **Require a pull request before merging**, then set **Required approvals** to **0**
> 6. Tick **Require status checks to pass**, click **Add checks**, type `build`, and pick **build**
>    from the list that appears — select it, don't type it in as new
> 7. Tick **Block force pushes**, then click **Create** at the bottom
>
> You should land back on the rules page with **protect main** listed and **Active** beside it.

If the link 404s or they can't reach it, the click-path is **your repo on GitHub → Settings → Rules
→ Rulesets**.

**Everything below is for you, not for them.** Same rule as Part C — surface a trap when they hit
it, not in advance.

- **Enforcement status is the silent failure.** It defaults to *Disabled*, so a ruleset can be
  fully and correctly configured and enforce nothing at all. This is why the gate's "yes" option
  must restate **Active**, not just "created".
- **Bypass list: empty** — leaving it untouched is what applies the rule to repo admins, including
  **you**. After this your own pushes to `main` are rejected. That's the point: it makes "always
  work on a branch" enforced rather than remembered. Don't mention it unless they ask why a push
  failed.
- **Required approvals: 0** matters because they can't approve their own PRs — any higher number
  locks them out of their own repo permanently.
- Leave **Require branches to be up to date** off. It forces a merge-and-rerun of CI on every PR
  whenever `main` moves, which is friction with no benefit at this scale.
- The **ruleset name is free-form** — `protect main` is given only so the field isn't blank. Any
  value works; nothing matches on it.

The `build` check comes from `.github/workflows/ci.yml`, which builds every PR. Requiring it stops a
non-compiling change reaching `main` — worth more here than usual, since the user can't run the app
locally to notice.

**Adding the `build` check: have them pick it from the list, never type it.** Because step 0
triggered a CI run, `build` is already a check GitHub has seen, so searching the **Add checks**
box surfaces it as a selectable result. Tell them to select the existing entry.

**Do not let them hand-type the name.** They're on a phone, iOS capitalizes the first letter of a
text field, and check names match literally — a rule requiring `Build` waits forever on a check
that reports as `build`. With the bypass list empty, that makes every PR they ever open
unmergeable, on a ruleset that looks perfectly configured. It's the same lockout **Required
approvals: 0** exists to prevent, reached by a different route. Selecting a listed entry avoids
the whole class of problem, which is exactly why step 0 runs CI early.

If `build` isn't listed anyway:
- The step-0 CI run didn't happen or failed — check the **Actions** tab. Re-run it (**CI → Run
  workflow**), then search again.
- If they must type it, say **"all lowercase"** explicitly and have them read back what's in the
  field before clicking Add. GitHub offers it as **+ Add build · Any source**.
- If a real PR has since run and `build` still doesn't appear, the job name differs from what this
  skill assumes — read the actual name off that PR's checks and use it.
- **Already saved the wrong one?** Open the ruleset, delete the bad entry from **Status checks
  that are required**, add `build`, Save.

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

**Gate on the enforcement state, not on "created."** The `AskUserQuestion` options here should be:

- **"Yes — the rules page lists `protect main` as Active"**
- **"It's listed, but it says Disabled"** — send them back in to flip Enforcement status; this is
  the common miss and it looks like success
- **"It didn't work as expected"**

## Done

Confirm both TODO items are ticked, then hand off:

> Your project is all set, and you've got a live link. Now tell me what your app should look like —
> describe it, show me a screenshot, or tell me what you want people to be able to do.

**The first feature goes on a branch like every feature after it** — use the `ship-feature` skill.
Setup is over; don't commit to `main` just because setup happened to leave you there. The first
feature is where the loop gets established, so make it visible: say you're working on a branch, hand
over the preview URL when it's green, let them try it, then give them the merge link.
