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

### Don't Hand-Write a Static `public/manifest.json`

`vite-plugin-pwa` generates `manifest.webmanifest` and injects its own `<link rel="manifest">`. A second static `public/manifest.json` linked from `index.html` produces two competing manifest links in the built HTML, and the static one wins in some browsers — pointing at icons the build never processed. Define the manifest once, in the `VitePWA({ manifest: ... })` block.

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

### Database Support Is for Live Apps, Not "Stateful" Apps

Recorded as posed. The examples carry the distinction better than any taxonomy built on top of them would:

> I think the database support is for live apps not stateful apps. Depends on what defines a state. But there can be an app that accesses a database to create some sort of coherencey between different running instances of the app. Another form of state is an app that links to a resource and loads into app states for example an accounting app that sets up connection to a text file on web or a csv local file that it has read and write access to, and allow reading the state, modifying the state and saving the state. The latter is a lower level of statefulness. And another level is like a flappy bird app game that does not keep highscores or anything. The app runs, you click play, you play the game, when you die your score is displayed and button for play again. No external state at all just an endless loop of internal states.
>
> Different forms of state might need different infrastructure.

### Realtime Statefulness — a Variation With No Stored State

A further form, alongside the ones above: **state that is live between running instances and stored nowhere.** Four players in a game, a shared cursor, a live drawing surface. Separate copies must agree — but the agreement is only about *now*, and a value that's 200ms old is worthless rather than merely stale.

That is not what a database is for, and Supabase serves it with a different primitive. `postgres_changes` (what a shared shopping list uses) is a real row write replicated off the WAL and then fanned out — correct when the data must persist, far too heavy when it must not. **Broadcast** is plain pub/sub over the same WebSocket and never touches Postgres.

How the connection actually works, since the obvious guesses are both wrong — instances neither share a socket nor join one that a host opens:

- Every client opens **its own** WebSocket to the Realtime server and subscribes to a **topic name**. The server relays between whoever named the same string. It's rendezvous by string, like a chat room name.
- **Nobody creates or owns a channel.** The first subscriber doesn't set it up; the last to leave doesn't tear it down. If the app needs an authoritative host, that's an election the app runs — the transport has no such concept.
- **One socket per client, multiplexed.** Several `.channel()` calls share it.
- **Nothing is stored, and there is no replay.** A message sent before you subscribed is gone, so a late joiner arrives blind and must be handed a snapshot explicitly.
- **Traffic always goes to the region and back.** Two devices on the same wifi still round-trip to Supabase. That's the latency floor; WebRTC is the only way under it.
- The **channel name is the entire access control** on a public channel — so a random room code, for the same reason list ids are random.
- **Presence** rides the same channel and gives the roster (join/leave) without building it.

### Netlify Doesn't Rebuild When You Change an Environment Variable

The database worked on branch previews, then didn't, and a fresh rebuild fixed it with no code change and no config change. The variables had been set on all scopes from the start, so the configuration screen gave no hint anything was wrong.

The root cause was never pinned down, and it's recorded here as an open case rather than a solved one. The leading candidate is build-time staleness: **Vite inlines `VITE_*` into the bundle at build time**, and **Netlify does not trigger a deploy when an environment variable is edited** — so a build can predate its own configuration and serve `undefined` while the dashboard shows everything set correctly. That fits "a rebuild fixed it" without any code change. The service worker serving a stale bundle fits too, and the two aren't exclusive.

The useful part isn't the diagnosis. It's that **a rebuild is cheap and rules out a whole class of cause**, so it's worth trying early rather than after reading the code. And that when a value is compiled in rather than read at runtime, every configuration screen can look correct while the served artifact disagrees — the tell is the deploy's timestamp, not the value.

Worth noting the graceful `supabase = url && key ? createClient(...) : null` guard makes this harder to see. It's the right pattern — it keeps the required `build` check green in CI, where no variables are set — but it converts the failure into a feature that silently does nothing. Pairing it with `logDebug('Supabase not configured — sharing disabled', 'warn')` is what would have turned "sharing is broken" into a log line naming the cause, which is also how we'd know which candidate above was right.

### `using (true)` Is Not "Anyone With the Link"

