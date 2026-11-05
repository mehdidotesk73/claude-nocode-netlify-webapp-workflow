---
name: ship-feature
description: Take one change from request to merged — branch, build, PR, hand the user preview/live/merge links, run the pre-merge doc gate. Use whenever the user asks for a change to the app: a new feature, a fix, a tweak to how something looks or behaves.
---

# Ship one change

The user can't run the app locally. Preview links are the only way they see anything, and they merge
every change themselves. Both facts shape every step below.

## 1. Check whether the skills have moved on — once per session

Before the first change of a session, see whether the template's `.claude/skills/` differ from this
project's. Projects are copies, not subscriptions, so a fix made upstream sits there until somebody
pulls it — and the skill you're about to follow may be the one that was fixed.

```
git clone --depth 1 https://github.com/mehdidotesk73/claude-nocode-netlify-webapp-workflow <scratch>/tpl
diff -rq <scratch>/tpl/.claude/skills .claude/skills
```

**Identical → say nothing and go to step 2.** A "skills are up to date" line on every feature is
noise that trains the user to ignore this step. **Do this once per session, not once per feature.**

**Different → say so briefly and let them choose.** Name what changed in behaviour, not filenames,
then gate on an `AskUserQuestion`:

- **"Carry on with this feature, sync afterwards"** — the sensible default; say so.
- **"Sync the skills first"** — hand off to `update-skills`, which opens its own PR.
- **"Skip, and don't ask again this session."**

**Be honest about what syncing does and doesn't do here**, because the obvious assumption is wrong:
**skills are read from the session's project root when the session starts, so anything pulled now
does not apply to this conversation** — including this very skill, mid-run. Picking it up needs a
new conversation **with this project's repo selected**; a fresh chat pointing at another repo reads
nothing new. So syncing first means a second PR to merge *and* a restart before the new behaviour
is live. That's occasionally worth it, and usually not; it is never a
reason to leave a user's feature half-built while they go and merge something else.

So: mention it, let them decide, and don't block on it. The one case worth actively recommending a
sync-first is when the drift is *in the thing they just reported* — a step that rendered badly, a
link that didn't work — because then carrying on reproduces the bug you already know is fixed.

## 2. Branch

Never work on `main` — it's protected, and pushes to it are rejected.

```
git checkout main && git pull --ff-only origin main
git checkout -b claude/<short-feature-name>
```

Name it for what it does: `claude/dark-mode`, `claude/search-bar`. Not auto-generated names.

**Verify the base** — confirm `git log --oneline origin/main..HEAD` is empty and the expected files
are present. A stale or pre-existing branch can fork from an old commit.

## 3. Edit in small commits

Keep changes focused. **Run `npm run build` before every commit** — it type-checks and catches Vue
template errors. CI runs the same build on the PR, but a red check on the user's PR is noise they
have to interpret, so catch it first.

## 4. Consider unit tests — assess first, then ask

**Most changes don't need them, and asking anyway is ceremony.** A copy tweak, a colour, a one-off
layout fix: say nothing and move on. The question is worth raising when the change adds **logic that
later features will sit on top of** — because then a test isn't about today's bug, it's the thing
that tells you months later that a foundation still behaves the way something newer assumes.

Concretely, that's usually pure functions in `src/lib/`: rules, calculations, transforms, state
transitions, parsing, validation. Things with inputs and outputs and no DOM. If the change is all in
a component's template, there's nothing here worth testing at this level.

**If the project has no test runner yet, setting one up is part of this change:**

```
npm install -D vitest
```

`"test": "vitest run"` in `package.json` scripts, and tests as `*.test.ts` beside the code they
cover. Then add **one line to the existing `build` job** in `.github/workflows/ci.yml` — `- run: npm
test` after the build step. **Do not add a separate job.** The branch ruleset requires a check named
`build`; a new job called `test` would run, could fail, and merges would sail past it while the
ruleset waited on a check that never covered it.

### Offer bundles, with your recommendation on each

