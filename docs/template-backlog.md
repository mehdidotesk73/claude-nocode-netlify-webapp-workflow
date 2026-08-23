# Template backlog

Work on **the template itself**. This file is `export-ignore`d in `.gitattributes`, so it does not
travel into scaffolded projects — `docs/TODO.md` is theirs, this one is ours.

---

## Deferred: a skill for level-2 (document-backed) state

**Status:** parked deliberately, 2026-08-23. Not blocked, not abandoned — waiting for a real project
that needs it, so the design is driven by an actual app instead of guesses.

**Nothing is broken meanwhile.** `add-database`'s opening fork already names four levels of state and
routes level 2 away from Supabase, so the failure mode this would prevent (an app that edits a CSV
being sent to a database) is already handled. What's missing is the skill that says what to build
*instead*.

### The gap

`add-database` covers level 3 — separate copies of the app that must agree. Level 2 is the app as an
**editor over a document the user owns**: an accounting app on a CSV, a viewer for a data file, an
editor for a config. The file is the source of truth; the app loads it, edits in memory, writes it
back, and stores nothing itself. Different infrastructure, different conversation, no third website.

### What we already established (don't re-derive)

- **The File System Access API is not in Safari, iPhone included.** `showOpenFilePicker` /
  `showSaveFilePicker` / writable handles are Chromium-only. Since this template's users preview on
  an iPhone, "open a file and save back to it in place" is **not buildable** for the primary target.
  Anything promising in-place editing has to be conditional on the browser.
- **The iOS-achievable shape is load-via-`<input type="file">`, save-via-download** — a copy out,
  not a write back. That is a materially different user experience (they end up with
  `budget (3).csv` in Downloads), and it changes what the feature *is*, so it belongs in the
  conversation before the build, not after.
- **"A text file on the web" is readable via `fetch` when CORS allows, and not writable** without
  some service behind it. A URL is not a writable target. Writing needs a real host — the GitHub
  API, a gist, Dropbox, an S3 presigned URL — each with its own auth story and its own guided setup.
- Level 2 misroutes toward level 3 because "read and write a CSV" sounds like storage. Routing it to
  a database inverts the app: the user's file stops being the artifact and they acquire an account
  and a service to hold a file they already owned.

### Open questions for whoever picks this up

- Does it split into two skills (local file vs. remote resource), or one with a fork? The auth story
  for remote writing is heavy enough that it may not belong beside a file input.
- How much does the browser-capability fork leak into the UI? Feature-detect and offer in-place
  editing where it exists, or commit to the lowest common denominator so behaviour is uniform?
- Is unsaved-changes handling in scope? A document-backed app can lose work on a tab close in a way
  levels 1 and 3 can't, and that's the kind of thing a non-technical user will not anticipate.

### Where the reasoning lives

`docs/experience.md` → *"Stateful" Is Four Different Problems, and Only One Needs a Database*, and
the levels fork at the top of `.claude/skills/add-database/SKILL.md`.
