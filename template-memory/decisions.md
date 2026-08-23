# Decisions

Why the template is shaped the way it is. Record the reasoning, not just the outcome — the
reasoning is what tells a later session whether a decision still applies.

## `main` requires a pull request

Added 2026-08-23, after the template had spent its whole life taking direct pushes to `main`.

Two reasons. The template tells every project it scaffolds to work on branches and merge via PR;
doing the opposite in the repo that teaches it is the kind of inconsistency that quietly erodes the
rule. And the blast radius here is larger than in any single project — a bad commit reaches every
future scaffold, and every existing project on its next `update-skills`.

## Template-only files use `export-ignore`

The template needs somewhere to think that isn't inherited by its projects. `.gitattributes`
`export-ignore` is the mechanism, because the scaffold copy is `git archive HEAD | tar -x`, which
honours it.

**The gap to remember:** `update-skills` syncs `.claude/skills/` out of a plain `git clone`, and a
clone does not honour `export-ignore`. So a template-only *skill* needs excluding in two places —
`.gitattributes` for new projects, and an explicit skip inside `update-skills` for existing ones.
`update-template` is currently the only one.

## Guided steps are a message plus a gate, never a gate alone

Found by testing on a phone: whole steps were arriving inside the `AskUserQuestion` **question**
field — progress checklist, Supabase dashboard URL, the `create table` SQL, all of it. That field
renders as plain text, so the link was unclickable and the SQL had to be selected by hand on a
phone. The two things the step worked hardest to provide, a tappable link and a copyable value,
were exactly what got destroyed.

The cause was our own wording. `CLAUDE.md` said *"Instructions posted as text and then waiting
leaves the user unsure whether you're working or blocked"* — intended as "don't trail off without a
gate", but it reads as "don't post instructions as text", which is an instruction to put them in
the tool call. The rule that replaced it: the step is a normal markdown message, **then** the tool
call carries a one-line question. "End the turn on the gate" means the call is last, not that the
call is everything.

Worth remembering as a class: **a guardrail phrased as a prohibition on the wrong thing can push
the model into a worse behaviour than the one it was preventing.** Say what to do, then what to
avoid — not the reverse.