Don't present a list of function names — the user can't judge those. Group the tests into **two to
four bundles** and describe each by the behaviour it protects. Group by whichever fits the change:
how core it is (foundational rules vs. conveniences), or by area (the list rules, the sharing
rules). Post the assessment as a normal message, then gate on `AskUserQuestion` with
`multiSelect: true`.

Each option needs:

- **A plain-language label** — "the rules for adding items", not `dedupeItems()`.
- **A description saying what breaks if it regresses**, in terms they'd notice: "if this broke,
  duplicates would start appearing in lists and nothing would warn us."
- **(Recommended)** appended where you mean it. **Recommending all of them is fine** when the change
  really is all foundational — this isn't a quota. What matters is that the tag reflects a judgement
  you actually made, not a hedge: if you'd recommend everything on every feature, you've stopped
  giving information.

Say plainly which bundles you're *not* recommending and why — "this one's a convenience wrapper,
it'll get rewritten before it ever regresses" is more useful than leaving it unmarked.

Selecting none is a legitimate answer and doesn't need arguing with. Write exactly the bundles they
pick, run `npm test`, and keep them in the same commit range as the feature so the PR shows the
behaviour and its guard together.

**What unit tests here won't cover:** anything needing a real browser, a real round trip, or two
actors — a multi-step flow across a database, say. That's a different tier with its own trade-offs;
`docs/experience.md` has *Chained-Scenario E2E Tests for Step-Triggered State Machines* if the
project ever justifies it. Don't reach for it by default.

## 5. Push

Conventional, descriptive messages. `git push -u origin claude/<feature>`. Network can be flaky;
retry with backoff.

## 6. Wait for the preview

Each PR gets a Netlify Deploy Preview. This sandbox usually can't reach `netlify.app`, so you can't
open the preview yourself. Watch Netlify's check runs on the PR instead (`pull_request_read` with
`get_check_runs`; they show up next to `build` as *Redirect rules*, *Header rules* and
*Pages changed - <site>*). A green `build` only means CI compiled the code. It doesn't mean the
Netlify build succeeded. Poll in-turn; don't schedule a check-in for a two-minute deploy.

**Work out which build the preview should show.** The footer reads `build <sha>`, and
`vite.config.ts` takes that sha from `COMMIT_REF`, which Netlify sets on every build. For a Deploy
Preview it's the PR's head commit: `git rev-parse --short HEAD` after the push. You'll hand it over
in step 8. It's how the user tells "this is the change" from "this is a cached old bundle" without
having to judge the UI.

**Service-worker caveat:** this is a PWA, so an old bundle can keep serving. If a change "doesn't
show", it's almost always the cache — have them tap **Reload latest** in the footer, or open the URL
in a private/incognito tab. If the footer still shows an older sha after that, the deploy hasn't
finished.

## 7. Doc gate, then PR

**Before opening or finalising the PR**, pose an `AskUserQuestion` with `multiSelect: true` listing
the four doc surfaces, asking which to update now, before merge:

- **`docs/TODO.md`** — move finished items to Done (one-paragraph summary + key function names);
  queue follow-ups
- **`docs/experience.md`** — on merge, a version-history entry (added / removed / defaults / docs).
  On branch abandonment, a "what didn't work" entry with the reason, honestly — including
  "direction felt unideal". This is how dead ends stop being re-walked.
- **`docs/system-design.md`** — if the branch changed architecture, a `lib` module, a feature's
  design, or a convention: update that section *and* the system map
- **`docs/concepts/*.md`** — if a page's UI or behaviour changed, update that page's help doc

### Say which ones you think need it, and why

**Work out the answer before you ask.** The user has no way to judge whether this branch touched
architecture or changed a help page — you're the only one who read the diff. Four neutrally-worded
options are a quiz they can't pass, and the honest response to a quiz is to tick everything or
nothing.

So read your own diff first (`git diff main...HEAD --stat`, plus the changes themselves) and decide
per surface. Then build the question so your recommendation is visible:

