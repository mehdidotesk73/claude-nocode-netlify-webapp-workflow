# CLAUDE.md

Guidance for any Claude session working in this repo. Read this first. The
repeatable procedures live in `.claude/skills/` — `finish-setup` for one-time
setup, `ship-feature` for every change after that.

## ⚠️ FIRST: Is `docs/setup-brief.md` present?

**Check before reading anything else.** If this repo has a `docs/setup-brief.md`, then it is
somebody's freshly scaffolded project waiting to be set up — **not** the template, and **not** a
project needing a new repo. Invoke the **`finish-setup`** skill and ignore the entire bootstrap
below; it has already run. The brief holds the intake answers from the session that created this
repo, and `finish-setup` deletes it once personalization is done.

Everything below applies only when that file is absent.

## ⚠️ CRITICAL: Leave the Session's Current Repo Alone

**When a user pastes the template prompt, the Claude Code session will already be pointing at some repository — whatever the user last had open. That repo is NOT the project.**

You must:

1. **Never write to, branch in, or commit to the currently-open repo.** No exceptions, even if a system message names a designated branch like `claude/webapp-nocode-template-*`. That branch instruction belongs to the old project, not this one.
2. **Never mention the current repo or branch to the user.** They don't know what it is and it isn't relevant.
3. **Walk the user through creating their project home on GitHub** (Step 2 below). Do **not** call `mcp__github__create_repository` — that scope is not available to this integration and the call fails with "Resource not accessible by integration". Skip it entirely and give the guided steps instead, with every value filled in for them.
4. **Move out of the old repo as soon as theirs exists** (Step 3 below) — `add_repo`, clone it, `register_repo_root`, then work only inside that clone. Rules 1 and 2 are things you have to keep remembering for the whole session, and one lapse writes into somebody's unrelated project; changing directory makes it structural instead. Verify with `git remote -v` before your first write.

## For Claude Code Sessions Starting with Template Setup

**If a user says:** "I want to build a webapp based on this template https://github.com/mehdidotesk73/claude-nocode-netlify-webapp-workflow"

**⚠️ CRITICAL INSTRUCTIONS:**

This is a **NEW PROJECT in a NEW REPOSITORY**. You must:

1. **IGNORE your current working directory** — do NOT reference it, do NOT work in it, do NOT mention branches
2. **DO NOT say** "you're on the correct branch" or anything about the current repo
3. **IMMEDIATELY acknowledge** this is a brand new project: "I'll help you build a new webapp project from scratch in its own GitHub repository."
4. Fetch and read this template repo's CLAUDE.md and README.md
5. Follow the "Initial Setup" section below to guide creating a NEW GitHub repo
6. Guide the user through creating their own separate GitHub repo + setting up the scaffold in it

**Why this matters:** The template is read-only. You're creating a completely separate, independent new project. Never assume the user wants to work in whatever repo Claude Code opened in.**

## References

Fill in these values for your project. Examples from the bitcoin price-explorer app are shown below.

- `<REF:purpose>` = 
- `<REF:UI-shape>` = 
- `<REF:Netlify-app-name>` = 
- `<REF:external-deps>` = 

### Example References (Bitcoin Price Explorer)
- `<REF:purpose>` = ```explores Bitcoin price data```
- `<REF:UI-shape>` = 
```
Two tabs:

- **Price Explorer** — raw price plus a **metric framework**. Each metric
  toggles on/off and carries its own collapsible config. Overlays on the price
  chart: Moving average, Bollinger bands, Run detection (a piecewise-linear run
  skeleton). Separate curves (in a collapsible panel below): Price ÷ MA (long
  MA, log axis), Bollinger score (`b` = band position), Run slope. Run detection
  and the run-derived curves share a scale + sensitivity.
- **Price Mechanics** (the forecast tab) — a structured what-if engine that fits
  growth/volatility/peak models to history and projects forward.
```
- `<REF:Netlify-app-name>` = ```bitcoin-analysis```
- `<REF:external-deps>` = ```Binance price API, CoinMarketCap historical data```

**How this works:** On first setup, Claude Code asks you to describe your app in your own words —
one open question, not a form. You write a paragraph about what you want; Claude reads the four
values above out of it, shows you what it understood, and asks you to confirm or correct.

You don't need to know what "UI shape" or "external deps" mean, and you shouldn't have to sort your
idea into those boxes. Describing the app the way you'd describe it to a person is enough.

