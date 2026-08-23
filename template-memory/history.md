# Building the template — what we learned

Lessons from developing the template itself: the bootstrap, the setup flow, the scaffold mechanics.
**Not copied into projects** — see `README.md` here for why this is separate from
`docs/experience.md`.

These are moved verbatim from that file, where they had accumulated before there was anywhere else
to put them. Most describe traps in a one-time setup a project never runs again; the live guidance
for each now lives in the relevant skill, and these record why it says what it says.

### Skills Load From the Session's Project Root — a Cloned Directory Never Becomes One

`/reload-skills` was supposed to make a freshly-scaffolded project's `.claude/skills/` invocable mid-session. In testing it returned **"Reloaded skills: 23 skills available (no changes)"** — the base set, unchanged. The scaffold's three skills were on disk and still invisible.

The reason: skills are discovered from the session's *project root*, established when the session opens. The bootstrap clones the user's repo into a new directory and calls `register_repo_root`, but that doesn't make it the root skill discovery uses. `/reload-skills` re-scans the roots the session already has, correctly finds nothing new, and reports exactly that. Confirmed independently from this session: the template's own `.claude/skills/` sits on disk in the same container and does not appear in the available-skills list, because the session is rooted elsewhere.

So the fix isn't a reload — it's getting the session rooted at the new repo, which only the user can do via the repository selector. The design now asks for that, then **verifies** rather than assuming: right repo *and* skill invocable → proceed; right repo but no skills → manual read; still on the old repo → ask again rather than run setup from the wrong root.

**The harder problem this created, and the fix that dissolved it.** Switching repos may re-load the new repo's `CLAUDE.md` — which, on a raw scaffold, opens by declaring "this is a NEW PROJECT in a NEW REPOSITORY, create a new repo." A session that read that could bootstrap a second repo. The obvious remedy was to personalize (and strip `CLAUDE.md`) *before* the switch, which meant hauling all the content-heavy rewrite work back into the bootstrap and making it long again — the exact problem the skills split was meant to solve.

The better answer was a **staged brief**: the bootstrap adds exactly one file, `docs/setup-brief.md`, holding the intake answers plus the user's verbatim description. It does three jobs at once — carries context across the session switch as a durable artifact rather than conversation memory, survives the session dying mid-flow, and acts as a marker that `CLAUDE.md` can key a guard on: *if this file exists, you are a scaffolded project awaiting setup, run `finish-setup` and ignore the bootstrap.* With that guard, a re-read of `CLAUDE.md` after the switch isn't a hazard — it routes correctly. So personalization stays in the skill where it belongs, and the bootstrap stays thin.

`finish-setup` deletes the brief as its last personalization act, so a finished project has both a stripped `CLAUDE.md` and no marker: two independent reasons a later session won't re-bootstrap it.

General shape worth reusing: **when context must cross a boundary a conversation can't span, write it down as a file rather than trying to keep the conversation alive across it.** The file is more durable than the session, and its presence or absence doubles as state.

**And the alternative route needs navigating, not naming.** "Start a new session on `shopping-sync`" packs three unfamiliar concepts into one clause — what a session is, where new ones come from, and that a repository gets chosen before the first message — for someone who created their first repo twenty minutes earlier. The instruction now walks the screens: back arrow → home → **+ New** → find the repo button above the message box → pick the project → *then* type. Ordering matters in a way that's invisible if you already know the tool: the repo has to be selected before the first message, so "start a session and pick your repo" in that order is wrong, not just terse. Same rule as every other guided step here — name the buttons, say what each one lands on, and offer a screenshot fallback.

**One more constraint the first draft got wrong: UI affordances differ across Claude Code surfaces.** The handoff told the user to change the session's active repository — which the terminal supports and the mobile app does not. An instruction that names a control the user cannot find is a dead end, and this template's audience is on phones. The step now offers both routes: switch the repo if your app allows it, or start a fresh session on the new repo and paste a one-line continue message. The staged brief is what makes the second route cost nothing — a new session reads `CLAUDE.md`, hits the guard, finds the brief, and resumes with full context. Worth generalizing: **before telling a user to click something, consider whether their surface has it, and give an alternative when you can't be sure.**

