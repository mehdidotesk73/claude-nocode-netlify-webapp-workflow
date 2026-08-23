---
name: add-database
description: Give the app a real database with Supabase, so data survives a refresh, syncs across devices, and can be shared live between people. Use whenever the app needs state that outlives one browser — a list two people edit together, anything "share with a friend", data that must appear on both phone and laptop, live updates between users, accounts or login. Walks the user through creating the Supabase project and schema, then wires up the client. Check the localStorage fork first: data that only ever lives on one device does not need this.
---

# Give the app a shared database

Setting this up means sending the user to a **third website** and having them run SQL. That's the
biggest ask in this whole template, so the first job is making sure it's actually needed.

## First: does it need a database at all?

Ask what happens to the data, and route on the answer:

| What they describe | What it needs |
|---|---|
| "I want to see it when I come back" (one device) | `localStorage` — no setup, no accounts, no website |
| "on my phone *and* my laptop" | Supabase |
| "share it with my partner / a friend" | Supabase |
| "we both edit it and it updates live" | Supabase + realtime |
| "other people sign in" | Supabase + auth (out of scope here — say so) |

**`localStorage` is a real answer, not a lesser one.** A personal checklist, saved preferences, a
draft in progress — those work offline, need no account, and cost nothing to set up. Reaching for a
database there is thirty minutes of someone's time spent on nothing. Only continue once the answer
is genuinely "more than one device or more than one person".

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

**Default to putting the two values straight in `src/lib/supabase.ts`.** With Vite, any `VITE_*`
variable is inlined into the JavaScript bundle at build time, so environment variables give a static
site exactly zero additional secrecy — the key ships to the browser either way. What they cost is a
fourth dashboard, two more guided steps, and the failure modes below. The publishable key is built
to be public; row-level security is the boundary.

**Netlify environment variables are a legitimate alternative** — conventional, and right if the key
may need rotating without a PR, or if production and previews should ever hit different Supabase
projects. If the project already uses them, leave it alone; don't migrate a working setup for
tidiness. But check both of these, because each one fails *silently*:

- **The names must match the code exactly.** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are
  what the client reads; Supabase's dashboard now calls that second value **Publishable key**, so
  naming the Netlify variable after the label produces a mismatch. Read the variable names out of
  the source, not off the Supabase screen.
- **Scope them to Deploy Previews, not just Production.** Netlify scopes per context. Set to
  Production only, every PR preview — the user's sole test surface — gets no database and looks
  broken while the live site works.
- **Set the variables *before* the build, and redeploy after any change.** This is the one that
  actually bites, because everything looks correct while it's broken. `VITE_*` values are baked
  into the bundle at build time, and **Netlify does not rebuild when you edit an environment
  variable** — so a deploy that ran before the variables existed has `undefined` compiled into it
  permanently. The user then checks Netlify, sees both variables set on all scopes, and reasonably
  concludes the configuration isn't the problem. Fix: **Deploys → Trigger deploy → Clear cache and
  deploy site**. When a database "doesn't work" on a deploy whose variables look right, check
  whether that deploy predates them before debugging anything in the code.

**Guard the missing case, and say so in the log.** The client should degrade rather than crash:

```ts
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
```

That keeps CI green — the required `build` check runs in GitHub Actions with no Supabase variables
set, and Vite never executes app code at build time, so a top-level `throw` on missing config would
block every merge. But a bare `null` turns a misconfiguration into a feature that quietly does
nothing, so pair it with `logDebug('Supabase not configured — sharing disabled', 'warn')`. That's
the difference between the user reporting "sharing doesn't work" and pasting you a log that says
why.

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
