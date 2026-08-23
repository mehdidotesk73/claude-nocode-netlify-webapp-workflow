---
name: add-database
description: Give the app a shared database with Supabase, for state that has to stay coherent across separately running copies of the app — a list two people edit together, anything "share with a friend", data that must match on phone and laptop, live updates between users. Walks the user through creating the Supabase project and schema, then wires up the client. Not for every app that "remembers" things: work through the fork at the top first, since an app that edits a document — wherever that document lives, local or cloud — needs no database at all.
---

# Give the app a shared database

Setting this up means sending the user to a **third website** and having them run SQL. That's the
biggest ask in this whole template, so the first job is making sure it's actually needed.

## First: which kind of state is this?

"Stateful" covers several different problems and only one of them needs a database. The line that
matters is **whether separate running copies of the app have to agree with each other**, and it
falls in exactly one place:

**No external state.** A game you play, die, and replay; a calculator; a converter. Everything lives
in memory and dying with the tab is correct behaviour. *Needs nothing.* Don't add persistence
because it sounds more finished.

**Remembered on this device.** A personal checklist, saved preferences, a draft in progress. One
browser, survives a refresh, works offline. *`localStorage`, or IndexedDB past a few megabytes.* A
real answer, not a lesser one — reaching past it costs someone half an hour for nothing.

**The app edits a document.** An accounting app over a CSV, a viewer for a data file, an editor for
a config. The **document is the source of truth**: load it, edit in memory, save it back. The app
stores nothing itself — reopen the document and the state returns. *Needs a way to read and write
that document; not a database.*

> **Where the document lives doesn't change what this is.** A file on the phone, a file on Google
> Drive, a file at a URL — same behaviour, same shape, same conversation with the user. Only the
> read/write mechanism differs, and that's an implementation detail to settle while building, not a
> different kind of app. Don't let "it's in the cloud" promote it to the next category.

**Separate copies have to agree.** Two people on one list, both editing. Your phone and your laptop
showing the same data as it changes. Something outside every copy has to hold the truth and settle
conflicts, and *that* is what a database is for. **This skill.** Within it, **realtime** matters
only when both people are looking at once and a stale screen would be wrong; otherwise
sync-on-load does.

Beyond that sits **accounts and login** — per-user private data, real sign-in. Supabase does it,
it's a much bigger build, scope it as its own change.

**The document case is the one that gets misrouted**, because "read and write a CSV" sounds like
storage and a database is where you put storage. It isn't the same app: routing it to a database
means the user's document stops being the artifact, and they've acquired an account and a service
to hold something they already owned. Saving a document to Drive is still saving a document.

Two constraints to know while building that case — they decide how saving works, not which category
it is: **the File System Access API (editing a file in place) doesn't exist in Safari, iPhone
included**, so on this template's usual target it's load-via-file-input and save-via-download, a
copy out rather than a write back; and a plain URL is readable with `fetch` when CORS allows but
isn't a writable target without a host behind it. Say which you're building before you build it.

## Then: decide the sharing model, out loud

This decides the schema, so settle it before writing SQL. Put it plainly and let them choose:

- **Link-only, no login** — a random unguessable id in the URL is the whole key. Anyone with the
  link can read and edit. No sign-up, nothing to forget. Right for a shopping list between two
  people.
- **Accounts** — real sign-in, per-user data, private by default. Correct for anything personal or
  financial, and a much bigger build. If they want this, say it's a bigger piece of work and scope
  it separately rather than bolting it on here.

**Be accurate about what link-only protects.** See *The honest version of "anyone with the link"*
below before you describe it to them — the obvious SQL does something weaker than it sounds, and
saying otherwise is a promise the database doesn't keep.

## Say what's coming, then go part by part

Same shape as the Netlify steps in `finish-setup`, and the same conventions apply — exact values
never placeholders, bare URLs never backticked, one part at a time, each ending on an
`AskUserQuestion` gate whose "yes" restates what they should be seeing. Open with the whole list so
they know how long this is:

> Before I can write any of this, the app needs a real database to talk to. It's a free Supabase
> account and three short steps — about ten minutes, and it's a one-time thing.
>
> ✅ **A.** Create the project
> ⬜ **B.** Create the tables
> ⬜ **C.** Copy two values back to me

### Part A — create the project

> 1. Go to https://supabase.com and click **Start your project** — sign in with GitHub, it's the
>    fastest and you already have an account
> 2. Click **New project**
> 3. **Name**: `<repo-name>`
> 4. **Database Password**: click **Generate a password**, and save it somewhere. You won't need it
>    for the app — Supabase just requires one
> 5. **Region**: whichever is closest to you
> 6. Click **Create new project**
>
> It takes about two minutes to set up. When it's done you'll be on the project dashboard — paste me
> the address from your browser's address bar and I'll take it from there.

**Get the address bar URL, not just "done".** It contains the project ref
(`https://supabase.com/dashboard/project/acqqdcxmjgpfjdtgivjn`), which lets you hand them exact deep
links for Parts B and C instead of directions through a sidebar. Ask for it as part of the step.

### Part B — create the tables

Give them the SQL editor as a direct link built from the ref:
`https://supabase.com/dashboard/project/<ref>/sql/new`

> 1. Open <that link> — it's the SQL editor, where you set up the tables
> 2. Paste this in and click **Run** (bottom right):
>
> ```sql
> <the schema>
> ```
>
> You should see **Success. No rows returned** at the bottom. That's what success looks like here —
> there's nothing to see yet because the tables are empty.

Write the schema for *their* app. The shape that works for link-only sharing:

```sql
-- A parent row per shared thing. Its id is the share link.
create table lists (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Shopping list',
  created_at timestamptz not null default now()
);

-- Children cascade, so deleting the list cleans up after itself.
create table items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  name text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on items (list_id);

alter table lists enable row level security;
alter table items enable row level security;

-- Read the caveat below before describing these as "link-only".
create policy "open access" on lists for all using (true) with check (true);
create policy "open access" on items for all using (true) with check (true);

-- Turn on live updates.
alter publication supabase_realtime add table lists, items;
```

**Never skip `enable row level security`.** Without it Supabase refuses every request from the app
and you get a confusing empty screen rather than an error that says why.

### Part C — copy the two connection values

These live on the project's **overview** page — not under Settings.

> 1. Open https://supabase.com/dashboard/project/<ref>
> 2. Near the top there's a **Connect** / copy control listing your project's values. You want two:
>    - **Project URL** — reads `https://<ref>.supabase.co`
>    - **Publishable key** — a long string
> 3. Paste both back to me. The publishable key is safe to share — it's designed to be public, and
>    it's the table rules we just created that actually protect the data.
>
> If you see anything labelled **secret** or **service_role**, leave it alone — that one bypasses
> every rule and must never go near the app.

**Older projects label these differently.** Some accounts still show Settings → API with an **anon /
public** key instead of **Publishable key** — same thing, same safety, use it. If they're on the old
layout the deep link is `https://supabase.com/dashboard/project/<ref>/settings/api`.

## Wiring it up

```
npm install @supabase/supabase-js
```

Commit the lockfile — CI runs `npm ci`.

**Two places the values can live, and both are fine.** Committed straight into
`src/lib/supabase.ts`, or read from `VITE_*` environment variables set in Netlify. Either way the
key ends up in the shipped bundle — Vite inlines `VITE_*` at build time — so this is a convenience
question, not a security one. Committing is fewer moving parts; env vars let the key change without
a PR and allow different projects per environment. Pick one, and if the project already has one,
leave it.

Whichever route, the client should degrade rather than crash when the values are missing:

```ts
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
```

That keeps CI green — the required `build` check runs in GitHub Actions with no Supabase variables
set. Log the fallback (`logDebug('Supabase not configured — sharing disabled', 'warn')`) so a
misconfiguration shows up as a log line rather than a feature that quietly does nothing.

**Things that have actually gone wrong with the env-var route**, offered as leads when something
doesn't work rather than as a checklist to run up front:

- Variable names not matching what the code reads — Supabase's dashboard says **Publishable key**
  while a client may read `VITE_SUPABASE_ANON_KEY`.
- Netlify scopes variables per context, so a Production-only setting leaves deploy previews without
  a database.
- `VITE_*` is baked in at build time and Netlify doesn't redeploy when you edit a variable, so a
  build can predate its own configuration. A rebuild is worth trying early, since it's cheap and
  rules this out.

```ts
import { createClient } from '@supabase/supabase-js'

// Both values are public by design: the publishable key is meant to ship in
// the bundle, and the row-level security policies are what guard the data.
export const supabase = createClient(
  'https://<ref>.supabase.co',
  '<publishable key>',
)
```

Keep query logic in `src/lib/` as functions over the client, components thin — the same convention
as every other module here. Two things specific to this:

- **Never swallow a Supabase error.** Every call returns `{ data, error }`, and an ignored `error`
  is a button that silently does nothing. `if (error) { logDebug(...); return }` — the log panel
  auto-captures it, which is how the user reports it back to you from a phone.
- **Realtime needs cleanup.** Subscribe in `onMounted`, `supabase.removeChannel(ch)` in
  `onBeforeUnmount`, or channels pile up on every navigation:

```ts
const ch = supabase
  .channel(`list-${listId}`)
  .on('postgres_changes',
      { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` },
      (payload) => applyChange(payload))
  .subscribe()
```

## The honest version of "anyone with the link"

`using (true)` reads as "anyone with the id can get their row". It isn't. It grants the anon role
the **whole table** — anyone with the project URL and publishable key, both readable in the shipped
bundle, can list every row, not just the one they were sent. The unguessable id stops a stranger
guessing a link; it does not stop them enumerating.

That's usually fine, and it is not the same as Google Docs link-sharing, which genuinely enforces
the link. So say it as it is:

> Worth knowing: this keeps the list off search engines and away from anyone who wasn't sent the
> link, which is the right level for a shopping list. It isn't private in a bank-account sense —
> don't put anything sensitive in here, and tell me if you ever want to, because that's a different
> setup.

**If the data is actually sensitive**, blanket policies aren't enough. Revoke direct table access
and expose `security definer` functions that take the id as an argument — the client can then only
reach rows it names, which is the property the blanket policy is missing. Say plainly that this is
a bigger piece of work and scope it as its own change.

## Know this

- **Free projects pause after about a week of inactivity.** The app then fails to load data with no
  obvious cause. It's one click to resume from the dashboard — check it first whenever a
  previously-working app suddenly can't reach its data.
- **Preview deploys and production share one database.** Testing a PR writes to the same rows as
  the live site. Fine for this scale, worth saying out loud before they test a delete button.
- **`gen_random_uuid()` needs no extension** on current Supabase — `pgcrypto` is already there.
- **The schema is a change like any other.** Later columns or tables mean another SQL step for the
  user; batch them rather than sending someone to the SQL editor three times in a session.

## Ship it

`main` is protected, so this goes through **`ship-feature`** — branch, build, PR, links. Setup
happens *before* the code change: the app can't be built against a project that doesn't exist.

The doc gate genuinely applies here — this is architecture. Recommend **`docs/system-design.md`**
(the data model and the sharing/trust model, plus the system map) and **`docs/experience.md`**, and
**`docs/concepts/*.md`** if sharing is now something the user can see and do in the UI.