### Claude Can't Run Slash Commands — They're User Input

The bootstrap told Claude to run `/reload-skills` itself, with the explicit note "this is a command *you* run, not something to ask the user to do." That was wrong. Slash commands are Claude Code CLI affordances typed by the user; Claude's toolset has no matching entry. In testing, Claude looked, correctly reported "no explicit `/reload-skills` tool is available in this environment," and fell through to reading `finish-setup` by hand. The user then typed `/reload-skills` themselves and the session picked up normally.

The error came from confirming the command *exists* without asking *who can invoke it*. A previous agent lookup had established it as a real "core CLI slash command" — accurate, and I read that as "available to Claude" when it meant the opposite: core CLI commands are specifically the ones that aren't skills and can't be invoked programmatically.

The fallback is worse than it looks, which is why this matters more than one skipped step: without a successful reload, `ship-feature` never auto-triggers either, so every subsequent change in that conversation needs the same manual file read. One message from the user buys working skills for the whole session.

General rule: **when an instruction says "run X", check that X is something you can actually invoke.** Tools, yes. Slash commands, no — those get asked for.

### Copy the Scaffold With `git archive`, Not `rsync` or `cp -R`

Testing surfaced `rsync: command not found` — it isn't in this sandbox. But the more dangerous alternative is the one that *appears* to work: `cp -R <template>/* <dest>/` uses a shell glob, and globs skip dotfiles. That silently omits **`.claude/`**, so the user's project ends up with no `finish-setup` and no `ship-feature` — setup looks fine and the skills simply never exist.

`git archive HEAD | tar -x -C <dest>` is the right call: exactly the committed files, dotfiles included, `.git` and `node_modules` excluded by construction rather than by an exclude list you have to remember. Worth an `ls -A` on the destination to confirm `.claude/` landed, since everything downstream depends on it and nothing else would reveal its absence until much later.

### Scaffolding by File Copy Means Every Project Is Frozen at Its Creation Date

`git archive` is the right way to lay down the scaffold — it's the fix for `cp -R` dropping dotfiles — but it has a consequence nothing accounted for until a skill was written for it: the new project has **no git relationship to the template**. No remote, no shared history, no `git pull` path. A project created in March runs March's skills forever.

That's fine for `src/`, `docs/` and `CLAUDE.md` — those are meant to diverge; they *are* the project. It's wrong for `.claude/skills/`, which is pure workflow machinery with no project content in it. Every bug found by one person's project (the blank Netlify project name, the `Build` vs `build` lockout, dead URLs in backticks) was fixed only in the template, where no existing project would ever see it.

The `update-skills` skill closes it: shallow-clone the template, diff `.claude/skills/` only, ship the result through `ship-feature`. Three rules that matter more than the mechanics:

**Never delete a local skill that's absent from the template.** Claude may have written a project-specific one. Absence upstream is not a deletion request.

**Scope is the whole safety argument.** Skills are safe to overwrite wholesale *because* they carry nothing project-specific. The moment the same mechanism reaches for `CLAUDE.md`, it's deleting someone's personalization. If a shared-section improvement is wanted, port it by hand.

**Merging doesn't update the session that merged it.** Skills load at session start, so the conversation that pulls the update finishes on the old copy — the same root cause as the `/reload-skills` finding. The hand-off has to say "start a new conversation when you're ready" or "all updated" is a lie the user will act on.

### The `build` Check Won't Exist Yet When You Configure the Ruleset

GitHub's "Add checks" dropdown only autocompletes checks it has already seen run in that repo. At the point branch protection is configured, the project has never had a PR — the scaffold went straight to `main` — so `ci.yml` (which triggers on `pull_request`) has never fired. The list shows "No checks have been added" and searching finds nothing.

