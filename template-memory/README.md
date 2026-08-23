# Template memory

Notes about **building the template itself**. Nothing here is copied into projects — the whole
directory is `export-ignore`d, so `git archive` leaves it behind.

## Why this exists

The template has two audiences and they were sharing one notebook. `docs/experience.md` ships to
every scaffolded project as *their* experience file, so anything written there is inherited by
someone who has never seen this repo. That's right for "the service worker will serve a stale
bundle" and wrong for "the bootstrap's staged-brief design solved the skills-loading problem" —
the second is a fact about developing the template, and it arrives in a stranger's project as
history they never lived.

So:

| Goes in `docs/experience.md` (ships) | Goes here (doesn't) |
|---|---|
| Gotchas any app on this stack will hit — PWA caching, mobile constraints, ECharts, Supabase, Netlify | How the bootstrap, skills, or setup flow are designed and why |
| Reusable patterns — the E2E encryption pattern, the state layers | What went wrong while testing the setup on a real device |
| Anything a project's own future sessions need to know | Decisions about the template's structure, and options rejected |

When in doubt, ask: *would this make sense to someone who only has the scaffolded project and never
saw the template repo?* If not, it belongs here.

## Files

- `history.md` — what we learned building the template: the bootstrap, the setup flow, the scaffold
  mechanics. Mostly traps in a one-time setup that a project never runs again. The live guidance for
  each lives in the relevant skill; these record *why* the skill says what it says.
- `decisions.md` — why the template is shaped the way it is, and what was tried and dropped.
- `backlog.md` — work parked deliberately, with enough context to resume cold.

Keep both honest about uncertainty. A guess recorded as a conclusion is worse than no note.
