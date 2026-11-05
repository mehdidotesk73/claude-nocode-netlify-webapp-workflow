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

## Confirm the Deploy Preview footer shows the PR head sha

`ship-feature` now tells the user which build a preview's footer should read: the PR's head commit,
via Netlify's `COMMIT_REF`. Production footers are confirmed to show the right sha on a real phone.
Deploy Previews are not. It's inferred from Netlify setting `COMMIT_REF` on every build, and the
sandbox can't reach `netlify.app` to check. On the next real project PR, compare the preview footer
with `git rev-parse --short HEAD`. If they differ, fix step 6 of `ship-feature` before another user
is told to expect the wrong id.