The first fix was to warn about the empty list and have the user type `build` in anyway — rulesets accept a name that hasn't reported yet. That worked, but it left them hand-typing an identifier, which is what produced the autocapitalization lockout above.

**The better fix removes the typing.** `finish-setup` now fires the CI workflow via `workflow_dispatch` immediately after the personalization push, then moves on without waiting. Netlify setup takes several minutes across two websites, so by the time the user reaches the ruleset the run is long finished and `build` is a selectable entry in the picker. Same shape as making `main` unpushable rather than reminding Claude not to push it: eliminate the unsafe action rather than warn about it.

It pays a second dividend. The local `npm run build` and the CI run test different things — CI does a clean `npm ci` against the committed lockfile on a fresh runner. Triggering it here surfaces a lockfile mismatch while it's still a simple fix, instead of as a mysteriously stuck first PR after `build` is already a required check.

The warn-and-type path is kept as the fallback for when the run didn't happen or failed.

**How this was missed is the more useful lesson.** This guidance existed in `SETUP.md` and was dropped when that file was deleted. That deletion was done carefully — every section was classified as duplicate, unique-fold-it-in, or drop — but the scan keyed on the `<details>` fallback blocks, and this one was a plain bolded paragraph in the step's body. Structure-based review misses content that doesn't match the structure you're scanning for. The check that would have caught it: diff the deleted file's *claims* against the surviving text mechanically, rather than re-reading and judging. Running that afterwards over every bolded passage in the old file surfaced this immediately, and confirmed the other 83 were genuinely covered.

### The Most Dangerous Step Is Where the Wrong Action Looks Right

Netlify's import flow now routes through **Add new project** (not "Add new site"), and the page it lands on is dominated by an AI agent box — *"Describe your idea. The agent codes and configures for you"* — with starter prompts and a "Low on credits" banner. The actual import path is below a **"Bringing your own code?"** divider.

A user who has just been told "now import your project" sees a box inviting them to describe what they want. Typing their app idea there is the *reasonable* reading of the instruction, and it produces a completely unrelated Netlify-generated project while burning agent credits. Nothing about it looks like an error.

This is a different failure class from the ones already recorded here. Those were silent-success problems — a disabled ruleset, a blank project-name field, a Pages source setting — where the user does nothing wrong and the system fails quietly. This one is a *plausible wrong turn*: a competing call-to-action sitting directly on the path, more prominent than the correct one, that a careful reader can walk into precisely because they're following instructions. Steps like that need the wrong action named and warned off explicitly, not just the right action described — describing only the right path leaves the user to resolve the ambiguity, and the wrong option is the one with the bigger button.

Second lesson, cheaper: **third-party UI labels drift, so pair the exact labels with the stable shape.** The instructions had said "Add new site → Import an existing project", neither of which exists on that page anymore. Exact labels are still right (rule 2 of the guided-step conventions), but they now carry a fallback describing the invariant — *start a new project → skip anything offering to build it for you → import from GitHub* — so a future label change degrades into mild vagueness instead of a dead end.

### Netlify's "No repositories found" on a Freshly Created Repo

Netlify installs as a GitHub App with a repository-access grant, and that grant is fixed at authorization time. A repo created afterwards isn't in it, so Netlify's import screen shows "No repositories found" — with the search box holding exactly the name you typed and nothing beneath it. It reads like the repo was never created, or was created somewhere else.

The fix is on that same screen: **Configure Netlify on GitHub** → **Repository access** → either **All repositories**, or add the new one under "Only select repositories" → **Save**.

This is guaranteed to hit anyone whose project is created during setup, which for this template is everyone.

**Warning about it isn't the fix — reordering is.** Grant the access first, as its own step (`https://github.com/apps/netlify` → Repository access → All repositories → Save), and then start the import. The empty list never appears.

