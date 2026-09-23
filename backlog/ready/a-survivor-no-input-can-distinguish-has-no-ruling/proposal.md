---
name: a-survivor-no-input-can-distinguish-has-no-ruling
title: Give a role a way to close a mutation survivor the type system already forbids
created: 2026-09-22
kind: enabler-process
---

## Situation

`.claude/agents/articles/mutation-testing.md` gives `architect` the ruling on whether a survivor is equivalent,
and requires naming the input or state at which the two programs would differ before that ruling is granted.
Anyone else who believes a survivor is equivalent reports it rather than closing the question. A survivor ruled
equivalent carries a one-or-two-line argument at its own site.

`slice/type-impossible-mutants-read-as-survivors` measured, 2026-09-22, that 11 of the 61 survivors across both
stryker configs are forbidden by the type system — 6 of 23 on `src/`, 5 of 38 on `scripts/`. Its record sits in
`backlog/done/type-impossible-mutants-read-as-survivors/`.

That spike also measured a case the TypeScript checker does not catch. Replacing `!boundsDirty` with `false` in
`liveCellStore.ts` fails the repo's own build with TS6133, and compiles under the three compiler options the
checker relaxes, so it survives the checker by construction.

## Complication

Neither the article nor its sidecar mentions this class. A role meeting one of these survivors is asked for an
input at which the programs differ, and none exists, because no caller can reach the mutated state. The
argument that closes it is a type error rather than a semantic identity, and the article has no shape for
stating one.

So the investigation cannot conclude on the article's own terms. The role either gives up without a record, or
records an equivalence argument that is not the argument it actually has.

Adopting the checker removes the 11 standing today but not the class. The TS6133 case shows a survivor the
repo's build rejects and the checker accepts, so this need outlives that change and is the only one of the two
that delivers on its own.

## Question

What may a role state to close a survivor the type system forbids, and who rules it?

## Answer

Shaped, not specified. A closing form for this class, sitting beside the equivalence rule rather than inside
it, since the argument has a different shape and a different evidence standard.

`architect` recommended on 2026-09-22 that such an argument be made against the repo's own compiler
configuration rather than the checker's relaxed one, on the TS6133 case. Nothing has ruled that.

## No-gos

Does not wire the checker into either stryker config. That is the sibling technical enabler,
`the-mutation-gate-scores-programs-that-cannot-exist`, promoted the same day. Both land on one branch,
`make-the-mutation-gate-type-aware`, and merge together — ruled by the user on 2026-09-22. The split is about
which pipeline runs, not about when either ships: an article may only be edited by `writer` under a signed
`coach` spec, so no single item can carry both diffs.

Does not carry its own acceptance reading. The assessment scored Testable 2 on exactly that and ruled it
non-blocking, since `.claude/references/pipelines.md` states the enabler-process acceptance. **`coach` SPEC
owes the check and both its readings**, rather than inheriting them from this file.

Does not revisit the equivalence rule itself, which is doing its job — this class is what it declines to cover.

## Open questions

- Where does the form live: the article's survivor section, or `mutation-testing.meta.md`, which holds its
  evidence? The parent spike left this open deliberately.
- Must the argument be made against the repo's own compiler config rather than the checker's relaxed one?
- Is the ruling `architect`'s, as equivalence is, or may any role close one once the check is mechanical
  enough to reproduce?
- What does the site comment say, given the convention for an equivalent survivor is to name the mutation and
  why no input distinguishes it — which is exactly the sentence that cannot be written here?
- Does a `CompileError` whose only type error sits inside a test file need its own entry? The parent measured
  one in 201 samples, and its verdict is faithful while saying something about the tree rather than about the
  production program.
