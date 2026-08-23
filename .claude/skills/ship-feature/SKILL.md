---
name: ship-feature
description: Take one change from request to merged — branch, build, PR, hand the user preview/live/merge links, run the pre-merge doc gate. Use whenever the user asks for a change to the app: a new feature, a fix, a tweak to how something looks or behaves.
---

# Ship one change

The user can't run the app locally. Preview links are the only way they see anything, and they merge
every change themselves. Both facts shape every step below.

## 1. Branch

Never work on `main` — it's protected, and pushes to it are rejected.

```
git checkout main && git pull --ff-only origin main
git checkout -b claude/<short-feature-name>
```

Name it for what it does: `claude/dark-mode`, `claude/search-bar`. Not auto-generated names.

**Verify the base** — confirm `git log --oneline origin/main..HEAD` is empty and the expected files
are present. A stale or pre-existing branch can fork from an old commit.

## 2. Edit in small commits

Keep changes focused. **Run `npm run build` before every commit** — it type-checks and catches Vue
template errors. CI runs the same build on the PR, but a red check on the user's PR is noise they
have to interpret, so catch it first.

## 3. Push

Conventional, descriptive messages. `git push -u origin claude/<feature>`. Network can be flaky;
retry with backoff.

## 4. Wait for the preview

Each PR gets a Netlify Deploy Preview. The footer shows the live `build <sha>` — confirm it matches
the commit you pushed. Poll it in-turn; don't schedule a check-in for a two-minute deploy.

**Service-worker caveat:** this is a PWA, so an old bundle can keep serving. If a change "doesn't
show", it's almost always the cache — have them tap **Reload latest** in the footer, or open the URL
in a private/incognito tab.

## 5. Doc gate, then PR

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

## 6. Hand over all three links

They can't merge what they can't find, and may never have seen a PR page. Always include the live
site next to the preview: seeing both is what makes it concrete that their working app is untouched
while they try the change.

> **Preview (the change):** https://deploy-preview-4--<site>.netlify.app
> — open this on your phone and check the new category filter works.
>
> **Live site (unchanged):** https://<site>.netlify.app
> — still the old version, and stays that way until you merge.
>
> **Ready to merge:** https://github.com/<owner>/<repo>/pull/4
> — open that link and click the green **Merge pull request** button, then **Confirm merge**. Tell
> me once it's merged and I'll verify the live site.

Preview first — they should look before merging. Never say "merge when ready" without the URLs.

## 7. After the merge

Merging to `main` triggers Netlify's production deploy of the same site. Watch it and confirm the
live URL now shows the change.

If they report the merge button greyed out, read the reason off the PR page before changing any
settings — usually a merge conflict, a failing `build` check, or an approval requirement that
shouldn't be on (`finish-setup` sets **Required approvals: 0** for exactly this reason).

## Reverts

`main` is protected and force-push is rejected. To undo something on `main`, add a revert commit via
a normal PR (revert the merge commit with `-m 1`). To re-introduce a reverted feature, "revert the
revert" on a fresh branch — a plain re-merge won't work, since Git sees it as already merged.

Abandoning a branch → record it in `docs/experience.md`.
