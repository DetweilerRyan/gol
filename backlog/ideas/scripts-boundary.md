---
name: scripts-boundary
title: The scripts/ boundary — the epic over encapsulation, the mutation verdict, and what each depends on
created: 2026-09-12
---

## Situation

Two candidates filed on 2026-09-12 turn out to be one question asked from opposite ends:

- **`mutation-invariance-should-name-which-runner-to-run`** — the invariance gate reports a boolean for
  one of two mutation runners. It should say which runner a diff needs.
- **`scripts-as-deep-modules-with-gherkin-interfaces`** — each `scripts/` program should be a deep
  module whose interface is described by a Gherkin feature rather than by its exports.

They were raised an hour apart and filed separately, which is right — their arguments differ and
either could land alone. But **both are blocked on the same unmeasured fact**, and doing them in the
wrong order does avoidable work.

## Complication

**The shared blocker is what `scripts/` reads outside its own tree.**

A per-runner mutation verdict needs a per-runner allowlist, because one list cannot answer two
questions whose soundness arguments differ. The `scripts/` list is only hard to write because
`scripts/` is coupled to trees it does not own. **If that coupling is smaller than recorded, the
`scripts/` allowlist is nearly trivial and the verdict entry shrinks to reporting which trees a diff
touches.**

The audit lives in `mutation-invariance-should-name-which-runner-to-run` and is partly done. What it
found on 2026-09-12:

- **One ES import crosses the boundary** — `halstead4ts/run.ts` reading `crap4ts.config.ts`, so it
  resolves those globs rather than restating them.
- **One test reads the real repo** — `mutation-invariance/run.test.ts`, `REPO_ROOT` in five places.
- **Five other candidates build temp fixtures instead.**

**And one recorded claim looks stale.** `mutation-invariance.config.json`'s `scope` field says
`test:mutation:scripts` "reads `features/**` from the live tree in its own tests". The audit did not
find a test doing that. **Settle that before either slice starts** — it is one grep, and it decides
how large both of them are.

## Question

In what order do these land, and what does each one owe the other?

## Answer — the audit first, then either, and they are not sequential after that

**1. Finish the encapsulation audit.** It is the prerequisite for both and it is small. Confirm or
refute the `features/**` claim, and decide the two live couplings: whether
`mutation-invariance/run.test.ts` can use a temp git repo the way five siblings do, and whether
`halstead4ts`'s config import stays with a recorded reason. **A mechanical guard is the durable half**
— an `ast-grep` rule for a `scripts/` file importing outside `scripts/`, with a named exemption,
keeps the result rather than leaving it to notice.

**2. Then either, in either order.** Once the coupling is known:

- The **verdict** entry becomes a scoping question rather than a soundness one. If `scripts/` is
  encapsulated, its allowlist is `scripts/**` and nothing else, and the checker can name runners
  without a schema change.
- The **deep-module** entry becomes answerable on its own terms, since its pilot no longer has to
  reason about what the program reaches outside itself.

**3. The deep-module entry has a second blocker the verdict entry does not**, and it is a user
ruling rather than a measurement. `features/**` is `product`'s entire manifest, and the Gherkin layer
is browser-bound by construction — `bddgen` compiles to Playwright specs against a dev server. A CLI
feature needs a second home or a widened manifest, and the first is a role-scope change. **Do not
start the pilot's Gherkin half until that is ruled.** Its encapsulation half is unblocked either way.

## What this epic does not claim

**That either entry is worth doing.** Both carry open questions that could close them. The verdict
entry's cheaper alternative — report which trees a diff touches, leave the verdict alone — may be most
of the value. The deep-module entry's first step is explicitly written to refute itself cheaply: write
the feature as prose, and if it restates the unit tests, close it.

**That the coupling should be removed.** The audit says what exists; whether to remove it is a
judgement each coupling gets separately. `halstead4ts`'s config import exists to prevent a
duplication, and removing it would restore that duplication.

## Touches

`scripts/**` and its two Stryker configs, `mutation-invariance.config.json` and its schema,
`.claude/agents/articles/mutation-testing.meta.md` for check C4's arguments, and — only if the
Gherkin half proceeds — `features/**`, `playwright.config.ts`, and `product`'s manifest boundary.

## Open questions

- **Is this an epic or a note?** Two entries and one shared blocker is thin for a lane of its own.
  `ideas/` is two lanes by design and an epic is neither; this sits in `candidates/` as an index
  rather than as work, the same way `effective-prose.md` does.
- **Does the `scripts/` tree want its own article?** `CLAUDE.md` carries the layout rule and
  `engineering.md` carries the substitution table. If the encapsulation rule lands with a mechanical
  guard, that is a third place, and three is where a topic article usually earns its name.
