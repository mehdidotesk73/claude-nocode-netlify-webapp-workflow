---
name: update-template
description: Make a change to this template repo itself — a skill, the bootstrap, the scaffold's source, or the docs. Use for any edit to the template: branch, verify the scaffold still builds, run the doc gate, open a PR. Only applies in the template repo (claude-nocode-netlify-webapp-workflow); a project scaffolded from it uses ship-feature instead.
---

# Change the template

This repo isn't an app — it's what other projects are made from. A change here reaches **every
future scaffold**, and every existing project the next time someone runs `update-skills`. That
blast radius is the reason for the branch and the PR, and it's worth saying to yourself before a
change that feels too small to bother.

## 1. Branch

`main` requires a pull request; direct pushes are rejected.

```
git checkout main && git pull --ff-only origin main
git checkout -b claude/<short-name>
```

Name it for what it does. **Verify the base**: `git log --oneline origin/main..HEAD` empty.

## 2. Make the change, then prove the scaffold still works

`npm run build` passing in *this* repo is necessary and not sufficient. The thing that matters is
whether the template still produces a project that builds, and the only way to know is to do what
the bootstrap does:

```
git archive HEAD | tar -x -C <scratch>/scaffold-test
cd <scratch>/scaffold-test && npm install && npm run build
```

Run that for any change touching `src/`, `package.json`, config, or `.gitattributes`. It catches
two things a local build can't: a file that stopped being committed, and a file that's now
`export-ignore`d when something needs it.

**If you added a template-only file**, confirm it did *not* land: `ls <scratch>/scaffold-test`.
And if it's a template-only **skill**, `export-ignore` alone isn't enough — see the note in
`.gitattributes` about `update-skills` copying from a clone.

## 3. Where the documentation goes

The template has different surfaces from a project, and the split matters more here than anywhere
else because one of them is inherited by strangers:

- **`template-memory/`** — how and why the template is built this way, what was tried and dropped,
  work parked for later. **Does not ship.** Most template work belongs here.
- **`docs/experience.md`** — ships to every project as *their* experience file. Only put something
  here if it would make sense to someone who has the scaffolded project and has never seen this
  repo: stack gotchas, reusable patterns. Not template-development history.
- **The skills themselves** — if behaviour changed, the skill that describes it is the
  documentation; there's no separate doc to update.
- **`CLAUDE.md`** — the bootstrap and the conventions a scaffolded project inherits. Remember it
  gets stripped at setup: check whether your change lands in the part that survives.
- **`README.md`** — how someone starts using the template.

## 4. Doc gate

Same discipline as `ship-feature`: before finalising the PR, pose an `AskUserQuestion` with
`multiSelect: true` over the surfaces above, **with your recommendation already worked out** —
recommended ones first, labelled **(Recommended)**, and each description naming the specific thing
in this branch that triggers it rather than the generic rule. Say plainly which surfaces you're
clearing. Don't recommend everything defensively; on a template change it's often
`template-memory/` and nothing else.

## 5. PR

Open into `main` with what/why/testing. **Do not merge** — the user merges.

Two things a template PR does *not* have, and saying so prevents a confused hand-off: **no Netlify
preview and no live site.** There is nothing to open on a phone. The PR page and the diff are the
whole review surface, so don't hand over links that don't exist.

## 6. After the merge

If the change touched `.claude/skills/`, existing projects don't have it yet — they pick it up when
someone runs `update-skills` there. Say so, rather than leaving the impression the fix is live
everywhere.

## Reverts

`main` is protected and force-push is rejected. Undo with a revert commit via a normal PR (revert a
merge with `-m 1`). To reinstate something reverted, "revert the revert" on a fresh branch — a plain
re-merge won't work, since Git sees it as already merged.