A Supabase walkthrough that otherwise went well described its RLS policies as making rows "readable/writable by anyone with a list's id — that's what link-only sharing means at the database level," and compared it to a Google Docs anyone-with-the-link share. The SQL was `create policy ... for all using (true)`, and that claim is wrong in a way worth keeping.

`using (true)` grants the anon role **the entire table**. The client can `select *` and enumerate every row; it never has to know an id. Both values needed to do it — project URL and publishable key — are readable in the shipped JavaScript bundle, because that is what those values are for. The unguessable `gen_random_uuid()` stops someone *guessing* a link; it does nothing once they can just list the table. Google Docs actually enforces link-sharing server-side, so the analogy claims a property the database does not have.

It's usually an acceptable trade-off — a shopping list between two people does not need more — and the fix is not always harder SQL. The fix is describing it accurately: *"keeps it away from anyone who wasn't sent the link, and off search engines; not private in a bank-account sense."* Real link-only enforcement needs table access revoked and `security definer` functions taking the id as an argument, which is a bigger piece of work and should be scoped as one.

Same family as the disabled ruleset and the blank Netlify project name: **a setup that looks configured and enforces less than it appears to.** The difference here is that the gap lands in what Claude *tells* the user, not in what they clicked — which makes it harder to catch, since nothing ever fails.

### A Multi-Select Gate Without a Recommendation Is a Quiz the User Can't Pass

The pre-merge doc gate listed its four surfaces neutrally and asked which to update. But the user is non-technical and did not read the diff — they have no basis for judging whether a branch touched "architecture" or made a help page wrong. Asking anyway pushes a decision onto the person least equipped to make it, and the rational responses are to tick everything or tick nothing, neither of which is a judgement.

Claude is the only participant who knows what changed, so the recommendation has to be worked out *before* the question is posed and carried in the options themselves: recommended ones first with **(Recommended)**, and each description naming the specific thing in *this* branch that triggers it. "The Browse page got a category filter, so its help page now describes the old behaviour" is a fact they can accept or reject. "If UI changed, update the help doc" is homework.

**The failure mode to avoid is recommending all four defensively.** If everything is always recommended the recommendation carries no information, and it's the neutral list again with more words. Actively clearing a surface — "nothing here changed the architecture" — is worth as much as flagging one.

Generalizes past this gate: whenever a question is posed to someone who can't see what you can see, the options have to carry your reading of the situation, not just the choices. The user still decides; they just shouldn't have to reconstruct the evidence first.

### A Log Panel Nobody Writes To Is Just an Empty Box

The scaffold shipped the *display* half of on-device debugging — a reactive buffer, a log panel, a **Copy log** button, an error-count dot — and none of the *capture* half. `main.ts` was three lines with no `errorHandler`, no `window.error` listener, no `unhandledrejection` handler. The only entries that ever appeared were ones someone had hand-written a `logDebug()` call for, which means the panel could only report failures that had already been anticipated. The user opens it after a button misbehaves and reads "No log entries yet."

**The case that matters is not the white screen — it's the button that does nothing.** And that one has a specific trap: **Vue catches throws inside event handlers itself.** A handler that throws never reaches `window.onerror`; Vue routes it to `app.config.errorHandler`, and if that's unset the error is logged to a console the phone user cannot open. So the single most common user-visible failure was the one path a naive `window.onerror` would have missed.

