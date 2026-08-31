# Backlog

Work parked deliberately. Each entry should carry enough to resume without re-deriving anything.

## Porting `src/` changes into existing projects

`update-skills` syncs `.claude/skills/` only. Changes to the scaffold's own source — the automatic
error capture in `src/debug.ts`, `src/main.ts` and `src/App.vue`, for instance — never reach a
project that was created before them.

Deliberately not solved yet. It isn't the same problem as syncing skills: a skill file is standalone
and self-replacing, whereas a project's `src/` has moved on since it was scaffolded, so this is a
refactor against whatever that project actually became rather than a copy. Postponed until it's
worth the complexity.

## No test tooling in the scaffold

A pattern report from a project (chained-scenario E2E tests) suggested pointing at it from
"whichever skill sets up a project's test tooling, if one exists". None does. The scaffold ships
no `test` script, no Playwright, no vitest, and `CLAUDE.md` names the absence as a known gap:
`npm run build` passing is the whole bar.

So the pattern is recorded in `docs/experience.md` with no skill pointing at it — findable when
someone goes looking, invisible otherwise. Closing that means a skill that sets up test tooling,
which is a real piece of work and hasn't been asked for. Worth noting that the pattern's own
prerequisite (a Playwright suite against a live backend) is a bigger commitment than most projects
here need, so a test-setup skill should probably start with unit tests of `src/lib/` and treat the
E2E suite as the opt-in tier.
