# Experience — Lessons & History

Record what you learn as you build: patterns that work, ideas that didn't pan out, and a version history of major changes.

## What Didn't Work (Gotchas & Dead Ends)

### Mobile-First Design Constraints

Touch targets need to be at least 44×44px. Avoid hover-only interactions — users on mobile have no hover. Rethink interactions like "expand on hover" as "toggle on tap" or always-expanded. Test regularly on actual mobile devices, not just the browser's responsive mode.

### Service-Worker Caching & Stale Builds

A PWA caches aggressively to work offline. If a user opens your app, then you deploy a new version, the old bundle may keep serving until they:
- Manually tap "Reload latest" (we surface this in the footer)
- Force-refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Open in a private/incognito tab
- Wait for the service worker to auto-update (can take hours)

Always surface a visual "update ready" affordance so users know to reload. See `App.vue` for the implementation.

### ECharts Gotchas (if using charts)

On a **category x-axis**, `visualMap` (color ranges) and per-segment `lineStyle` colors do **not** bind as expected. If you need per-point coloring on a category axis, use a series with per-point `itemStyle` instead. Register new chart types explicitly with `echarts.use([LineChart, ...])` — ECharts doesn't auto-register components.

### Pure Logic vs. Components

Logic lives in `src/lib/` as plain functions over already-fetched arrays. They recompute instantly with no API refetch. Keep components thin — they should mostly render. This separation makes logic testable and reusable without rebuild cycles.

### Don't Hand-Write a Static `public/manifest.json`

`vite-plugin-pwa` generates `manifest.webmanifest` and injects its own `<link rel="manifest">`. A second static `public/manifest.json` linked from `index.html` produces two competing manifest links in the built HTML, and the static one wins in some browsers — pointing at icons the build never processed. Define the manifest once, in the `VitePWA({ manifest: ... })` block.

### Database Support Is for Live Apps, Not "Stateful" Apps

Recorded as posed. The examples carry the distinction better than any taxonomy built on top of them would:

> I think the database support is for live apps not stateful apps. Depends on what defines a state. But there can be an app that accesses a database to create some sort of coherencey between different running instances of the app. Another form of state is an app that links to a resource and loads into app states for example an accounting app that sets up connection to a text file on web or a csv local file that it has read and write access to, and allow reading the state, modifying the state and saving the state. The latter is a lower level of statefulness. And another level is like a flappy bird app game that does not keep highscores or anything. The app runs, you click play, you play the game, when you die your score is displayed and button for play again. No external state at all just an endless loop of internal states.
>
> Different forms of state might need different infrastructure.

### Realtime Statefulness — a Variation With No Stored State

A further form, alongside the ones above: **state that is live between running instances and stored nowhere.** Four players in a game, a shared cursor, a live drawing surface. Separate copies must agree — but the agreement is only about *now*, and a value that's 200ms old is worthless rather than merely stale.

That is not what a database is for, and Supabase serves it with a different primitive. `postgres_changes` (what a shared shopping list uses) is a real row write replicated off the WAL and then fanned out — correct when the data must persist, far too heavy when it must not. **Broadcast** is plain pub/sub over the same WebSocket and never touches Postgres.

How the connection actually works, since the obvious guesses are both wrong — instances neither share a socket nor join one that a host opens:

- Every client opens **its own** WebSocket to the Realtime server and subscribes to a **topic name**. The server relays between whoever named the same string. It's rendezvous by string, like a chat room name.
- **Nobody creates or owns a channel.** The first subscriber doesn't set it up; the last to leave doesn't tear it down. If the app needs an authoritative host, that's an election the app runs — the transport has no such concept.
- **One socket per client, multiplexed.** Several `.channel()` calls share it.
- **Nothing is stored, and there is no replay.** A message sent before you subscribed is gone, so a late joiner arrives blind and must be handed a snapshot explicitly.
- **Traffic always goes to the region and back.** Two devices on the same wifi still round-trip to Supabase. That's the latency floor; WebRTC is the only way under it.
- The **channel name is the entire access control** on a public channel — so a random room code, for the same reason list ids are random.
- **Presence** rides the same channel and gives the roster (join/leave) without building it.

