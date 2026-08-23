---
name: share-pattern
description: Write up something learned in this project as a reusable pattern and emit it as one copy-pasteable markdown block, for the user to paste into a session on the template repo. Use when the user says a solution is solid, generalizable, worth reusing, worth adding to the template, or asks to share a pattern or lesson upstream. Not for project-specific notes, which belong in this repo's own docs/experience.md.
---

# Send a pattern back to the template

This project was scaffolded from a template that other projects are also built from. When something
here turns out to generalize, the way it travels back is a **written report the user copies into a
session on the template repo** — there's no upstream remote, and this project can't push there.

Your whole output is that report. The user's next action is one tap on the copy button, so anything
outside the block is friction.

## First: is it actually generalizable?

Be willing to say no. A pattern earns its place only if it would help someone building a **different
app on the same stack**. Test it:

- **Would it make sense to someone who has never seen this project?** If explaining it needs this
  app's domain — its screens, its table names, its business rules — it's a project note. Those
  belong in this repo's own `docs/experience.md`, and you should put it there instead and say so.
- **Is it a decision, or a discovery?** "We used a modal here" is a choice. "Vue swallows throws in
  event handlers, so `window.onerror` never sees them" is a fact about the stack that cost someone
  an afternoon. Send discoveries.
- **Did you actually verify it?** Say which parts were confirmed by running or observing something,
  and which are inference. A guess written up confidently is worse than nothing, because the
  template will believe it.

If it fails the first test, say so plainly and offer the local write-up instead. One honest "this is
specific to us" saves the template a bad entry.

## What the report contains

Match how patterns already read in `docs/experience.md` — a claim, the mechanism, then the limits.

1. **A title naming the pattern**, not the feature it came from. "Two-Party Link Apps", not "how
   whisper-z does invites".
2. **When it applies** — one or two sentences, in terms someone else could recognise their own
   situation in.
3. **The pieces**, each with the *why*. Include real code or SQL where it's the clearest form, kept
   to the part that generalizes; strip this app's names.
4. **What it does not do.** Every pattern has an edge, and the template's whole discipline is
   stating those plainly rather than implying guarantees. If security is involved, say what an
   attacker can still do.
5. **Where you think it belongs** — a new pattern, an addition to a named existing one, or a change
   to a skill. A suggestion, not a decision: the template session judges.

Separate the genuinely transferable parts from the incidental ones. If two of five pieces would help
someone who *isn't* doing the specific thing you did, say which two and why — that judgement is the
most useful thing in the report.

## Emitting it: the fence rule

The report is markdown containing markdown. If it holds a fenced code block and you wrap it in a
fence of the same length, **the block ends at the first inner fence** — the rest spills out as loose
text and the user copies half a report.

**Count the longest run of backticks anywhere in your content, and open and closing with at least
one more.** In practice: any report with ` ```sql ` or ` ```ts ` inside needs a **four-backtick**
outer fence.

````
# Pattern: Some Name

Prose about it.

```sql
select 1;
```

More prose.
````

**Then re-read what you produced before sending.** You are checking one thing: does the block run
unbroken from the first line of the report to the last? Signs it didn't: code appearing as normal
text, a stray ``` on its own line, or the report visibly ending early. If any content has a
four-backtick run of its own, go to five. This check is not optional — a broken fence is invisible
to you and obvious to the user, who then has to select the text by hand.

## Hand it over

The block, and one line after it saying what to do with it:

> Copy that and paste it into a Claude Code session on the template repo
> (`claude-nocode-netlify-webapp-workflow`). It'll decide where it fits and open a PR.

Nothing else. No summary of what's in the block — they're about to read it — and no follow-up
questions in the same turn, which would give them something to answer instead of something to copy.
