---
name: update-skills
description: Pull the latest workflow skills from the template this project was created from, into this project's .claude/skills/. Use when the user asks to update the skills, get the newest version of the workflow, check whether the template has improved since their project was made, or says something in the setup or shipping process went wrong in a way that sounds already-fixed. Only touches .claude/skills/ — never their app code or docs.
---

# Pull skill updates from the template

Projects are scaffolded from the template with `git archive` — a plain file copy with **no git
relationship to the template**. There is no upstream remote, no `git pull` path, nothing that
notices the template moved on. So a project created in March still runs March's skills forever,
including the bugs that have since been found and fixed by other people's projects hitting them.

This skill is the only thing that closes that gap. It syncs **`.claude/skills/` and nothing else**.

Template: https://github.com/mehdidotesk73/claude-nocode-netlify-webapp-workflow

## What's in scope, and why the rest isn't

**In:** every file under `.claude/skills/`. These are pure workflow machinery — how Claude ships a
change, walks setup, hands over links. They contain no project-specific content, which is exactly
what makes them safe to overwrite wholesale.

**Out:** `CLAUDE.md`, `docs/`, `src/`, `README.md`. The template's copies of these are *generic
starting points*; this project's copies were personalized during setup and then grew with the app.
Copying them over would delete the project. If the template improved something in the shared part
of `CLAUDE.md` (the lifecycle or conventions sections that survive scaffolding) and the user wants
it, port that one change by hand as a normal edit — don't copy the file.

## 1. Fetch and compare

Clone the template shallowly into the scratchpad, never into the project:

```
git clone --depth 1 https://github.com/mehdidotesk73/claude-nocode-netlify-webapp-workflow <scratch>/template
diff -ru .claude/skills <scratch>/template/.claude/skills
```

If the clone fails (proxy or network), fall back to `add_repo` on the template plus
`mcp__github__get_file_contents` for each skill file.

**No differences → say so and stop.** "You're already on the latest version" is a complete,
useful answer. Don't open a PR to change nothing.

Three cases in the diff, and they are not treated alike:

- **File exists in both, template's is newer** → take the template's version.
- **File exists only in the template** → new skill, copy it in.
- **File exists only in this project** → **leave it alone.** Claude may have written a
  project-specific skill for this app. Absence from the template is not a deletion request, and
  this skill never removes a skill.

**`finish-setup` gets synced too**, even though setup is long over here — it's inert without a
`docs/setup-brief.md`, and keeping the directory uniform is simpler than maintaining a list of
exceptions. Same for this skill itself; see the note at the end.

## 2. Tell them what changed, in behaviour

The user is not going to read a diff, and a list of touched filenames tells them nothing. Read the
diff yourself and describe what will be *different* about working with you. Two or three lines:

> The template's picked up a few fixes since your project was made:
>
> - Links I hand you (preview, live site, GitHub) now come through as tappable links instead of
>   plain text
> - The branch-protection step gives you the settings page link directly, instead of asking you to
>   dig through GitHub's menus
>
> Want me to pull those in? It only changes how I work — your app itself is untouched.

If a change has no user-visible effect ("clarified Claude-facing note about X"), fold it into "plus
some internal notes" rather than listing it. Gate on an `AskUserQuestion` before opening the PR;
this is a change to their repo like any other.

## 3. Ship it as a normal change

`main` is protected — a direct push is rejected — so this goes through **`ship-feature`** like
everything else: branch (`claude/update-skills`), commit, push, PR, hand over the links.

Two things differ from a feature, and both need saying up front so the hand-off doesn't look broken:

- **The preview link will look identical to the live site**, because nothing about the app changed.
  Say that when you hand it over, otherwise "I can't see any difference" is the natural report and
  it reads as a failure. There's nothing for them to test here; the PR is just how the change gets
  into the repo.
- **`npm run build` is unaffected** — no source file is touched — but run it anyway before
  committing, since CI will.

The doc gate still runs. Usually the honest answer is a `docs/experience.md` version-history line
and nothing else; skills aren't architecture and don't have a help page.

## 4. Say when it takes effect — this is the part that confuses people

**Skills load when a session starts.** Merging the PR does not change the session that merged it —
this conversation keeps running the old skills until it ends, and `/reload-skills` won't help
because it rescans existing roots rather than re-reading changed files.

So close with this, not with "all updated":

> Merged — you're on the latest version. One thing: I'm still running the old copy in this
> conversation. Start a new conversation whenever you're ready and the updates kick in there.

Don't demand they restart immediately. Whatever they're in the middle of is fine to finish on the
old skills; the update is already safely in the repo.

If this skill file was itself part of the update, the same rule applies to it — the next run gets
the new version, this run finishes on the old one.
