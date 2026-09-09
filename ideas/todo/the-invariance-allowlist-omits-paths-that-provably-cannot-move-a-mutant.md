---
name: the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant
title: Add rules/ and rule-tests/ to the mutation-invariant allowlist, on a soundness argument rather than case by case
created: 2026-09-06
---

## Context

`CLAUDE.md`'s mutation-invariant merge exemption is an allowlist —
`features/** ideas/** .claude/** CLAUDE.md README.md` — and the direction is
deliberate and correct: a blocklist fails **open**, because a path nobody
thought to list silently skips the mutation gate and a skipped run reads
exactly like a passing one.

`jsdoc-standing-rule` landed a diff of ten paths: five `.claude/**` files,
`CLAUDE.md`, one `ideas/` deletion, and **`rules/no-dead-doc-on-annotated-return-literal.yml`
plus its fixture and snapshot under `rule-tests/`**. Those last three are not on
the allowlist, so the predicate failed and the protocol called for two full
mutation runs — roughly twelve minutes — to re-measure a score that provably
could not move.

The soundness argument, which `hardener` verified rather than assumed when the
skip was handed to it:

1. `stryker.config.json`'s `mutate` is `src/**` only, and the diff touched no
   `src/` or `scripts/` file at all.
2. `rules/*.yml` and `rule-tests/*.yml` are YAML. Vitest's include is
   `**/*.{test,spec}.?(c|m)[jt]s?(x)`, so a fixture named `<id>-test.yml` is
   **not** collectible as a test. This matters specifically because
   `mutation-testing.md` records that probes dropped into `rules/` and
   `rule-tests/` _are_ copied into the sandbox by the unrooted-include hole —
   copied is not collected.
3. No test reads the live `rules/` directory. `scripts/ast-grep-rule-check/`'s
   unit tests use synthetic in-memory fixtures, and `agent-doc-check`'s build a
   `mkdtempSync` temp repo per case. The only real-filesystem reads in
   `scripts/` tests are against `features/`.

So neither mutation scope has an input that moved — the same shape of argument
`vite.config.ts`'s `sharedExclude` already supplies for `ideas/` and
`.claude/`.

**The cost of leaving it is not the twelve minutes.** It is that the gap gets
closed verbally instead. This slice's exemption was handed down as a one-off
instruction in an invoking prompt, which is exactly the mechanism `CLAUDE.md`
warns about when it says the two errors are asymmetric: wrongly granting is
silent and permanent, wrongly refusing costs one run. A reasoned-about-in-the-
moment exemption is a blocklist wearing an allowlist's clothes.

**Second measured instance, `oxlint-native-jsdoc-tier`, 2026-09-07.** A four-path diff —
`CLAUDE.md`, two `.claude/agents/articles/*.md`, and **`.oxlintrc.json`** — with **zero TypeScript
changed**. Three of the four are allowlisted; the fourth disqualified the diff, so
`npm run test:mutation:full` ran for **9m58s** to produce 98.65% over 1,706 mutants, every one of
them byte-identical to `main`'s because no mutated file was touched. `hardener` said so in its own
report: "the 23 survivors are `main`'s, by construction, not this slice's."

A lint config is sound on the same three-point argument as `rules/**`: Stryker's `mutate` list is
`src/**` so it is never mutated; no vitest project reads it, so it cannot change which tests exist
to kill anything; and while it _is_ copied into the sandbox, nothing there consults it. **That is
now two slices in two days paying a full mutation run for a provably unmoved score**, which is the
frequency argument the first instance could not make alone.

Note the shape both instances share, because it is what a future entry should be tested against:
each is a **gate's own configuration**. `rules/*.yml` configures ast-grep, `.oxlintrc.json`
configures oxlint. Neither tool runs inside Stryker's sandbox at all. That may be a cleaner
predicate than enumerating paths one at a time — though it cuts against the "one soundness argument
at a time" preference in the open questions below, and `stryker.config.json` is the obvious
counterexample that must stay absent.

## Sketch

Add `rules/**` and `rule-tests/**` to the predicate in `CLAUDE.md`'s
"Mutation-invariant merges" clause, and record the three-point argument above
alongside it — the point being that a path earns its place by a stated
soundness argument, not by seeming harmless.

While there: `CLAUDE.md` already names `stryker.config.json`, `vite.config.ts`,
`vitest.*.config.ts`, `package.json`, `tsconfig*.json` and `patches/**` as
deliberately **absent**, and the reasoning for each is that touching them
re-arms the run. `sgconfig.yml` is currently neither listed nor allowlisted,
and it is the file that decides which directories `rules/` even means — worth
naming explicitly in the absent list so the omission is a decision rather than
an oversight.

## Touches

`CLAUDE.md`'s merge-protocol section only, plus possibly a sentence in
`.claude/agents/articles/mutation-testing.md` if the argument belongs nearer
the tool. No code.

## Open questions

- **Is a third path worth adding at the same time, or does batching weaken the
  discipline?** Adding paths one soundness argument at a time is slower but
  keeps each entry defensible; adding several at once invites a shared
  hand-wave. Probably one at a time, but say so.
- **Should the clause require the argument, not just the path?** The current
  text explains the allowlist's _direction_ well but does not oblige a future
  editor to state why a new entry is sound. A one-line requirement would make
  the next addition reviewable.
- **`rule-tests/__snapshots__/`** is a third directory in practice. It is under
  `rule-tests/`, so a `rule-tests/**` glob covers it — but `ast-grep`'s own
  snapshot handling is special-cased in `scripts/ast-grep-rule-check/`, so it
  is worth confirming rather than assuming that nothing reads it at test time.
- **Does this generalise to a rule rather than a list?** "Any path Stryker
  neither mutates nor collects as a test" is the actual invariant, and a
  checker could compute it. That would be a `scripts/` program, with the CRAP
  and mutation obligations that implies — likely more machinery than the
  problem deserves, but it is the version that cannot rot.
