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