### Netlify Doesn't Rebuild When You Change an Environment Variable

The database worked on branch previews, then didn't, and a fresh rebuild fixed it with no code change and no config change. The variables had been set on all scopes from the start, so the configuration screen gave no hint anything was wrong.

The root cause was never pinned down, and it's recorded here as an open case rather than a solved one. The leading candidate is build-time staleness: **Vite inlines `VITE_*` into the bundle at build time**, and **Netlify does not trigger a deploy when an environment variable is edited** — so a build can predate its own configuration and serve `undefined` while the dashboard shows everything set correctly. That fits "a rebuild fixed it" without any code change. The service worker serving a stale bundle fits too, and the two aren't exclusive.

The useful part isn't the diagnosis. It's that **a rebuild is cheap and rules out a whole class of cause**, so it's worth trying early rather than after reading the code. And that when a value is compiled in rather than read at runtime, every configuration screen can look correct while the served artifact disagrees — the tell is the deploy's timestamp, not the value.

Worth noting the graceful `supabase = url && key ? createClient(...) : null` guard makes this harder to see. It's the right pattern — it keeps the required `build` check green in CI, where no variables are set — but it converts the failure into a feature that silently does nothing. Pairing it with `logDebug('Supabase not configured — sharing disabled', 'warn')` is what would have turned "sharing is broken" into a log line naming the cause, which is also how we'd know which candidate above was right.

### `using (true)` Is Not "Anyone With the Link"

A Supabase walkthrough that otherwise went well described its RLS policies as making rows "readable/writable by anyone with a list's id — that's what link-only sharing means at the database level," and compared it to a Google Docs anyone-with-the-link share. The SQL was `create policy ... for all using (true)`, and that claim is wrong in a way worth keeping.

`using (true)` grants the anon role **the entire table**. The client can `select *` and enumerate every row; it never has to know an id. Both values needed to do it — project URL and publishable key — are readable in the shipped JavaScript bundle, because that is what those values are for. The unguessable `gen_random_uuid()` stops someone *guessing* a link; it does nothing once they can just list the table. Google Docs actually enforces link-sharing server-side, so the analogy claims a property the database does not have.

It's usually an acceptable trade-off — a shopping list between two people does not need more — and the fix is not always harder SQL. The fix is describing it accurately: *"keeps it away from anyone who wasn't sent the link, and off search engines; not private in a bank-account sense."* Real link-only enforcement needs table access revoked and `security definer` functions taking the id as an argument, which is a bigger piece of work and should be scoped as one.

Same family as the disabled ruleset and the blank Netlify project name: **a setup that looks configured and enforces less than it appears to.** The difference here is that the gap lands in what Claude *tells* the user, not in what they clicked — which makes it harder to catch, since nothing ever fails.

### A Multi-Select Gate Without a Recommendation Is a Quiz the User Can't Pass

The pre-merge doc gate listed its four surfaces neutrally and asked which to update. But the user is non-technical and did not read the diff — they have no basis for judging whether a branch touched "architecture" or made a help page wrong. Asking anyway pushes a decision onto the person least equipped to make it, and the rational responses are to tick everything or tick nothing, neither of which is a judgement.

Claude is the only participant who knows what changed, so the recommendation has to be worked out *before* the question is posed and carried in the options themselves: recommended ones first with **(Recommended)**, and each description naming the specific thing in *this* branch that triggers it. "The Browse page got a category filter, so its help page now describes the old behaviour" is a fact they can accept or reject. "If UI changed, update the help doc" is homework.

**The failure mode to avoid is recommending all four defensively.** If everything is always recommended the recommendation carries no information, and it's the neutral list again with more words. Actively clearing a surface — "nothing here changed the architecture" — is worth as much as flagging one.

