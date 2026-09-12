---
name: mutation-invariance-should-name-which-runner-to-run
title: Make the invariance gate report which mutation runner a diff needs, not a boolean
created: 2026-09-12
---

## Situation

**Raised by the user on 2026-09-12**, after a `scripts/`-only slice hit exit 2 and the right answer —
run `test:mutation:scripts`, skip `test:mutation` — had to be reasoned out by hand.

`npm run mutation-invariance -- --diff <range>` answers one question: is this diff invariant for
`npm run test:mutation`, the `src/`-scoped run. Exit 0 invariant, 2 not, 1 no verdict. There are **two**
mutation runners, and the checker names neither.

On exit 2 it prints the first disqualifying path and the `absent[]` reason that covers it. A reader
seeing `scripts/prose-lint/lint-targets.test.ts` still has to know that `stryker.config.json`'s
`mutate` is `src/**` to conclude the `src/` run can be skipped. **That inference was got wrong once in
the session that raised this**, which is the argument for computing it.

## Complication

**The obvious design is wrong in the fail-open direction, and the config already says why.**
`mutation-invariance.config.json`'s `scope` field: the predicate quantifies over the `src/` run,
"not `npm run test:mutation:scripts`, which carries no `ignorePatterns` at all and reads `features/**`
from the live tree in its own tests."

So the allowlist is sound for one runner and **not** for the other. A per-runner verdict computed from
the same `allow[]` would report `features/**` as invariant for both, when it is invariant only for
`src/`. That is a skipped gate reading as a pass — the exact failure the allowlist's
allowlist-not-blocklist direction exists to prevent.

**The second constraint is that the two tiers are not symmetric.** The `written-argument` tier is
restricted by `schemas/mutation-invariance.schema.json` to a **fixed filename** — no `/**` — precisely
because it is the one tier the checker cannot verify. An attempt to move `scripts/**` from `absent[]`
to `allow[]` under that tier was made on 2026-09-12 and correctly refused by the schema. **Do not
reach for that as the implementation.**

## Question

What does the checker have to know, beyond `allow[]`, to answer per runner?

## Sketch

**A per-runner verdict needs a per-runner allowlist**, and that is the work. One shared list cannot
answer two questions whose soundness arguments differ.

Shape, not ratified:

- **Read both `mutate` lists** rather than restating them. `stryker.config.json` resolves to `src/**`
  minus exclusions; `stryker.scripts.config.json` to `scripts/**` minus exclusions. Both are already
  machine-readable and the checker already reads the first.
- **Give `allow[]` a runner dimension.** An entry is argued invariant _for a named run_, not in
  general. `features/**` is invariant for `src/` and demonstrably not for `scripts/`.
- **Report what to run, not merely what failed.** `run test:mutation:scripts; test:mutation not
required` beats a first-disqualifying-path line, and it is the sentence a role or this seat acts on.
- **Keep the exit codes meaning what they mean.** 1 is still "no verdict was computed", and a reader
  must never read it as a pass. A richer stdout does not change that; the verdict stays in the exit
  code, for the reason the current design already records.

## Touches

`scripts/mutation-invariance/` — a gating checker, so CRAP <= 6, its own suite, `dry4ts:scripts` and
`test:mutation:scripts`. `mutation-invariance.config.json` and `schemas/mutation-invariance.schema.json`,
since the entry shape changes. `.claude/agents/articles/mutation-testing.meta.md`, whose check C4 binds
every entry to a written argument. CLAUDE.md's merge-protocol step 5, which states the current
one-runner contract.

## The prerequisite: audit what `scripts/` reads outside its own tree

**Directed by the user on 2026-09-12.** The cross-tree dependency is what makes a per-runner verdict
hard. If `scripts/` were fully encapsulated, the `scripts/` allowlist would be the trivial one —
`scripts/**` moves the `scripts/` score and nothing else does — and this whole entry shrinks to
reporting which trees a diff touches.

**So audit the coupling before designing around it.** Measured 2026-09-12, and the picture is narrower
than the config's warning implies:

- **One ES import crosses the boundary.** `scripts/halstead4ts/run.ts` imports `crap4ts.config.ts`
  from the repo root — deliberately, so it resolves crap4ts's globs rather than restating them. That
  is a config read, not a `src/` dependency.
- **`scripts/mutation-invariance/run.test.ts` reads the real repo** — `REPO_ROOT` in five places,
  running `runCheck` against the live tree and the live git history.
- **The other five live-tree candidates build temp fixtures instead**, via `mkdtempSync` and
  `scripts/test-support.ts`. `acceptance-mutation`'s discovery tests pass a temp `featuresDir` rather
  than the real one.

**That last finding matters most and needs confirming rather than assuming.**
`mutation-invariance.config.json`'s `scope` field says `test:mutation:scripts` "reads `features/**`
from the live tree in its own tests." The audit above did not find a test doing that — `feature-files.ts`
globs a directory it is handed, and its callers' tests hand it a temp one. **Either the claim is stale
or the audit missed a path.** Settle that first: the whole per-runner design rests on it, and if the
claim is stale the `scripts/` allowlist is far simpler than this entry assumes.

**Then consider removing the coupling rather than modelling it.** A `scripts/` program that reads only
its own tree and its explicit inputs is encapsulated, and an encapsulated tree has a decidable
allowlist. Two shapes to weigh:

- **`mutation-invariance/run.test.ts`'s live-tree reads.** They are testing the checker against real
  history, which is genuinely what it does — a temp git repo is what the other five use, and
  `reference-check/run.test.ts` already builds one. Whether that substitution loses the thing the test
  is for is the judgement.
- **`halstead4ts`'s config import.** Removing it means restating crap4ts's globs, which is the
  duplication the import exists to avoid. **Probably keep it and record why**; a config read at the
  root is not the same coupling as reading `src/` source.

**A mechanical guard is the durable half.** `rules/no-downward-import-in-scripts.yml` already encodes
part of the layering. An `ast-grep` rule for "a `scripts/` file imports from outside `scripts/`", with
a named exemption for the config read, would keep the encapsulation once it is established rather than
leaving it to notice.

## Open questions

- **Is a per-runner allowlist worth it, or is the honest fix a smaller one?** A cheaper version reports
  which runners the diff _touches_ — `src/` paths present, `scripts/` paths present — and leaves the
  verdict where it is. That is most of the value and needs no schema change. Measure how often a diff
  is genuinely one-sided before building the larger thing.
- **What does it print when a diff touches both?** Both runs required is the safe answer and the common
  case, so the output must not bury it under the interesting one-sided case.
- **Does `hardener` read this, or only the orchestrating session?** The merge protocol runs it, and
  `hardener` is handed the verdict in its prompt. A checker that names runners is more useful to
  whoever composes that prompt than to the role receiving it.

## Related

[[scripts-boundary]] is the epic over this entry and [[scripts-as-deep-modules-with-gherkin-interfaces]].
Both are blocked on the same encapsulation audit, which is recorded above. Read the epic before
sequencing this one.