The subtle part is why a warning alone was never going to be enough. The import flow's "authorize Netlify when it asks" step is where GitHub offers All repositories vs Only select repositories — but that screen only appears if Netlify *isn't already installed*. A returning user with an older, narrower grant is never asked, has nothing to answer, and lands on the empty list regardless of how carefully they read the instructions. Asking which button they saw — **Install** or **Configure** — distinguishes the two cases cheaply.

The Configure case needs one extra guardrail. The user arrives at a screen listing repositories that feed **existing, working Netlify sites**, to do something unrelated to those sites. If they treat "Select repositories" as choosing rather than adding, and de-select what's there, they silently break deploys for another project. Adding is additive, and the instructions have to say so *before* the click — a correction afterwards is a correction to damage already done.

Second-order lesson: when a setup step spans two websites, split it into parts and gate each one on the user confirming, rather than pasting the whole sequence. Someone bouncing between github.com and netlify.com loses their place in a seven-step list.

### Setup Belongs in Skills, Except the Part That Runs Before a Repo Exists

The bootstrap started as one long CLAUDE.md — intake, repo creation, scaffolding, Netlify, Pages, branch protection, first feature — and every session re-read all of it, including sessions where the user just wanted a small change.

The dividing line is **when the project repo starts existing**. Steps that run before it (intake, guiding repo creation, cloning and switching into it, copying the scaffold) have to be plain prose in a CLAUDE.md fetched by URL, because there's no repo to load a skill from. Everything after — Netlify, Pages, branch protection, and the whole change loop — can live in `.claude/skills/`, because copying the scaffold puts those skills in the repo the session has just moved into.

Three things fall out of the split, beyond a shorter CLAUDE.md:

**The project's CLAUDE.md is clean by construction.** The transform step used to surgically delete the setup workflow out of it; now there's nothing to strip except the bootstrap header, and the skills copy across untouched.

**Setup becomes resumable.** `finish-setup` reads the checklist in `docs/TODO.md` and does only what's unticked, so an interrupted session — or one that skipped a step — is one `/finish-setup` away from being caught up. That was previously a bespoke recovery conversation.

**A procedure loaded deliberately is followed better than a section of a long document.** Branch protection and the branch-per-feature rule were both written down and both skipped; they were prose in the middle of a file, competing with everything else in it.

One caveat, corrected twice before landing: skills added to a repo mid-session aren't invocable immediately, because they didn't exist on disk when the session started. The fix is **`/reload-skills`** — a real Claude Code command (added v2.1.152) that re-scans skill directories mid-conversation and makes newly-added `SKILL.md` files invocable, no restart needed. Run it right after the scaffold's first push, then invoke `finish-setup` normally.

That same fact — the skills don't exist on disk until they're written — is also why Step 4 (copy/transform/build/push) can't itself be a skill: there's nothing to invoke until after that step runs, `/reload-skills` included.

**Two wrong turns on the way to this, worth recording so they don't get retaken.** First pass: a plain fallback ("read the file directly if it's not discoverable") — this would have quietly defeated the whole point of moving setup into skills, since without ever re-triggering discovery, `ship-feature` stays unusable as a skill for the rest of that conversation's life, degrading back into "a procedure Claude has to remember to go read." Second pass, after asking an agent whether any reload command existed: it reported none did, citing `/clear`/`/compact`/`/mcp` and the absence of `/reload-skills` from the commands reference page — and that answer was itself wrong. The user caught it with a screenshot of `/reload-skills` sitting right in their own autocomplete menu. A second, more targeted agent query (searching harder, explicitly asked to look past a doc page that might simply be behind the feature) confirmed it's real. Two lessons: a documentation search that comes back negative is evidence the docs don't mention something, not proof the something doesn't exist — and direct product evidence (an actual autocomplete menu) outranks a docs fetch that's silent on it.

