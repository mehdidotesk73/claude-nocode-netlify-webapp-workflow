---
name: add-statefulness
description: Work out what kind of state an app needs, confirm it with the user in plain language, then hand off to the skill that builds it. Use whenever a request implies the app should remember, save, share, sync, or update live — "keep my list", "share it with a friend", "see it on my phone and laptop", "we both edit it", "load a spreadsheet", "keep score". Run this before add-database or any storage work, so the choice is made deliberately rather than defaulting to a database.
---

# Decide what kind of state this needs

"Make it remember things" covers several different problems with different infrastructure, and the
expensive one is easy to reach for by accident. This skill does three things in order: **assess**,
**confirm with the user**, **hand off**. Don't skip the middle one — the choice has consequences the
user has to live with, and they can't consent to a decision they never saw.

## 1. Assess

One question separates the cases: **who else has to agree about this data?** Work it out from what
they asked for, not by interrogating them.

| What they're describing | Kind | Where it goes |
|---|---|---|
| Play, finish, play again. A calculator. A converter. | **None** | Nothing — build it |
| A checklist, preferences, a draft, on their own device | **Device-local** | `localStorage` — inline below |
| Loads and saves a CSV, a config, a data file they own | **Document-backed** | Document, not database |
| Two people on one list; phone and laptop agreeing; messaging | **Shared, durable** | `add-database` |
| A game, shared cursor, live drawing — agreement about *now* | **Live, not stored** | Realtime — see below |
| Per-user private data, real sign-in | **Accounts** | Bigger build, scope separately |

Judgement calls that come up:

- **Where a document lives doesn't change what it is.** A file on the phone, on Google Drive, at a
  URL — same app, same conversation. Only the read/write mechanism differs. Don't let "in the cloud"
  promote it to a database.
- **Live is not stored.** A game needs copies to agree about *now*; a value 200ms old is worthless
  rather than stale. Nothing is kept, so a database is the wrong tool. Messaging looks similar and
  isn't — the message has to survive.
- **Some apps need two.** Durable messages *and* ephemeral typing indicators. Say so; don't force one.
- **Device-local is a real answer.** Reaching past it costs someone half an hour and an account for
  nothing.

## 2. Restate it, including what it costs them

**This is the part that matters, and it is not a summary of your reasoning.** Tell them what you
concluded, what it will mean *for them*, and what it won't do — then let them push back. Plain
language, no infrastructure names unless they'll see them.

Three short parts, as a normal message:

> **What I think you need:** one sentence, in their terms.
>
> **What that means:** what they'll have to do (accounts, setup time, steps), and the honest limits
> — who can see the data, what happens if something is lost, what it doesn't protect.
>
> **What I'll do next:** the first concrete step.

The limits are not fine print; they are the reason for asking. Say them at the level the user
actually feels:

- **Device-local** — it lives only in this browser on this device. Clearing site data or switching
  phones loses it. No account, nothing to set up, works offline.
- **Document-backed** — their file stays the source of truth, and nothing is stored by the app.
  On an iPhone, saving produces a *copy* in Downloads rather than writing back to the original.
- **Shared, durable** — a free account on a third site and about ten minutes, once. With link-only
  sharing, **anyone who has the link can read and change it**, and there's no password beyond that.
  Data leaves their device and lives on a server.
- **Live** — nothing is kept. Someone joining late sees only what happens after they arrive.
- **Accounts** — a much bigger build; worth scoping on its own.

Then close with an `AskUserQuestion`: **"Yes, that's right"**, and **"Not quite — let me explain
again"** with the free-text box. Add a third option when there's a real fork worth naming, e.g.
*"I'd rather it stayed only on my phone"* or *"other people will need to sign in"*.

**Loop until it converges.** If they refine, restate the new understanding and gate again — don't
carry a half-corrected picture into the build. A second round here is far cheaper than a database
they didn't want.

**Post the assessment as a normal message and put only the question in the `AskUserQuestion`.** That
field renders as plain text; a restatement pasted into it loses its formatting and reads as a wall.

## 3. Hand off

Only after they confirm.

- **None** → nothing to set up. Say so and build the feature.
- **Device-local** → no skill needed; it's a small amount of code. Keep it in `src/lib/` as plain
  functions (`load()` / `save()`), wrap every access in `try/catch` — private mode and quota limits
  both throw — and treat a failed read as "no data yet" rather than an error the user sees. Version
  the stored shape from the start if it's more than a flat list; migrating later without a version
  field is guesswork.
- **Document-backed** → no skill for this yet. Build it directly, and read the constraints in
  `add-database`'s fork first: the File System Access API doesn't exist in Safari, so on an iPhone
  it's load-via-file-input and save-via-download; a plain URL is readable via `fetch` when CORS
  allows but is not a writable target.
- **Shared, durable** → invoke **`add-database`**. Before writing any schema, check whether either
  worked pattern in `docs/experience.md` applies: **Two-Party Link Apps** (two people, one link, no
  accounts) and **End-to-End Encryption Over a Database You Don't Trust**. Both decide table shape,
  so they're cheaper to read first than to retrofit.
- **Live** → no skill for this yet either. **Say that plainly rather than routing them to
  `add-database`, which is the wrong tool and the expensive one.** What's known is written up as
  *Realtime Statefulness* in `docs/experience.md`: Supabase **Broadcast** rather than
  `postgres_changes`, channels as rendezvous-by-name with no owner and no replay, a snapshot handed
  to late joiners, and an app-level host election if the thing needs an authority.
- **Accounts** → say it's a bigger build and scope it as its own change.

**Whichever route: it's a normal change, so `ship-feature` runs it** — branch, build, PR, links.

## When a route has no skill yet

Two of these are gaps, and they'll close as real projects work them out. If you build one and it
holds up, use **`share-pattern`** to write it up as one copy-pasteable block for the template. That
is how the entries above got here, and it's how the missing ones arrive — a pattern proven in an app
that actually shipped beats one designed in advance.
