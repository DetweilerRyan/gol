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

The scan counts moved with it on that date: 422 files scanned from `articles/` against 421
from the root, and 32 doc files against 32.

The mechanism is in each checker's own scope module. `reference-check`'s `scan-scope.ts`
takes `CLAUDE.md` and `README.md` by exact name plus every `.md` under `.claude/`;
`agent-doc-check`'s `run.ts` globs `.claude/**/*.md` plus `CLAUDE.md`. A third root-level
`.md` is outside both. So the root placement would have passed every gate **by being
invisible to all of them** — an unchecked file dense with filename tokens and `npm run`
references is the drift object those two checkers exist to catch.

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
