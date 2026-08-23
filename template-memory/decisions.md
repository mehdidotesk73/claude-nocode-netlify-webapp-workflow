# Decisions

Why the template is shaped the way it is. Record the reasoning, not just the outcome — the
reasoning is what tells a later session whether a decision still applies.

## `main` requires a pull request

Added 2026-08-23, after the template had spent its whole life taking direct pushes to `main`.

Two reasons. The template tells every project it scaffolds to work on branches and merge via PR;
doing the opposite in the repo that teaches it is the kind of inconsistency that quietly erodes the
rule. And the blast radius here is larger than in any single project — a bad commit reaches every
future scaffold, and every existing project on its next `update-skills`.

## Template-only files use `export-ignore`

The template needs somewhere to think that isn't inherited by its projects. `.gitattributes`
`export-ignore` is the mechanism, because the scaffold copy is `git archive HEAD | tar -x`, which
honours it.

**The gap to remember:** `update-skills` syncs `.claude/skills/` out of a plain `git clone`, and a
clone does not honour `export-ignore`. So a template-only *skill* needs excluding in two places —
`.gitattributes` for new projects, and an explicit skip inside `update-skills` for existing ones.
`update-template` is currently the only one.