So the recommendation flipped: **a fresh session is the default path, not a fallback for when discovery fails.** The bootstrap now tells the user, in plain language, to click "+New," pick their project as the repo, and paste a one-line continuation prompt — plus an exact message to send so the new session picks up context without the user having to explain anything. Staying in the current session is still offered as an explicit choice, with a stated cost (`ship-feature` may not auto-trigger later in this conversation) rather than silently degrading.

A related bug this raised: the transform instruction originally said to delete "everything from the top of the file" through the end of the bootstrap, which swallowed the title and intro line along with it — every scaffolded project's CLAUDE.md would have opened straight into "## What this is" with no heading. Fixed to preserve the top two lines and start the deletion at the first bootstrap section instead.

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

### SETUP.md Removed Entirely — a Second File Was Never the Right Fix

The previous entry corrected `finish-setup`'s claim that it "drives from SETUP.md" — untrue, since the skill already carried every operational detail. But leaving SETUP.md in place even as a demoted "human-readable copy" kept the actual problem alive: two files describing one procedure, with no mechanism keeping them in sync besides someone remembering to edit both. That's the exact shape of every drift bug this session hit (Netlify/Pages cross-references, step numbering, twice).

Checked every section against what `finish-setup` already had before deciding: the account/repo-creation walkthroughs, the Netlify Parts A–C, and the full branch-ruleset instructions were verbatim duplicates, already present in `finish-setup` or in the CLAUDE.md bootstrap. Three things were not — the exact click-path fallbacks for a random Netlify name, "No repositories found," and classic branch protection — SETUP.md was their only home. Those got folded into `finish-setup` directly. The "What the Build Loop Looks Like" explainer and the local-dev-commands section added nothing SETUP.md alone provided either: the build-loop mechanics are already explained live, every round, by `ship-feature`'s instructed hand-off messages, and local dev commands are already slated for the project's own README by the bootstrap's transform step. Both were dropped rather than moved.

The file is gone, not shrunk. A "reference copy for humans" sounds harmless, but it's still a second copy — the value of documentation a human might read standalone doesn't outweigh maintaining a duplicate that has already drifted from its skill twice. If a user wants a standalone description of what's happening, the project's own README and `docs/concepts/*.md` are the intended home for that, not a parallel setup script.

### Optional Branch Protection Silently Removed the Whole Review Loop

Branch protection was written as "Step 4 (Optional)" and never appeared in the setup sequence at all, so it got skipped. Setup ended with the session sitting on `main`, and the first feature was committed straight there.

The damage isn't to `main` — it's that **no pull request means no Netlify deploy preview**. The user had no link to open, nothing to try on their phone, and no chance to react before the change was live. The template's entire premise is that its users can't run the app locally and review through preview links instead; skipping this quietly deletes the only feedback channel they have.

So it's required setup now, and it sits *before* the first feature for a reason. With **Require a pull request** + **Do not allow bypassing** (approvals off), the rule applies to repo admins, which includes Claude — pushes to `main` are rejected outright. Same lesson as switching out of the old repo: make the unsafe path unreachable rather than repeatedly forbidden. "Always work on a branch" was already written in the lifecycle and was still not followed, because nothing enforced it and setup had left the session on `main`.

Also worth an explicit handoff at the end of setup: the first feature is the moment the loop gets established, and "setup is over, now follow the lifecycle" is not obvious enough to leave implied.

### Netlify's Project Name Field Is Blank and Silently Generates a Random Name

Netlify's "Review configuration" page auto-fills the build settings from `netlify.toml` — branch, build command, publish directory all correct — but leaves **Project name** empty. Blank means Netlify invents one: `dreamy-yeot-7cce7c`. It deploys fine, so nothing signals a mistake, but that string becomes the production URL *and* the host in every deploy-preview link from then on.

Two lessons, and the second is the more general one:

**"Leave the settings as they are" is unsafe wording on a page with a blank required field.** The build settings genuinely should be left alone; the field directly above them must be filled. An instruction that covers the page as a whole gets the empty field wrong.

