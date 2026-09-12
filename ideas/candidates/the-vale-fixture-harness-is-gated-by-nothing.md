---
name: the-vale-fixture-harness-is-gated-by-nothing
title: Gate the Vale fixture harness the way ast-grep:rules gates rule-tests/
created: 2026-09-12
---

## Context

`vale-styles/fixtures/` holds a `<Rule>.bad.<ext>` / `<Rule>.good.<ext>` pair for
every rule in the `JsDoc` and `Instruction` styles, plus `fixtures.vale.ini` to
run them. Measured 2026-09-12: the three `Instruction` good fixtures report
`0 errors, 0 warnings and 0 suggestions in 3 files`. The harness works.

Nothing runs it. `package.json` carries one prose script, `prose-lint`, which
lints the tracked tree rather than the fixtures. `grep -rn fixtures
scripts/prose-lint/ package.json` returns nothing.

`fixtures.vale.ini`'s own header makes the argument and then names the gate it
does not have: "A rule that matches nothing reports nothing and is
indistinguishable from a clean codebase, so the bad fixture is what proves the
rule works -- the same reasoning `ast-grep`'s `rule-tests/` carries, and the
reason `npm run ast-grep:rules` gates on a missing fixture."

So the two structural-rule surfaces are asymmetric. `rules/*.yml` has eight
binary facts checked by a gate. `vale-styles/**` has the same practice, run by
hand.

This is one of `prose.md`'s "ways a run reports a confident zero", on the rule
side rather than the corpus side.

The external precedent is [`tbhb/vale-ai-tells`](https://github.com/tbhb/vale-ai-tells),
which carries a `test-false-positives.md` negative corpus for the same reason.

**Read this against `tengo-rules-for-the-three-prompts`.** A Tengo script's
characteristic failure is the silent zero. A Tengo string literal consumes one
backslash level, so `\s` becomes a literal `s` and the rule reports clean. That
bug was hit while prototyping this session. Landing Tengo rules multiplies what
an unrun harness costs.

## Sketch — ratified by `architect` in DESIGN mode, 2026-09-12

A `scripts/vale-fixture-check/` program, gating, on the `ast-grep-rule-check` shape: pure `decide()`
over parsed input, I/O isolated to `run.ts`.

**Five binary facts**, not the four this file first proposed:

1. Every rule in a tracked style has a `.bad`/`.good` pair, for every extension its own `scope:` claims.
2. Every `.good` fixture reports zero findings.
3. Every `.bad` fixture reports its own rule, by name, at least once.
4. At least one rule was found at all — reuse `gate-report.ts`'s `checkNonEmpty`, do not reimplement.
5. Every tracked style is named in `fixtures.vale.ini`'s `BasedOnStyles` for each extension its rules
   claim. `Procedure` was wired in by hand this session; a style nobody wires up passes every other
   check by being invisible to them.

**Scope is the tracked styles only** — `JsDoc`, `Instruction`, `Procedure`. `.vale/`'s downloaded
`STE` package is out: we do not own its correctness.

**It gates, and it is `architect`'s, not a ninth `hardener` stage.** Same split as `ast-grep:rules`:
report-only tooling stays separate from the binary-fact checker policing its fixtures. `hardener`'s
eight stages are whole-tree and run every slice; a Vale stage would tax every slice whether or not
`vale-styles/` moved. The trigger belongs in `architect.md`'s Verification section — run it whenever
anything under `vale-styles/` changes. **`hardener`'s stage count is unaffected.**

**`vale-probe.ts` moves to `scripts/` root** with its test. Two programs need it now, which is exactly
the layout rule's "shared by two or more programs" test.

### What this gate cannot do, and no heuristic should pretend otherwise

**A `.good` fixture reporting zero proves only that the text is clean. It does not prove the fixture
discriminates.** Checking that `ProcedureLength.good.md`'s bullet is 23 words — long enough to trip
the rule if the marker were not the real discriminator — requires knowing what that rule turns on. A
generic checker cannot know that.

`architect` ruled against closing this with a heuristic such as word-overlap with the `.bad` fixture:
it would reject legitimate fixtures, and a false rejection is worse than an honest gap. **The
near-miss judgement stays at `architect` REVIEW time**, and the checker's own header says so.

**The same gap already exists in `ast-grep-rule-check` and is accepted.** Verified 2026-09-12: its
check 5 is `fixture-has-invalid-cases`, and nothing inspects the `valid:` side at all — neither that
it exists nor that it is a genuine near-miss. So this is a pre-existing asymmetry the Vale gate
inherits, not one it introduces.

## Ordering

1. Move `vale-probe.ts` and its test to `scripts/` root; fix the one import; `npm run test:scripts`.
   Run `npm run ast-grep:rules` after, in case a `files:` glob names the old path.
2. Add the pure `decide()` layer and its tests, checks 1–4 only.
3. Add check 5 as its own pure function, tested against a deliberately-missing-style fixture.
4. Wire `run.ts` and the `package.json` script. Confirm it gates — nonzero on a deliberately broken
   fixture, which is the only proof it is not inert.
5. `architect` authors `fixtures.vale.ini`'s header correction, under the ownership ruling.

## Touches

- `scripts/vale-fixture-check/` (new), `scripts/vale-probe.ts` (moved), `package.json`
- `vale-styles/fixtures/fixtures.vale.ini` — `architect`'s to write
- `CLAUDE.md` Commands list, and `architect.md`'s Verification trigger — the orchestrating session's

## Open questions

- Nothing blocking. The design is ratified and the one unmechanisable check is documented rather
  than faked.
- `scripts/prose-lint/` is a TypeScript program already, so the shell-runner concern this file
  first raised does not apply to the new program.
