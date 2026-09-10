---
name: give-vale-an-owner-and-a-trigger
title: Give the prose linter an owner, a run trigger, and a loud failure when the binary is missing
created: 2026-09-10
---

## Situation

Every checker in this repo has an owner and a trigger. `hardener` runs the eight-stage sequence.
`architect` owns `ast-grep:rules` and `ast-grep:test`. `cleaner` owns `crap4ts` and `dry4ts`.
`product` owns `acceptance-mutation`. Each is named in a role file, and most are named in a numbered
step.

**Vale has neither.** Verified 2026-09-10:

- no `npm run` script invokes it — `package.json` has no `vale` entry
- no CI — there is no `.github/` directory
- no git hook, and nothing in `.claude/settings.json`
- **no role file mentions Vale at all**, in any of the five

`.vale.ini`'s first line says it: _"Report-only: nothing gates on the exit code."_ In practice the
orchestrating session runs it by hand, when it remembers.

**`prose-linting.md` is a reactive article, and its own triggers say so.** All three read _before
acting on a finding_, _before re-levelling a rule_, _when a run reports zero_. Every one assumes a
finding already exists. **Nothing anywhere tells anyone to go and produce one.**

## Complication

**The prose that governs six audiences is the only surface with no owner.** `.claude/**` and
`CLAUDE.md` are what every role and this seat read before doing anything, and they are the one
artifact whose linter nobody is assigned to run.

**Naively adding a stage would make things worse, not better.** Vale is a Go binary installed by
`brew`, not by `npm ci`. `prose-linting.md` records the consequence: _"A machine without it lints
nothing, which reads exactly like a clean run."_ A role told to "run Vale" on a machine without it
reports a confident zero and hands off clean. That is failure mode 3 in the article's own list, and
a bare instruction converts it from a hazard someone might hit into one the pipeline hits by design.

**`.vale/` compounds it per worktree.** The style package is gitignored, so every new worktree needs
`vale sync`. CLAUDE.md's setup block now says so, but a role reaching a Vale step would not
necessarily have run it — and a missing `.vale/` exits **2** with empty stdout, which a `grep -c`
pipeline reports as zero.

**Report-only means "run it" cannot mean "gate on it".** Three of the six enabled rules are prompts
requiring per-finding judgement. So the step is a _read-and-triage_ step, not a pass/fail one, and it
does not fit `hardener`'s stage list, where every stage is something to fix before moving on.

## Question

Who runs the prose linter, on what trigger, and how does a missing binary fail loudly instead of
reporting zero?

## Answer

Three parts, and the third is the one that makes the first two safe.

**1. The trigger is an edit, not a pipeline position.** Every other checker triggers on reaching a
stage. This one should trigger on **having edited agent-facing prose** — `.claude/**` or `CLAUDE.md`
— because that is exactly when a finding can appear and exactly who can judge it. That makes it a
duty in each role that edits those files, and in `orchestration.md` for this seat, rather than a
ninth stage.

**2. The owner is whoever made the edit.** `architect` and `cleaner` both carry doc-truth duties
after a structural change; the orchestrating seat authors articles. A single owning role would be
wrong here, because the edit can come from four places.

**3. An `npm run prose-lint` script, whose first job is to fail loudly when it cannot lint.** This is
the part that earns the slice:

- a missing `vale` binary must exit nonzero with a message, never report zero
- a missing `.vale/` must exit nonzero, not exit 2 with empty stdout
- it should print the finding count it actually measured, so a zero is a measured zero

That also makes every doc reference to it checkable: `agent-doc-check`'s check 1 verifies that
`npm run <script>` names a real script, so once the script exists the instructions pointing at it are
machine-checked. **Ordering constraint: the script must land before any doc references it**, or check
1 reds.

## Touches

- `package.json` — one script
- possibly `scripts/prose-lint/` — but see the open questions; a one-line script may be enough, and a
  `scripts/<program>/` directory owes CRAP ≤ 6, its own vitest suite, `dry4ts:scripts` and mutation
  testing
- `.claude/agents/architect.md`, `cleaner.md` — a duty on the doc-truth clause each already carries
- `.claude/agents/articles/orchestration.md` — the same duty for this seat
- `.claude/agents/articles/prose-linting.md` — a run trigger to sit beside its three read triggers
- `CLAUDE.md` — the command list, one line

## Open questions

- **Does this need a `scripts/` program at all?** A shell one-liner in `package.json` that checks for
  the binary and forwards the exit code may be the whole thing. The gate freight of a
  `scripts/<program>/` directory is real, and `orchestration.md` says to search before building.
- **Should the script fail on findings, or only on inability to lint?** Failing on findings would
  make it a gate, which contradicts `.vale.ini`'s report-only design and the three prompt rules that
  need judgement. Failing only on "I could not measure" keeps the report-only contract while closing
  the confident-zero hole. This is the crux and should be decided first.
- **Is a bare instruction enough for the roles, given the binary may be absent on their machine?** If
  a role runs the script and it exits nonzero for a missing binary, what does the role do — install
  it, or report and stop? The second is consistent with `workflow.md`'s failure conditions.
- **Does the Slop spike change this?** It does not depend on it, and this does not depend on the
  spike. But if `Slop.Assistant` is ever adopted at its shipped `error` severity, the severity only
  becomes meaningful once a runner reads the exit code — so the two meet here, and that is the
  gating question deferred from the spike.