Generalizes past this gate: whenever a question is posed to someone who can't see what you can see, the options have to carry your reading of the situation, not just the choices. The user still decides; they just shouldn't have to reconstruct the evidence first.

### A Log Panel Nobody Writes To Is Just an Empty Box

The scaffold shipped the *display* half of on-device debugging — a reactive buffer, a log panel, a **Copy log** button, an error-count dot — and none of the *capture* half. `main.ts` was three lines with no `errorHandler`, no `window.error` listener, no `unhandledrejection` handler. The only entries that ever appeared were ones someone had hand-written a `logDebug()` call for, which means the panel could only report failures that had already been anticipated. The user opens it after a button misbehaves and reads "No log entries yet."

**The case that matters is not the white screen — it's the button that does nothing.** And that one has a specific trap: **Vue catches throws inside event handlers itself.** A handler that throws never reaches `window.onerror`; Vue routes it to `app.config.errorHandler`, and if that's unset the error is logged to a console the phone user cannot open. So the single most common user-visible failure was the one path a naive `window.onerror` would have missed.

Four sources are needed, and each catches something the others don't: `app.config.errorHandler` (handlers, hooks, watchers), patched `console.error`/`warn` (library output, Vue's own warnings), `window.error` **in the capture phase** (plain script errors, plus failed image/script/stylesheet loads, which don't bubble), and `unhandledrejection` (the un-awaited `fetch` in an async handler). Patching the console needs care: bind the native methods *before* patching and have `logDebug` use those, or writing to the panel re-enters the patch and records itself.

Two things that only matter because the user is non-technical: **repeated identical errors collapse to `×N`**, since a handler that throws on every tap would otherwise flush the one useful message out of a 100-entry buffer with copies of itself; and **`copyLog` has an `execCommand` fallback**, because `navigator.clipboard` needs a secure context and this is the only channel from the phone back to Claude — a silent failure there loses the entire bug report.

Verified with Playwright against the built app rather than argued from the code: a throwing handler, a `console.error`, a rejected promise, a 404 image and five repeats all land in the panel, the footer badge turns red with the count, and **Copy log** sits inside the opened window. Worth doing because all four handlers were unverifiable by reading, and the sandbox can drive a real browser.

### Mobile Autocapitalization Silently Breaks Exact-Match Identifiers

Told to add a required status check named `build`, a user on iOS typed it into GitHub's search box and got `Build` — the keyboard capitalized the first letter, as mobile keyboards do by default in text fields. GitHub duly offered **+ Add Build · Any source**.

Adding that would have been a full lockout. Check names match literally, so a rule requiring `Build` waits forever on a check reporting as `build`; combined with an empty bypass list, every PR the user ever opened would be unmergeable — on a ruleset that reads as correctly configured, Active, with all the right boxes ticked. Exactly the failure **Required approvals: 0** was chosen to prevent, arriving through a completely different door.

Two things follow:

**This audience types on phones, so any instruction to enter an identifier needs its casing stated.** "Type `build`" is insufficient; "type `build`, all lowercase — your phone will try to capitalize it" is the instruction. Applies to anything matched literally: check names, branch patterns, project names.

**Better still, don't have them type it at all.** Both of the above are mitigations for an input step that turned out to be avoidable — see the entry below on triggering CI early, which makes `build` a listed option the user selects instead of an identifier they transcribe. Casing guidance and readbacks remain as the fallback, but the durable fix was removing the keystroke, not perfecting the instruction around it.

**And where a readback is still needed, it matters more than the instruction.** The user can follow "type `build`" perfectly and still end up with `Build`, because the corruption happens after they act, not during. That's what makes it different from a misread instruction — no amount of clarity in the telling prevents it. The only reliable catch is asking what's actually in the field before they commit, which is the same reason the confirmation gates restate the expected result rather than just asking "done?".

### Don't Schedule a Check-In for a Two-Minute Deploy

Waiting on a deploy (this happened with the GitHub Pages build the template used to have) by scheduling a background check-in produced the worst available shape: the turn ended on "I'll check back in a couple of minutes", the conversation stalled, and the user — sitting right there — got bored and checked manually. The deploy had already succeeded. The automation added latency and dead air to something that takes ninety seconds.

Poll it in-turn instead, or hand the check to the user as an ordinary confirmation gate ("takes about two minutes, tell me when the run goes green"). Both beat a promise that parks the conversation. Background scheduling earns its place on long or unattended waits; during an interactive setup the user is a faster and more reliable signal than a timer. Still applies to Netlify's own builds now that they're the only deploy pipeline.

### Netlify Site Names Are a Global Namespace

Every Netlify site lives under `*.netlify.app`, one pool shared across the platform, so plain names like `grocery-assistant` are long gone. Propose a distinguished name (username, initials, an extra word), keep alternates in reserve, and warn the user it may be taken — then a rejection is a ten-second retry instead of a failure.

The subtler failure is **doc rot**: the name is chosen at intake and committed into the scaffold (README URLs, the deploy-preview pattern in the project's `CLAUDE.md`), but isn't tested against reality until Netlify setup several steps later. If it changes there and the docs aren't updated, the project's documentation points at a stranger's live site — a wrong link, not a broken one, so nothing surfaces it. Any value committed before external validation needs a write-back once the real value is known.

### A Guided Step Needs a Link and a Value for Every Required Field

The branch-protection step told the user "Go to your repo on GitHub → Settings → Rules → Rulesets" and then listed seven instructions that never supplied a **Ruleset Name** — a field GitHub requires and leaves blank. Two failures in one message, and both had already been fixed once, elsewhere:

**A navigation path is not a link.** Four hops through a settings menu someone has never opened, on a phone, is work the message could have done for them. Deep links exist: `https://github.com/<owner>/<repo>/settings/rules`. Give the URL and keep the click-path as a one-line fallback for when it doesn't resolve.

**Every field the form requires needs a value in the message.** This is the same bug as Netlify's blank Project name, one page later. The instruction covered what to tick and what to leave alone, and simply had nothing to say about the field at the top — so the user stops, mid-step, holding a decision the instructions implied wouldn't come up. If the value genuinely doesn't matter, that's still a reason to supply one (`protect main`) rather than to omit it; "any name works" is a thing to know, not a thing to have to invent.

The general form: **walk the actual form, field by field, and check the message accounts for each one** — including the ones that don't matter. Steps get written from the interesting parts (which rules, which checks) and the boring required field at the top is what gets dropped.

**Follow-up: the link then shipped in backticks and rendered as dead text.** Code formatting suppresses auto-linking, so `https://github.com/.../settings/rules` arrived as a string the user couldn't tap — leaving them to select and copy a long URL on a phone, which is worse than the four-hop click-path the link was supposed to replace. The habit comes from treating every literal the same way; URLs are the exception. Backticks are for values the user **types** (names, branches, check names, where exact characters matter and a link would be wrong). URLs are for **tapping** and go bare in running text. Worth noticing that `ship-feature`'s three hand-off links were already bare and had been working the whole time — the inconsistency is what hid the bug.

### `npm ci` Needs a Committed Lockfile

The CI workflow runs `npm ci`, which fails outright ("can only install packages when your package.json and package-lock.json are in sync") if `package-lock.json` isn't committed. It's tempting to gitignore lockfiles; don't. Commit it whenever dependencies change.

### `declaration: true` in an App's tsconfig

Emitting declarations for an *app* makes `vue-tsc` demand exported names for every type used in a component's public surface — a `defineProps` interface that isn't exported fails with `TS4082: Default export of the module has or is using private name 'Props'`. Declarations matter for libraries, not apps. Dropping `declaration`/`declarationMap` is the fix, not exporting every internal interface.

### Ambient Types for Build-Time Constants

`__BUILD_ID__` and `__BUILD_TIME__` are injected by Vite's `define`, and `virtual:pwa-register` only exists at build time. TypeScript knows about none of them without an `src/env.d.ts` declaring the constants and referencing `vite/client` and `vite-plugin-pwa/client`. Without it the build fails with `TS2304: Cannot find name '__BUILD_ID__'`.

## Patterns Worth Reusing

### End-to-End Encryption Over a Database You Don't Trust

For a messaging app, or anything where the rows live in a database but their contents shouldn't be readable by whoever can read the database. The server stores ciphertext and public keys; it never sees plaintext or any private key.

**Key agreement is Diffie–Hellman (ECDH).** Each side has a keypair and publishes only the public half. The trick is that combining *your private key with their public key* produces the same value as combining *their private key with your public key* — so both ends arrive at one shared secret that never crosses the wire. On elliptic curves the combining step is scalar multiplication, not hashing. Hashing comes one step later: run the raw shared secret through HKDF to get the actual symmetric key.

Then AES-GCM with that key, **a fresh random IV per message**. Reusing an IV under the same key breaks GCM badly — it's the one implementation mistake that turns this from real encryption into none.

The browser does all of it natively; no library:

```ts
// once per identity — publish publicKey, keep privateKey off the server
const kp = await crypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'])

// per conversation — both sides compute the identical key
const key = await crypto.subtle.deriveKey(
  { name: 'ECDH', public: theirPublicKey }, myPrivateKey,
  { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])

// per message
const iv = crypto.getRandomValues(new Uint8Array(12))
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))
```

Storage shape: `profiles(id, public_key)` and `messages(id, conversation_id, sender_id, ciphertext, iv, created_at)`. Note the IV is stored alongside and is not secret.

**Key custody, when the user holds it.** Simplest workable version: the user enters a passphrase at the start of a session, and it never leaves memory. Two ways to get from a passphrase to a keypair — wrapping is the one to prefer:

- **Wrap** (recommended): generate a random keypair once, encrypt the private key under a PBKDF2/Argon2-derived AES key, store that wrapped blob in the DB. The passphrase unwraps it. Safe to store because it's useless without the passphrase, and it works on any device.
- **Derive deterministically**: turn the passphrase directly into the private scalar. No blob to store, but importing a raw scalar as a P-256 key via JWK is fiddly and easy to get subtly wrong.

Either way the passphrase is the whole system: **lose it and every past message is permanently unreadable.** There is no reset. Say that to the user in those words before they pick one.

**Be precise about what this protects, and what it doesn't.** Same discipline as not calling `using (true)` "link-only":

- **The server can still MITM you** if it's the one telling you the recipient's public key — it can substitute its own and read everything. Closing that needs an out-of-band fingerprint check, which is what Signal's "safety numbers" are.
- **No forward secrecy** with static keypairs: one compromised private key decrypts every message ever sent. Rotating per message (Double Ratchet) is a much larger build.
- **Metadata stays plaintext.** Who talked to whom, when, and how often are ordinary readable columns. Encryption hides content, not the social graph.
- **Group chat breaks the pairwise model.** Encrypt the message once under a random key, then wrap that key separately for each recipient.

One good side effect: because content is opaque, a permissive RLS policy on the messages table is far less damaging than it would be otherwise. An enumerator gets blobs.

## Version History

(Record major releases here as you merge features. Example format below.)

### v0.1.0 — [Date]
- **Added:** Initial scaffold, header/footer wrapper, Help modal
- **Infrastructure:** Netlify (production + preview deploys), branch-protected `main`
- **Docs:** TODO, experience, system-design, concepts scaffold

---

*Tip: When you abandon a branch or realize something didn't work, add a short "What didn't work" entry above so future-you (or a teammate) doesn't re-walk the same dead end.*