Four sources are needed, and each catches something the others don't: `app.config.errorHandler` (handlers, hooks, watchers), patched `console.error`/`warn` (library output, Vue's own warnings), `window.error` **in the capture phase** (plain script errors, plus failed image/script/stylesheet loads, which don't bubble), and `unhandledrejection` (the un-awaited `fetch` in an async handler). Patching the console needs care: bind the native methods *before* patching and have `logDebug` use those, or writing to the panel re-enters the patch and records itself.

Two things that only matter because the user is non-technical: **repeated identical errors collapse to `×N`**, since a handler that throws on every tap would otherwise flush the one useful message out of a 100-entry buffer with copies of itself; and **`copyLog` has an `execCommand` fallback**, because `navigator.clipboard` needs a secure context and this is the only channel from the phone back to Claude — a silent failure there loses the entire bug report.

Verified with Playwright against the built app rather than argued from the code: a throwing handler, a `console.error`, a rejected promise, a 404 image and five repeats all land in the panel, the footer badge turns red with the count, and **Copy log** sits inside the opened window. Worth doing because all four handlers were unverifiable by reading, and the sandbox can drive a real browser.

### Scaffolding by File Copy Means Every Project Is Frozen at Its Creation Date

`git archive` is the right way to lay down the scaffold — it's the fix for `cp -R` dropping dotfiles — but it has a consequence nothing accounted for until a skill was written for it: the new project has **no git relationship to the template**. No remote, no shared history, no `git pull` path. A project created in March runs March's skills forever.

That's fine for `src/`, `docs/` and `CLAUDE.md` — those are meant to diverge; they *are* the project. It's wrong for `.claude/skills/`, which is pure workflow machinery with no project content in it. Every bug found by one person's project (the blank Netlify project name, the `Build` vs `build` lockout, dead URLs in backticks) was fixed only in the template, where no existing project would ever see it.

The `update-skills` skill closes it: shallow-clone the template, diff `.claude/skills/` only, ship the result through `ship-feature`. Three rules that matter more than the mechanics:

**Never delete a local skill that's absent from the template.** Claude may have written a project-specific one. Absence upstream is not a deletion request.

**Scope is the whole safety argument.** Skills are safe to overwrite wholesale *because* they carry nothing project-specific. The moment the same mechanism reaches for `CLAUDE.md`, it's deleting someone's personalization. If a shared-section improvement is wanted, port it by hand.

**Merging doesn't update the session that merged it.** Skills load at session start, so the conversation that pulls the update finishes on the old copy — the same root cause as the `/reload-skills` finding. The hand-off has to say "start a new conversation when you're ready" or "all updated" is a lie the user will act on.

### Mobile Autocapitalization Silently Breaks Exact-Match Identifiers

Told to add a required status check named `build`, a user on iOS typed it into GitHub's search box and got `Build` — the keyboard capitalized the first letter, as mobile keyboards do by default in text fields. GitHub duly offered **+ Add Build · Any source**.

Adding that would have been a full lockout. Check names match literally, so a rule requiring `Build` waits forever on a check reporting as `build`; combined with an empty bypass list, every PR the user ever opened would be unmergeable — on a ruleset that reads as correctly configured, Active, with all the right boxes ticked. Exactly the failure **Required approvals: 0** was chosen to prevent, arriving through a completely different door.

Two things follow:

**This audience types on phones, so any instruction to enter an identifier needs its casing stated.** "Type `build`" is insufficient; "type `build`, all lowercase — your phone will try to capitalize it" is the instruction. Applies to anything matched literally: check names, branch patterns, project names.

**Better still, don't have them type it at all.** Both of the above are mitigations for an input step that turned out to be avoidable — see the entry below on triggering CI early, which makes `build` a listed option the user selects instead of an identifier they transcribe. Casing guidance and readbacks remain as the fallback, but the durable fix was removing the keystroke, not perfecting the instruction around it.

**And where a readback is still needed, it matters more than the instruction.** The user can follow "type `build`" perfectly and still end up with `Build`, because the corruption happens after they act, not during. That's what makes it different from a misread instruction — no amount of clarity in the telling prevents it. The only reliable catch is asking what's actually in the field before they commit, which is the same reason the confirmation gates restate the expected result rather than just asking "done?".

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

### Don't Schedule a Check-In for a Two-Minute Deploy

Waiting on a deploy (this happened with the GitHub Pages build the template used to have) by scheduling a background check-in produced the worst available shape: the turn ended on "I'll check back in a couple of minutes", the conversation stalled, and the user — sitting right there — got bored and checked manually. The deploy had already succeeded. The automation added latency and dead air to something that takes ninety seconds.

Poll it in-turn instead, or hand the check to the user as an ordinary confirmation gate ("takes about two minutes, tell me when the run goes green"). Both beat a promise that parks the conversation. Background scheduling earns its place on long or unattended waits; during an interactive setup the user is a faster and more reliable signal than a timer. Still applies to Netlify's own builds now that they're the only deploy pipeline.

### Netlify Site Names Are a Global Namespace

Every Netlify site lives under `*.netlify.app`, one pool shared across the platform, so plain names like `grocery-assistant` are long gone. Propose a distinguished name (username, initials, an extra word), keep alternates in reserve, and warn the user it may be taken — then a rejection is a ten-second retry instead of a failure.

The subtler failure is **doc rot**: the name is chosen at intake and committed into the scaffold (README URLs, the deploy-preview pattern in the project's `CLAUDE.md`), but isn't tested against reality until Netlify setup several steps later. If it changes there and the docs aren't updated, the project's documentation points at a stranger's live site — a wrong link, not a broken one, so nothing surfaces it. Any value committed before external validation needs a write-back once the real value is known.

### Netlify's Project Name Field Is Blank and Silently Generates a Random Name

Netlify's "Review configuration" page auto-fills the build settings from `netlify.toml` — branch, build command, publish directory all correct — but leaves **Project name** empty. Blank means Netlify invents one: `dreamy-yeot-7cce7c`. It deploys fine, so nothing signals a mistake, but that string becomes the production URL *and* the host in every deploy-preview link from then on.

Two lessons, and the second is the more general one:

**"Leave the settings as they are" is unsafe wording on a page with a blank required field.** The build settings genuinely should be left alone; the field directly above them must be filled. An instruction that covers the page as a whole gets the empty field wrong.

**A value collected during setup has to be traced to where it's used.** The site name is question 4 of the intake, stored as `<REF:Netlify-app-name>` — and it was being collected, written into the docs, and then never handed to the user at the one moment they needed to type it. Worth checking, for each thing the intake asks for, that something downstream actually consumes it; an unused answer is a question that shouldn't have been asked, and here it was worse than unused because the rest of the workflow assumed it had been applied.

Recovery is easy but should happen immediately: **Project configuration → Change project name**.

### A Guided Step Needs a Link and a Value for Every Required Field

The branch-protection step told the user "Go to your repo on GitHub → Settings → Rules → Rulesets" and then listed seven instructions that never supplied a **Ruleset Name** — a field GitHub requires and leaves blank. Two failures in one message, and both had already been fixed once, elsewhere:

**A navigation path is not a link.** Four hops through a settings menu someone has never opened, on a phone, is work the message could have done for them. Deep links exist: `https://github.com/<owner>/<repo>/settings/rules`. Give the URL and keep the click-path as a one-line fallback for when it doesn't resolve.

**Every field the form requires needs a value in the message.** This is the same bug as Netlify's blank Project name, one page later. The instruction covered what to tick and what to leave alone, and simply had nothing to say about the field at the top — so the user stops, mid-step, holding a decision the instructions implied wouldn't come up. If the value genuinely doesn't matter, that's still a reason to supply one (`protect main`) rather than to omit it; "any name works" is a thing to know, not a thing to have to invent.

The general form: **walk the actual form, field by field, and check the message accounts for each one** — including the ones that don't matter. Steps get written from the interesting parts (which rules, which checks) and the boring required field at the top is what gets dropped.

**Follow-up: the link then shipped in backticks and rendered as dead text.** Code formatting suppresses auto-linking, so `https://github.com/.../settings/rules` arrived as a string the user couldn't tap — leaving them to select and copy a long URL on a phone, which is worse than the four-hop click-path the link was supposed to replace. The habit comes from treating every literal the same way; URLs are the exception. Backticks are for values the user **types** (names, branches, check names, where exact characters matter and a link would be wrong). URLs are for **tapping** and go bare in running text. Worth noticing that `ship-feature`'s three hand-off links were already bare and had been working the whole time — the inconsistency is what hid the bug.

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

### `npm ci` Needs a Committed Lockfile

The CI workflow runs `npm ci`, which fails outright ("can only install packages when your package.json and package-lock.json are in sync") if `package-lock.json` isn't committed. It's tempting to gitignore lockfiles; don't. Commit it whenever dependencies change.

### `declaration: true` in an App's tsconfig

Emitting declarations for an *app* makes `vue-tsc` demand exported names for every type used in a component's public surface — a `defineProps` interface that isn't exported fails with `TS4082: Default export of the module has or is using private name 'Props'`. Declarations matter for libraries, not apps. Dropping `declaration`/`declarationMap` is the fix, not exporting every internal interface.

### Ambient Types for Build-Time Constants

`__BUILD_ID__` and `__BUILD_TIME__` are injected by Vite's `define`, and `virtual:pwa-register` only exists at build time. TypeScript knows about none of them without an `src/env.d.ts` declaring the constants and referencing `vite/client` and `vite-plugin-pwa/client`. Without it the build fails with `TS2304: Cannot find name '__BUILD_ID__'`.

## Patterns Worth Reusing

### End-to-End Encryption Over a Database You Don't Trust

For a messaging app, or anything where the rows live in a database but their contents shouldn't be readable by whoever can read the database. The server stores ciphertext and public keys; it never sees plaintext or any private key.

**Key agreement is Diffie–Hellman (ECDH).** Each side has a keypair and publishes only the public half. The trick is that combining *your private key with their public key* produces the same value as combining *their private key with your public key* — so both ends arrive at one shared secret that never crosses the wire. On elliptic curves the combining step is scalar multiplication, not hashing. Hashing comes one step later: run the raw shared secret through HKDF to get the actual symmetric key.

Then AES-GCM with that key, **a fresh random IV per message**. Reusing an IV under the same key breaks GCM badly — it's the one implementation mistake that turns this from real encryption into none.

The browser does all of it natively; no library:

```ts
// once per identity — publish publicKey, keep privateKey off the server
const kp = await crypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'])

// per conversation — both sides compute the identical key
const key = await crypto.subtle.deriveKey(
  { name: 'ECDH', public: theirPublicKey }, myPrivateKey,
  { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])

// per message
const iv = crypto.getRandomValues(new Uint8Array(12))
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))
```

Storage shape: `profiles(id, public_key)` and `messages(id, conversation_id, sender_id, ciphertext, iv, created_at)`. Note the IV is stored alongside and is not secret.

**Key custody, when the user holds it.** Simplest workable version: the user enters a passphrase at the start of a session, and it never leaves memory. Two ways to get from a passphrase to a keypair — wrapping is the one to prefer:

- **Wrap** (recommended): generate a random keypair once, encrypt the private key under a PBKDF2/Argon2-derived AES key, store that wrapped blob in the DB. The passphrase unwraps it. Safe to store because it's useless without the passphrase, and it works on any device.
- **Derive deterministically**: turn the passphrase directly into the private scalar. No blob to store, but importing a raw scalar as a P-256 key via JWK is fiddly and easy to get subtly wrong.

Either way the passphrase is the whole system: **lose it and every past message is permanently unreadable.** There is no reset. Say that to the user in those words before they pick one.

**Be precise about what this protects, and what it doesn't.** Same discipline as not calling `using (true)` "link-only":

- **The server can still MITM you** if it's the one telling you the recipient's public key — it can substitute its own and read everything. Closing that needs an out-of-band fingerprint check, which is what Signal's "safety numbers" are.
- **No forward secrecy** with static keypairs: one compromised private key decrypts every message ever sent. Rotating per message (Double Ratchet) is a much larger build.
- **Metadata stays plaintext.** Who talked to whom, when, and how often are ordinary readable columns. Encryption hides content, not the social graph.
- **Group chat breaks the pairwise model.** Encrypt the message once under a random key, then wrap that key separately for each recipient.

One good side effect: because content is opaque, a permissive RLS policy on the messages table is far less damaging than it would be otherwise. An enumerator gets blobs.

## Version History

(Record major releases here as you merge features. Example format below.)

### v0.1.0 — [Date]
- **Added:** Initial scaffold, header/footer wrapper, Help modal
- **Infrastructure:** Netlify (production + preview deploys), branch-protected `main`
- **Docs:** TODO, experience, system-design, concepts scaffold

---

*Tip: When you abandon a branch or realize something didn't work, add a short "What didn't work" entry above so future-you (or a teammate) doesn't re-walk the same dead end.*
