---
name: the-invariance-predicate-does-not-say-which-mutation-run-it-covers
title: Rule on whether features/** is mutation-invariant under the scripts/ Stryker run
created: 2026-09-08
---

## Context

Raised by `architect`'s cold read of
`the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`,
which recorded the caveat in `CLAUDE.md` rather than ruling on it — the
question is older than that slice and outside what it argued for.

There are two mutation runs, and the merge-protocol exemption was written as
though there were one:

- `npm run test:mutation` reads `stryker.config.json`, whose `mutate` is
  `src/**` and whose `ignorePatterns` is `["/features"]`.
- `npm run test:mutation:scripts` reads `stryker.scripts.config.json`, whose
  `mutate` is `scripts/**` and which carries **no `ignorePatterns` at all**.

So `features/` **is** copied into the `scripts/` sandbox. And two `scripts/`
tests read `features/*.feature` from the live tree rather than from a fixture
— `scripts/acceptance-mutation/examples-cell-sites.test.ts` and
`scripts/gherkin-dry-checker/step-parser.test.ts`. A `features/**`-only diff
can therefore change a `scripts/` test's outcome, and a changed test outcome
is a changed mutant fate.

`features/**` has been on the mutation-invariant allowlist since that clause
was written. Under the `src/` run it is sound, by `ignorePatterns`. Under the
`scripts/` run nobody has argued it.

Whether this is live depends on a second unruled question: **merge-protocol
step 5 says to invoke `hardener` on `main` "with the whole tree as its scope"**,
and the protocol's own `rm -f` paragraph discusses `test:mutation:scripts`
explicitly — so the whole-tree gate plausibly includes it, while
`hardener.md`'s stage 5 and the exemption's own `mutate`/`ignorePatterns`
argument both read as the `src/` run alone.

`hardener.md` also records the failure mode that makes this worth closing
rather than noting: a red `scripts/` unit test does not merely fail its own
gate, it **aborts** the `scripts/` mutation run at the dry run, so the score
is not low — it does not exist.

## Sketch

Rule on the scope question first, since it decides whether anything else is
needed:

1. If stage 5 means the `src/` run only, say so in `CLAUDE.md` and in
   `hardener.md`'s stage 5, and the allowlist is already correct.
2. If the whole-tree gate includes the `scripts/` run, then either add
   `ignorePatterns: ["/features"]` to `stryker.scripts.config.json` (which
   makes `features/**` sound the same way it is sound for `src/`, at the cost
   of removing the two live-tree reads from that sandbox — check what that
   does to those two tests first), or drop `features/**` from the allowlist.

## Touches

`CLAUDE.md`'s merge protocol, `.claude/agents/hardener.md`'s stage 5,
possibly `stryker.scripts.config.json`. No `src/` change either way.

## Open questions

- **Which run does the merge gate mean?** This is the whole question; the
  rest follows.
- **Would `ignorePatterns` on the scripts config break the two live-tree
  readers?** They read `features/*.feature` from within the sandbox during a
  mutation run. If the directory is not copied, those tests fail inside
  Stryker while passing under `npm run test:scripts` — which is the
  aborts-the-dry-run failure mode, so this needs measuring rather than
  assuming.
- **Is a live-tree read in a `scripts/` test the real defect?** Both readers
  exist to assert against whatever `product` actually wrote, which is
  deliberate. Converting them to fixtures would remove the coupling and lose
  that property.
