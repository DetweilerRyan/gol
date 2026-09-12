# CLAUDE.rationale.md

Evidence behind the rulings in `CLAUDE.md`, under the sidecar convention that file's own
"Where new documentation goes" branch 5 states. **Nothing here constrains an action.** Every
rule stays in `CLAUDE.md`; only the measurement, the probe method, the rejected alternative
or the correction moved down here.

**No role carries a read trigger for this file, and that is the point.** It is read when a
rule in `CLAUDE.md` is being changed, never in order to follow one.

## Why this file is in `articles/` rather than at the repo root

**Chosen, not forced.** The role-file sidecars sit here because `scripts/agent-doc-check`
reads the direct `.md` children of `.claude/agents/` as the agent roster, so a prose file
there fails the frontmatter check outright. No comparable mechanism reaches a root-level
`.md`. Branch 5's literal wording — a sidecar goes _beside the article_ — would have put
this one at `CLAUDE.rationale.md` in the repo root, and nothing would have refused it.

The repo root was rejected on **checker reach**, measured 2026-09-10 by writing a file
carrying one deliberately unresolvable filename token and one deliberately unresolvable
`npm run` reference, then running both gates from each location in turn:

| Placement                                     | `npm run reference-check`        | `npm run agent-doc-check`        |
| --------------------------------------------- | -------------------------------- | -------------------------------- |
| `.claude/agents/articles/CLAUDE.rationale.md` | scanned; reported the bad token  | checked; reported the bad script |
| `CLAUDE.rationale.md` (repo root)             | not scanned; reported no failure | not checked; reported no failure |

The scan counts moved with it on that date. `reference-check` scanned 422 files with the
sidecar in `articles/` and 421 with it at the root; `agent-doc-check` read 33 doc files
against 32.

The mechanism was in each checker's own scope module, as of that measurement.
`reference-check`'s `scan-scope.ts` took `CLAUDE.md` and `README.md` by exact name plus every
`.md` under `.claude/`; `agent-doc-check`'s `run.ts` globs `.claude/**/*.md` plus `CLAUDE.md`,
still current. A third root-level `.md` was outside both. So the root placement would have
passed every gate **by being invisible to all of them** — an unchecked file dense with
filename tokens and `npm run` references is the drift object those two checkers exist to
catch. `reference-check-reach` later widened `scan-scope.ts`'s doc surface to every tracked
`.md` outside `ideas/**`, which reaches a root-level `.md` too; this comparison is a snapshot
of the state on the date measured, not a claim about the checker's scope today.

Auto-load is a non-discriminator. Neither location is auto-loaded, so it separates nothing
and the decision does not rest on it.

Vale is a non-discriminator too. `.vale.ini`'s final `[**/*.rationale.md]` section reaches
both, so this file is exempt from every rule either way, the same as the article sidecars
beside it.

Two consequences the choice itself required, both landed in `CLAUDE.md`: branch 5 records
this as its second placement exception, and the documentation map carries the pointer line.

## Documentation map

### Branch 1's own correction

Branch 1 used to read "it has no other instruction surface", which
`document-the-orchestrating-seat` made false by giving the orchestrating seat one.

### Branch 5's roughly-1 KB floor

A pair's own framing measures 1.0-1.4 KB across the three landed role pairs. Measured across
the five role files plus `orchestration.md`: three earned a sidecar and three did not.

### Branch 5's pair-consistency audit

Measured on the first pair: six editing passes on the article dropped fifteen illustrations
out of the pair entirely rather than moving them across.

## Custom quality tooling in `scripts/`

### `agent-doc-check` check 2 — why the frontmatter reader is bespoke

Measured to fail exactly this way on 2 of the 5 agent files as they stood when the check was
written: a real YAML parser reads the literal `": "` inside those descriptions as a nested
mapping and refuses the file.

### `agent-doc-check` check 3 — the generic scan that was rejected

The generic "role-shaped token" form was tried and rejected, for flagging six unrelated
backticked identifiers to two real hits against this repo's own docs.

## Idea board

### Why promotion is a move-only commit

Measured here: a move plus a substantial rewrite in one commit is recorded as
delete-plus-add rather than a rename. `git log --follow` then loses everything before the
move, even at `-M10%`. Moved by itself the same change scores `R100` and the history
survives.

## Subagent pipeline

### The write boundary was once expressed as a tool allowlist

The boundary used to be expressed by withholding `LSP` from the then-`specifier` role, which
touched no TypeScript at all. After the merge that created `product` the framing would have
been dishonest in both directions: `product` writes real TypeScript, and withholding a
reading tool would only have made its tests worse without narrowing its reach.

## Conventions

### The sentence-case roster has carried a false universal twice

It long claimed "every name this app ships follows it" while omitting `Appearance`
outright, and while `Next Generation` shipped in title case.
`sentence-case-the-next-generation-button` renamed the button, and `hardener` found the
omission.

## Routing branches answer topic, never register — ruled 2026-09-10

**Ruled by the user, in three steps on one day.** An instruction file carries instructions and its
`.rationale.md` sidecar carries the explanation. That rule is itself an instruction about writing
prose, so it lives in `prose.md` rather than here. And these branches acknowledge that the
pairs exist, as index work, while deferring every routing instruction between a file and its sidecar
to that article.

**What moved out of branch 5**: the evidence kinds, "does this constrain an action" as a per-sentence
method, the exempt classes, kind-before-mass, the ~1 KB floor, "argument never moves at any size", and
the hand-audit obligation. All of it is now stated once, in `prose.md` under "Instruction
stays. Explanation moves."

**What stayed, and the test that kept it.** A branch stays here when it answers **which file**, and
goes when it answers **which half of a pair**.

- **Where a sidecar physically sits** stayed. The role-file placement into `articles/` is forced by
  `agent-doc-check`'s path glob, and `CLAUDE.rationale.md`'s by `reference-check`'s and
  `agent-doc-check`'s. That is a predicate a checker reads, which is branch 1's own reservation for
  this file.
- **Branch 4's module carve-out** stayed. "Is this passage about `scrollbars.ts`, or about
  `architecture.md`'s rule?" is a subject question, and it is settled before register arises.
- **Branch 4's register half went.** `<module>.md` against `<module>.rationale.md` is the same
  instruction-against-explanation cut under different filenames, so `prose.md` states it.

**The precedent this follows** is branch 4 against `doc-comments.md`. That branch already routes module
depth to a sidecar pair while `doc-comments.md` rule 7 says what may sit in a hover. The article tier
now works the same way.

**"Argument never moves at any size" was corrected rather than moved.** Read as written it licensed
keeping any justification, which is what the ruling rejects. The corrected form distinguishes a passage
that constrains conduct, which never moves, from one that only says why a rule is shaped as it is,
which never stays.

**The sidecar index above is hand-maintained and nothing checks it.** A cheap extension to
`agent-doc-check` would glob `*.rationale.md` under `.claude/agents/articles/` and compare it against
the list. It is not built, and a wrong list fails safe: a reader looks and finds the file anyway.