**A value collected during setup has to be traced to where it's used.** The site name is question 4 of the intake, stored as `<REF:Netlify-app-name>` — and it was being collected, written into the docs, and then never handed to the user at the one moment they needed to type it. Worth checking, for each thing the intake asks for, that something downstream actually consumes it; an unused answer is a question that shouldn't have been asked, and here it was worse than unused because the rest of the workflow assumed it had been applied.

Recovery is easy but should happen immediately: **Project configuration → Change project name**.

### GitHub Pages Was Dropped — Netlify Was Already Doing the Job

The original design (carried over from the source project this template generalized) was Netlify for previews, GitHub Pages for production — mirroring a setup where Pages predated Netlify's adoption. But connecting a GitHub repo to Netlify makes it deploy `main` as **production** automatically, with zero extra config: that's Netlify's default behavior for whatever branch is marked as the repo's default. So by the time GitHub Pages setup was even reached, Netlify was already serving the exact same content as "production" at its own URL. GitHub Pages wasn't providing anything Netlify didn't; it was a second copy of the same job, on a separate pipeline, that could drift from the first one if either half broke independently — which is exactly what the "Source must be GitHub Actions" and "asset paths must be base-relative" gotchas were: failure modes of the redundant copy, not of the thing users actually needed.

Once spotted, the fix was subtraction from the default path: delete `.github/workflows/deploy.yml`, drop the `VITE_BASE`/`base` logic from `vite.config.ts` (Netlify always serves from root, so there's no sub-path to bake in), remove the Pages step from `finish-setup` and `SETUP.md`, and simplify the three-link PR handoff to point at the Netlify URL for "live site" instead of a `github.io` one. Two asset-path and Pages-source gotchas in this file were deleted outright rather than kept as history, since they described a failure mode of default setup that can no longer occur.

The capability didn't disappear, though — it moved from default to opt-in, and went through two homes before landing. First attempt: bake a fixed "Deploying Independently on GitHub Pages" appendix into every scaffolded project's `README.md`, dormant until the user asked. That was wrong for the same reason CLAUDE.md's setup workflow was wrong before the skills split — the capability could be requested at any point in the project's life, in a session that never happened to read that README section, so its discoverability depended entirely on Claude having recently loaded a file that had no reason to be loaded most of the time. It also could not have stayed passive text anyway: once branch protection is on, Claude cannot push straight to `main`, so *using* this capability was always going to mean a real branch-and-PR change, never a copy-paste.

Landed instead as its own skill, `.claude/skills/add-github-pages`, triggered by its `description` on phrases like "deploy without depending on Netlify" or "GitHub Pages" — discoverable regardless of session history, the same property that made `finish-setup` and `ship-feature` reliable. It states the trade-off (no PR-preview equivalent on the mirror) before touching anything, then runs as a normal `ship-feature` change since the branch ruleset leaves no other path in. Nothing is pre-written into the README or TODO backlog of every project for this — a static hint would have been the exact same dead-weight, do-we-remember-to-update-it problem in miniature.

The general lesson: **before wiring up a second piece of infrastructure, check what the first one already does by default.** Netlify's production-on-`main` behavior wasn't hidden or undocumented, it's just easy not to think to check when you're focused on the piece you're actively setting up (Pages, in this case). One question — "does Netlify already do this?" — would have caught it before any of the Pages-specific tooling was ever written.

### Requiring a Status Check Needs a Check That Actually Runs on PRs

The obvious ruleset to copy from a working project includes **Require status checks to pass** with a `build` check. That only works if a workflow produces that check *on pull requests*. Deploy workflows (production or preview) trigger on pushes to a branch, not on PRs, so a check drawn from one never reports on a PR — requiring it would leave every PR blocked forever on a check that cannot arrive, which is the worst kind of lockout for a user who doesn't know what a status check is.

Hence `.github/workflows/ci.yml`: same `npm ci && npm run build`, triggered on `pull_request`, job named `build` so the check name is `build`.

It earns its place beyond the usual reasons. This template's users can't run the app locally, so a change that doesn't compile would otherwise be discovered as a blank preview page they have no way to diagnose. The check turns that into a red mark on the PR with a log Claude can read.

Two mechanics worth knowing: the check name is the **job** name, not the workflow name; and a check can be added to a ruleset before it has ever run — type the name and GitHub matches it later.

### Branch Rulesets Replaced Classic Protection, and Default to Disabled

GitHub's Settings → Branches page now leads with **Add branch ruleset** and demotes **Add classic branch protection rule** to a secondary link. Instructions written against the classic flow ("Add rule" → "Branch name pattern") no longer match what the user sees.

Rulesets are the better target anyway: the bypass list starts **empty**, so the rule applies to repo admins by default — the thing classic protection gets wrong and needs an easily-missed "Do not allow bypassing the above settings" checkbox to fix.

But rulesets have their own trap: **Enforcement status defaults to Disabled**. A ruleset can be fully configured, listed on the page, and enforcing nothing. That's a silent-success failure — it looks done, and only reveals itself much later when something that should have been blocked isn't. Always have the user confirm the ruleset shows as **Active**.

Also: branch protection on private repos requires a paid plan. If the controls are greyed out, that's why — make the repo public or proceed by convention, but say which.

### Branch Protection: "Require Approvals" Is a Trap for Solo Projects

GitHub does not let anyone approve their own pull request — on your own PR, "Approve" is greyed out and only "Comment" is available. So "Require approvals: 1" on a one-person project is a rule that cannot be satisfied.

How bad that is depends on a second setting. "Do not allow bypassing the above settings" is unchecked by default, which means repo admins are exempt from branch protection entirely — you can still merge (with a red "bypass branch protections" warning) and still push directly to `main`. Check it, and the bypass is gone: with approvals required you're genuinely stuck and have to edit the rule to merge anything.

The combination that works for a solo project is "Require a pull request before merging" + "Do not allow bypassing the above settings", with approvals **off**. That enforces PR-only changes to `main` for everyone including the owner, while imposing no requirement the owner can't meet — opening and merging a PR satisfies the rule on its own.

### The Bootstrap Prompt Has to Name the File to Read

The paste prompt was `I want to build a webapp based on this template <repo url>`. Pasted into a
session open on a *finished* project (`whisper-z`), Claude ran `git status && ls -l`, saw a
complete app, and replied: "there's nothing left to scaffold — what would you like to work on
next?" Then it offered a feature menu for the wrong project.

The `⚠️ CRITICAL: Leave the Session's Current Repo Alone` guard did its job — nothing was scaffolded
into `whisper-z`. What was missing was the other half: **routing the user to the right place after
refusing the wrong one.** A guard that only prevents damage leaves the request unanswered.

The mechanism is worth stating plainly, because the original fix was aimed one step short of it:
**a Claude Code session is always attached to some repository, and a bare URL in a prompt is not an
instruction to read anything.** Claude never fetched the template's `CLAUDE.md`, so none of the
bootstrap — including "walk them through creating a new repo" — ever loaded. It answered from the
only document it had, which was the local project's own stripped `CLAUDE.md`.

Two defences now, because either alone can be bypassed:

- The prompt names the file (`Fetch that repo's CLAUDE.md and follow its setup instructions`) and
  states that the current repo is not the target. This is the one that makes the instructions load.
- A `## If someone asks to start a *different* app here` section in `CLAUDE.md` **inside the range
  that survives stripping**, so a finished project can route the request itself even when the
  prompt is pasted loosely or paraphrased.

General shape: **when you tell a model not to do something, say what to do instead in the same
breath.** Refusal without redirection produces a confidently wrong answer to a question the user
didn't ask — which is harder to notice than the failure being prevented.