- Put the ones you're recommending **first**, and append **(Recommended)** to those labels.
- Make each `description` name **the specific thing in this branch** that triggers it — not the
  generic rule. "The Browse page got a category filter, so its help page now describes the old
  behaviour" tells them something. "If UI changed, update the help doc" does not.
- For the ones you're *not* recommending, say so just as plainly: "Nothing here changed the
  architecture — no update needed." A surface you actively cleared is more useful than one you
  left ambiguous.

**Don't recommend all four out of caution.** If everything is always recommended, the recommendation
carries no information and you've re-created the neutral list with extra words. `TODO.md` and
`experience.md` genuinely do apply to nearly every merge; `system-design.md` and `concepts/*.md`
often genuinely don't. Say that.

Their selection wins over your recommendation — if they drop one you suggested, update what they
picked and move on without re-arguing. Selecting none means "keep working on the branch / skip
docs". Update exactly what's selected, rebuild, then open the PR. **Never declare a branch
merge-ready without running this gate.**

Open the PR into `main` with a what/why/testing summary. Use the GitHub MCP tools (`mcp__github__*`)
— there is no `gh` CLI. Keep PR comments frugal. **Do not merge** — the user merges.

**Subscribe to the PR right after opening it, before handing over links:**
`subscribe_pr_activity(owner, repo, pullNumber)`. Merges, closes, CI results and review comments
then arrive in this session as events. Without the subscription you never hear about the merge or a
red check unless the user thinks to tell you. Don't poll with `sleep` or repeated status checks;
the events wake the session. If the tool isn't available (a local session, say), fall back to
asking them to tell you once it's merged.

## 8. Hand over all three links

They can't merge what they can't find, and may never have seen a PR page. Always include the live
site next to the preview: seeing both is what makes it concrete that their working app is untouched
while they try the change.

> **Preview (the change):** https://deploy-preview-4--<site>.netlify.app
> — open this on your phone and check the new category filter works. The footer at the bottom should
> read **build abc1234**.
>
> **Live site (unchanged):** https://<site>.netlify.app
> — still the old version, and stays that way until you merge. I'll tell you its new build id as soon
> as the merge lands.
>
> **Ready to merge:** https://github.com/<owner>/<repo>/pull/4
> — open that link and click the green **Merge pull request** button, then **Confirm merge**. I'll
> see the merge and check the live site.

**Always name the build the footer should show.** Use the real short sha from step 6, never a
placeholder. If the footer shows something older, tell them to tap **Reload latest** or open the
link in a private tab.

Preview first — they should look before merging. Never say "merge when ready" without the URLs.

**Hand these over in a normal message, never inside an `AskUserQuestion` question.** That field
renders as plain text, so all three links arrive dead — and links they can't tap are the entire
point of this step. If you also want a gate here, post the links first, then make the tool call with
a one-line question.

## 9. After the merge

Merging to `main` triggers Netlify's production deploy of the same site. The subscription from step 7
tells you when the PR changes; react to each event without waiting for the user:

- **Merged** → get the new commit on `main` from the merged PR's `merge_commit_sha`, or by fetching
  `origin/main`. It's a different sha from the preview's, and it doesn't exist until they merge.
  Watch the production deploy, then tell them the live site's footer should now read
  **build <that sha>**. Unsubscribe once that's confirmed.
- **CI failed** → read the log and push a fix before they hit a greyed-out merge button.
- **Closed without merging** → record the abandoned branch in `docs/experience.md` (see Reverts
  below), then unsubscribe.

A matching sha proves which build is running, not that the change behaves correctly. Their look on
the phone is still the check for that.

If they report the merge button greyed out, read the reason off the PR page before changing any
settings — usually a merge conflict, a failing `build` check, or an approval requirement that
shouldn't be on (`finish-setup` sets **Required approvals: 0** for exactly this reason).

## Reverts

`main` is protected and force-push is rejected. To undo something on `main`, add a revert commit via
a normal PR (revert the merge commit with `-m 1`). To re-introduce a reverted feature, "revert the
revert" on a fresh branch — a plain re-merge won't work, since Git sees it as already merged.

Abandoning a branch → record it in `docs/experience.md`.