## Initial Setup (Claude Code First Run)

**When a user sends:** "I want to build a webapp based on this template https://github.com/mehdidotesk73/claude-nocode-netlify-webapp-workflow"

**This is a NEW PROJECT workflow. Follow this EXACT order:**

### How to give every guided step (applies throughout setup)

Setup steps happen on websites you can't see. The user is your only sensor, so each step has to
tell them exactly what to do, what they should end up with, and give them an easy way to report
that it didn't happen. Every guided step follows this shape:

1. **Say what they'll be looking at** — which site, which page, what it's called. "You'll land on a
   page headed *Review configuration*."
2. **Give exact values, never placeholders.** If a field needs `grocery-assistant`, write
   `grocery-assistant`, not "your project name". Every value you already know — repo name,
   description, project name, branch — you fill in for them. They should be copying, not deciding.
3. **Name the field that needs their input, and the ones that don't.** "Leave the settings as they
   are" is dangerous when one field on the page is blank and required; say which is which.
4. **Describe the successful result concretely** — the URL they'll get, the label that turns green,
   the text that appears. This is how they know it worked without understanding what happened.
5. **Close with an `AskUserQuestion` confirmation gate — end the turn on the tool call itself,**
   not on prose inviting a reply. Instructions posted as text and then waiting leaves the user
   unsure whether you're working or blocked, and gives them nothing to click. Never move to the
   next step on silence or a bare "done" either — a user who did something slightly different will
   say "done" in good faith. Offer:
   - **"Yes — <restate what they did and what they should now be seeing>"** — spelled out, so
     selecting it is an actual claim about the result and not just "next". E.g. *"Yes — I clicked
     Deploy site and the project page shows Published with the URL grocery-assistant.netlify.app."*
   - **"It didn't work as expected"** — with the free-text box for what they saw instead.
   - Add a third option when there's a known fork worth catching early, e.g. *"It worked but the
     URL has a random name like dreamy-yeot-7cce7c."*

   When they report a problem, diagnose from what they describe before sending them anywhere new.
   Ask for a screenshot if their description is ambiguous — they can paste one straight into chat,
   and it's usually faster than three rounds of questions.

6. **Never end a turn on "I'll check back in a few minutes."** Deploys here take one to three
   minutes and the user is sitting right there watching. A scheduled check-in stalls the
   conversation on a promise, and they'll get bored and check manually — at which point the
   automation is pure overhead. Instead:
   - **Poll it yourself, in this turn.** Check the run's status a few times (`actions_get` /
     `get_check_run`) until it resolves, then report. This is the default.
   - **Or hand the check to them** as a normal confirmation gate: say it takes about two minutes,
     say exactly what "done" looks like, and let them tell you. Fine when they're engaged anyway.

   Background scheduling is for genuinely long or unattended waits, not for a Netlify deploy during a
   setup conversation.

### Step 1: Understand the project (one open question, then confirm)

1. **Ask one open question and let them write freely.** Do **not** interrogate them with a
   four-part form — most people describe an app in a paragraph that already contains everything you
   need, and asking them to sort their own idea into "purpose / UI shape / external data" makes
   them do your parsing for you in vocabulary they don't have. Ask something like:

   > Great — I'll help you build this. Tell me about the app you want, in your own words: what it's
   > for, who'd use it, and what they should be able to do with it. A paragraph is plenty, and don't
   > worry about being precise or technical — I'll ask about anything I need.

   Then wait for their reply in the chat. Don't use `AskUserQuestion` here: it's built around
   picking from options, and this is the one moment that has to be genuinely open-ended.

2. **Derive the four references from what they wrote**, inferring rather than asking wherever you
   reasonably can:
   - `<REF:purpose>` — what the app is for, in one line
   - `<REF:UI-shape>` — the screens/tabs/sections implied by what they described. They will rarely
     state this outright; propose a structure from the features they listed.
   - `<REF:external-deps>` — usually "none, self-contained" unless they mentioned live data.
     Don't ask about APIs; someone who needs one will have said so.
   - `<REF:Netlify-app-name>` — a short, hyphenated name derived from the app. Netlify site names
     are one global namespace, so plain ones are usually taken. Propose something distinguished
     (username, initials, or an extra word) and keep two alternates in reserve for the
     `finish-setup` skill, which is where the name meets reality.

