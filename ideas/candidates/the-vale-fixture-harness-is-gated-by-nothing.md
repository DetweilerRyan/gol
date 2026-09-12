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

## Sketch

A `scripts/vale-fixture-check/` program, gating, on the `ast-grep-rule-check`
shape: pure `decide()` over parsed input, I/O isolated to `run.ts`.

Binary facts to check:

- every rule file in a tracked style has a `.bad` and a `.good` fixture, for
  every extension its own `scope:` claims
- every `.good` fixture reports zero findings
- every `.bad` fixture reports its own rule, by name, at least once
- at least one rule was found at all (the inertness guard `gate-report.ts`'s
  `checkNonEmpty` already provides)

Whether it becomes a `hardener` stage or stays an orchestrator-run check is a
separate ruling. `prose-lint` itself does not gate.

## Touches

- `scripts/vale-fixture-check/` (new), `package.json`
- `vale-styles/fixtures/fixtures.vale.ini` — its header would stop naming a gate
  it lacks
- `.claude/agents/articles/prose.md` — the confident-zero list
- `scripts/prose-lint/` is a `.sh` and reaches none of `test:scripts`,
  `crap4ts:scripts`, `dry4ts:scripts`. A new TypeScript program beside it does.
  See `ideas/candidates/prose-lint-runner-is-shell-not-typescript.md`.

## Open questions

- Does it gate, and at which `hardener` stage? `ast-grep:rules` is `architect`'s
  and gates; `prose-lint` never fails on a finding.
- Vale is a Go binary rather than an npm dependency, so a machine without it
  lints nothing. A gate must fail rather than pass when `vale` is absent —
  `scripts/prose-lint/vale-probe.ts` already solves exactly this and should be
  shared rather than reimplemented.
- Does it cover `.vale/`'s downloaded packages, or tracked styles only? Tracked
  only, presumably: we do not own `STE`.