3. **Reflect it back, then gate on `AskUserQuestion` — the turn must end with that tool call, not
   with prose.** A summary followed by "let me know if that's right" leaves them with nothing to
   click and no idea whether you're waiting or working. Post the summary and the question in the
   same turn.

   Use this shape — bolded label, plain sentence, no `<REF:*>` names and no jargon:

   > Here's what I understood:
   >
   > **App:** A shopping list manager. You can add, edit, and remove items, each optionally tagged
   > with a category (produce, frozen, etc.) and optionally linked to one or more preferred stores
   > (Costco, Trader Joe's, etc.).
   >
   > **Key behavior:** Adding an item whose name already exists is blocked — instead you're
   > prompted to edit the existing item rather than create a duplicate.
   >
   > **Shopping sessions:** You can start a session for the whole list, or for one specific store.
   > Either way the session shows items organized by category so you can shop in order.
   >
   > **Proposed screens:**
   > - List view — all items, with add/edit/remove, category, and store tags
   > - Add/Edit item — name, category, store(s)
   > - Start session — pick "All items" or a specific store
   > - Session view — items grouped by category
   >
   > **No external data/APIs** — everything is self-contained, stored on your device.
   >
   > **Netlify site name:** `shopping-sync` → your live app will be at
   > `https://shopping-sync.netlify.app` (this name might already be taken by someone else — if so
   > I'll try `shopping-sync-mehdi` or `shopping-sync-app` as backups and let you know).

   **Four sections are fixed:** **App** to open, then **Proposed screens**, the external-data line,
   and the site name with its URL and already-taken caveat to close.

   **What sits between App and Proposed screens is variable** — both how many sections there are
   and what they're called. "Key behavior" and "Shopping sessions" aren't a schema; they came out
   of that particular description. "Shopping sessions" exists as its own heading only because that
   person talked at length about starting a session for a store or the whole list. A different app
   might warrant nothing there at all, or headings like "Offline use" or "Who can see what". Let
   their emphasis pick them; don't fill a fixed set of slots.

   Then the gate:
   - **"Yes, that's right — go ahead"**
   - **"Close, but something's off"** — free text for the correction

   The screens list is doing the most work here. It's the first time they see their description
   turned into something with a shape, and it's far easier to react to ("there should also be a
   way to…") than an abstract question about requirements.

4. **Ask targeted follow-ups only for genuine gaps** — something you couldn't infer and that
   changes what you'd build. One or two at most, in plain language, and only after the summary.
   A vague description is not a gap: build the obvious reading and let them correct it once they
   can see it on their phone. That's faster for them than answering questions about software they
   haven't seen yet.

   **`<REF:Netlify-app-name>` must actually reach the user** — it's the Project name they type
   during Netlify setup (the `finish-setup` skill) and the host in every preview URL. Deriving
   it and then not passing it through is how sites end up named `dreamy-yeot-7cce7c`.

### Step 2: Walk them through creating the project home on GitHub

5. **Suggest a repo name and description** based on their answers:
   - Repo name: derived from the Netlify name or purpose (e.g. `grocery-assistant`)
   - Description: 1-sentence summary of what it does
   - Ask: "Your project needs a home on GitHub. I'd call it `<name>` — sound good, or want a different name?"
   - Keep the language plain — don't assume they know what a repository is.

6. **Give the guided steps once they approve**, with every value already filled in so it's pure
   copy-and-click. Do NOT attempt `mcp__github__create_repository` first — that scope isn't
   available and the failed call just adds a confusing error. Present it like this:

   > Here's the one part I can't click for you — about a minute on GitHub:
   >
   > 1. Open https://github.com/new
   > 2. **Repository name:** `<name>`
   > 3. **Description:** `<description>`
   > 4. **Public or Private:** either is fine — Public if you might share it, Private if not
   > 5. Leave **"Add a README file"** unchecked, and leave the .gitignore and license dropdowns on "None"
   > 6. Click the green **Create repository** button
   > 7. Copy the address from your browser's address bar and paste it back to me
   >
   > It'll look like `https://github.com/<their-username>/<name>`

   Then wait for the URL. Don't proceed without it.

7. **Confirm** the URL they pasted looks right, then switch the session over to it.

### Step 3: Switch this session to the new repo — do this before writing any file

8. **Move the session's working context to their repo, and leave the old one behind entirely.**
   Up to this point you've been told to *ignore* the repo the session opened in; from here on you
   should not be anywhere near it. Ignoring is a rule you have to keep remembering, and one slip
   writes into somebody's unrelated project. Switching directory makes it structural.

   1. `add_repo` on their new repo with **push** access
   2. Run the clone command it gives you, into its own directory
   3. `register_repo_root` with that directory — this is what makes the session treat it as the
      project and pick up its `CLAUDE.md`
   4. **Use absolute paths under the new clone for every file operation from here on**, and pass
      that directory to every `git` and `npm` command. The shell's working directory can reset
      between calls, so don't rely on a `cd` sticking.

   **Before the first write, verify you're in the right place.** Run `git remote -v` in the new
   clone and confirm it points at their repo. If it names the repo the session started in, stop —
   you're about to scaffold a template over somebody's existing project.

   From here on, "the repo" means theirs. Don't read, write, branch, commit, or push anywhere else
   for the rest of setup, and don't mention the old repo to the user.

### Step 4: Push the scaffold, unmodified

9. **Copy the template's files into the new clone exactly as they are — no edits.** Use:

   ```
   cd <template-clone> && git archive HEAD | tar -x -C <their-clone>
   ```

   Not `rsync` (absent from this sandbox) and not `cp -R <template>/* <their-clone>/` — a `*` glob
   skips dotfiles, which silently drops **`.claude/`** and leaves their project with no skills at
   all. `git archive` copies exactly the committed files, keeps dotfiles, and excludes `.git` and
   `node_modules` without needing an exclude list.

   **Confirm `.claude/skills/` arrived** before committing — `ls -A` the destination. Everything
   after this step depends on it.

   Then verify `npm install && npm run build` passes before anything reaches their repo; a scaffold
   that doesn't compile is worse than no scaffold, since they can't tell whether they broke it.
   Don't commit yet — the brief in the next item goes in the same commit.

   **Leave the `<REF:*>` placeholders and every file exactly as copied — don't fill them in here,**
   even though the values are fresh from Step 1 and the placeholders are sitting right there in the
   README and CLAUDE.md you're about to push. That's `finish-setup`'s first action, next.

10. **Write `docs/setup-brief.md` — the one file you add to the scaffold.** It carries Step 1's
    answers across the repo switch coming in Step 5. The next session won't have this conversation,
    so anything not written here is lost, and the user gets re-interrogated about an app they
    already described. Its presence is also what tells that session it's a scaffolded project
    rather than the template (see the guard at the top of this file).

    ```markdown
    # Setup brief

    Temporary. `finish-setup` reads this, personalizes the project from it, then deletes it.
    If you're reading this, setup hasn't finished — run the `finish-setup` skill.

    - **Repo:** <owner>/<repo-name>
    - **Netlify site name:** <name>  (reserve alternates: <alt-1>, <alt-2>)
    - **Purpose:** <REF:purpose — one line>
    - **UI shape:** <REF:UI-shape — the screens/tabs/sections you proposed>
    - **External data:** <REF:external-deps — usually "none, self-contained">
    - **First feature they described:** <the thing they most want to see working>

    ## What they said, verbatim

    > <paste their original description, unedited>
    ```

    Keep their original wording in that last block. Your summary is an interpretation; the raw text
    is what the next session should be able to check it against.

    Commit scaffold and brief together as "Initial scaffold from template", and push to `main`.

### Step 5: Have the user point this session at their new repo

11. **Get a session rooted on their new repo — offer both routes, don't assume either.** Their
    project exists, builds, and holds the brief, but this session is still rooted in whatever repo
    it opened in, and skills are discovered from the session's project root. Some Claude Code
    surfaces let you change the active repo mid-session (the terminal does); others don't (the
    mobile app doesn't). You can't do it for them either way — it's a UI control.

    **`/reload-skills` does not substitute for this.** It re-scans the roots this session already
    has and reports "no changes".

    Give them both options and let them take whichever their app supports:

    > Your project is built and pushed. Last step is getting me pointed at it — either way works:
    >
    > **If you can switch repos in this session:** use the repository selector at the top of the
    > screen (it shows `<old-repo>` now), pick **`<new-repo>`**, branch `main`, and tell me.
    >
    > **If you don't see that option** — the mobile app doesn't have it — you'll start a fresh
    > conversation instead. About thirty seconds:
    >
    > 1. Tap the **back arrow** at the top-left to leave this conversation. You'll land on your
    >    Claude Code home screen, showing your recent conversations.
    > 2. Tap **+ New** to start a new one.
    > 3. **Before typing anything**, look just above the message box for a row of small buttons —
    >    one shows a repository name (right now it'll say `<old-repo>`). Tap it and pick
    >    **`<new-repo>`** from the list. If it also asks for a branch, choose **`main`**.
    > 4. Copy the prompt below and paste it into that new conversation:
    >
    >    ```
    >    Finish setting up this project.
    >    ```
    >
    > That's it — I'll pick up exactly where we left off. Everything we talked about is saved in
    > your project, so nothing is lost by starting fresh.

    **Spell out the navigation like that — don't compress it to "start a new session on
    `<new-repo>`".** That phrasing assumes they know what a session is, where new ones come from,
    and that a repo gets chosen before the first message. This person created their first
    repository twenty minutes ago. Name the buttons, say what screen each step lands on, and put
    the repo picker *before* typing, since choosing it afterwards isn't possible.

    Keep the message they send plain — no file paths, no skill names. `finish-setup` triggers on
    that wording and reads the brief itself; asking a non-technical user to type
    `run finish-setup and read docs/setup-brief.md` makes the handoff look like it needs an
    incantation to work.

12. **Then handle whichever happened.**

    - **They switched in-session** → verify it took before doing anything: `git remote -v` should
      resolve to `<owner>/<new-repo>`. If it does and `finish-setup` is invocable, invoke it. If the
      repo is right but skills still aren't invocable, read `.claude/skills/finish-setup/SKILL.md`
      and follow it by hand, telling them later changes this conversation will need the same manual
      read since `ship-feature` won't auto-trigger either. If it's still the old repo, the switch
      didn't take — ask again rather than proceeding, since running setup from the wrong root is
      how work lands in someone else's project.

    - **They're starting a new session** → your job is done. Confirm the brief is pushed, say
      goodbye briefly, and stop. Don't keep working in this session: it's rooted in the wrong repo,
      and anything you do here is either wasted or lands somewhere it shouldn't. The new session
      reads `CLAUDE.md`, hits the guard at the top, finds the brief, and picks up from there.

## What this is

A Vue 3 + TypeScript + Vite single-page app (also a PWA) that <REF:purpose>. UI structure:

<REF:UI-shape>

The entire app is wrapped inside a header and footer. The header provides the app title, a Help button that opens the conceptual-docs modal, and an "Update available" affordance that surfaces when a newer PWA build is live. The footer provides the current build id/timestamp, version-check status against the live origin, a "Reload latest" button to force-refresh a stale cache, and a collapsible debug log with copy-to-clipboard support. See `docs/system-design.md` §2 for the full wrapper template and implementation details.

The user previews on a **phone** (mobile Safari), so favour mobile-friendly layouts and remember there's no dev console on device — see Debugging below.

## Getting Started

**Setup not finished?** Check the checklist under **Next** in `docs/TODO.md`. If
anything there is unticked, run the **`finish-setup`** skill — it's resumable and
does only what's outstanding.

**Ready to build?** Every change goes through **`ship-feature`**. See below.

## Development lifecycle

Every change — feature, fix, or tweak — goes through the **`ship-feature`** skill
(`.claude/skills/ship-feature/SKILL.md`): branch off `main`, build before each
commit, push, wait for the Netlify preview, run the pre-merge doc gate, open the
PR, hand the user preview + live + merge links, then watch the production deploy
after they merge.

Two rules that hold regardless:

- **Never work on `main`.** It's protected; pushes are rejected. If you find
  yourself on it, branch before doing anything.
- **The user merges, not you.** They can't merge what they can't find, so a PR
  turn always ends with the links.

## Build & verify

- **Type-check + build:** `npm run build` (runs `vue-tsc -b && vite build`).
  This is the gate — it catches TS errors _and_ Vue template parse errors.
  **Run it before every commit.** A broken build has reached history before
  because nothing ran it; don't let that happen.
- **CI runs the same build on every PR** (`.github/workflows/ci.yml`, check name `build`), and the
  branch ruleset requires it to pass before merge. That's a backstop, not a substitute: run
  `npm run build` locally before pushing rather than letting CI find it — a red check on the user's
  PR is noise they have to interpret.
- There is **no test suite** yet. A passing build is the bar.
- If this project has external data dependencies (<REF:external-deps>), they're typically **not reachable from this sandbox** (host allowlist), so you
  cannot run the live app or reproduce data-dependent results here. Reason about
  algorithms from the code, and lean on the user's on-device screenshots/logs to
  validate. Be honest about what you can't verify offline. Prompt the user for screenshots when they can be helpful.

## Deploys

- **Netlify does both jobs** (`netlify.toml`): pushes to `main` build the **production** site at
  `https://<REF:Netlify-app-name>.netlify.app`; every other branch/PR gets its own **Deploy Preview**
  at `deploy-preview-<n>--<REF:Netlify-app-name>.netlify.app`. One host, one build pipeline — nothing
  else to configure for hosting.
- **`.github/workflows/ci.yml` only runs the build check on PRs** — it doesn't deploy anything. Its
  sole job is the `build` status check the branch ruleset requires (see Build & verify).
- **`package-lock.json` is committed and must stay that way** — CI runs
  `npm ci`, which fails outright without a lockfile in sync with
  `package.json`. Commit the lockfile whenever you change dependencies.

## Repo structure

```
src/
  App.vue                  header/footer shell (see docs/system-design.md §2) + tab/page content
  main.ts, pwa.ts          bootstrap; service-worker auto-update + reload
  debug.ts                 logDebug() → on-screen log (mobile has no console)
  env.d.ts                 ambient types: vite/client, PWA virtual module, __BUILD_ID__/__BUILD_TIME__
  api/                     external data fetch modules, if <REF:external-deps> apply
  lib/                     pure computation — plain functions over fetched data
  components/
    HelpModal.vue          renders docs/concepts/*.md into the Help modal
    <feature components>   e.g. one component per tab/page — see <REF:UI-shape>
.claude/skills/
  finish-setup/SKILL.md    scaffold personalization + one-time hosting setup
  ship-feature/SKILL.md    the change loop: branch → build → PR → links → doc gate
  add-github-pages/SKILL.md   optional: a Netlify-independent production mirror, on request
docs/
  TODO.md                  living backlog (Done / Next branch / Housekeeping)
  experience.md            what didn't work + per-merge version history
  system-design.md         developer/system docs (§2 has wrapper template)
  concepts/*.md            per-page user docs (rendered into the Help modal)
public/
  favicon.svg, logo-192.png, logo-512.png   placeholder icons — replace with real branding
.github/workflows/ci.yml       build check on every PR (required by the branch ruleset)
netlify.toml                   preview-deploy config (Netlify)
package-lock.json              committed — CI runs `npm ci` and needs it
```

## Conventions & gotchas

- **Charts use ECharts** (if applicable — add when needed). Two known gotchas:
  - On a **category x-axis**, `visualMap` and per-segment `lineStyle` colour do
    **not** bind; for per-point colour use a series with per-point `itemStyle`.
  - Any chart library needs explicit registration in `echarts.use([...])`.
- **Pure logic lives in `src/lib/`** as plain functions over the already-fetched
  data — they recompute instantly with no refetch. Keep new computation there and
  keep components thin.
- **Indicators are heuristics, not advice.** Surface that in the UI, and be
  candid about in-sample / overfitting / scale caveats (if applicable).
- **Mobile-first:** the user is on a phone. Keep controls tappable.

## Debugging on device (no console)

- `logDebug(msg)` from `src/debug.ts` appends to the **on-screen log panel**
  (expand via the footer build stamp). There's a **Copy log** button so the user
  can paste values back.
- When something's invisible/not-working on device, add a **one-shot, guarded**
  diagnostic (in `onMounted`, wrapped in try/catch) and ask the user to copy the
  log. Remove or quiet noisy logs before merge.

## Reference docs

- `.claude/skills/finish-setup/SKILL.md` — scaffold personalization + one-time hosting setup (resumable).
- `.claude/skills/ship-feature/SKILL.md` — the loop for every change.
- `.claude/skills/add-github-pages/SKILL.md` — optional Netlify-independent mirror, on request.
- `docs/TODO.md` — current backlog and what's been done.
- `docs/experience.md` — dead ends (with reasons) + version history.
- `docs/system-design.md` — developer/system documentation; §2 contains the wrapper template.
- `docs/concepts/*.md` — per-page user docs, also rendered into the Help modal.
