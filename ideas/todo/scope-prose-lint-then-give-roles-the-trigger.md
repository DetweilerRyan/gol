---
name: scope-prose-lint-then-give-roles-the-trigger
title: Give prose-lint a path scope, then a role trigger — the no-role-edits law is what makes that clean
created: 2026-09-12
---

## Situation

**Ruled by the user on 2026-09-12.** `prose-lint` gets a role trigger for the roles that write JSDoc
and module sidecars, **after** the runner accepts a path scope.

This closes the last of the three foundation facts `effective-prose.md` named. The other two —
the runner reaching the gates, and the checker reaching `vale-styles/` — landed on 2026-09-11.

**The no-role-edits law changed the answer.** Before it, running `prose-lint` risked a role acting on
a `.claude/**` finding it had no business touching, and that ambiguity was a real argument against the
trigger. The law removed it: a role can now dirty only JSDoc and module sidecars, so **a finding a
role can see is a finding it owns.**

Measured 2026-09-12:

| Surface                                       | Tracked files   | Writable by                     |
| --------------------------------------------- | --------------- | ------------------------------- |
| `*.{ts,tsx}` JSDoc and `src/**/*.md` sidecars | 195             | `coder`, `cleaner`, `architect` |
| `.claude/**` and `CLAUDE.md`                  | the rest of 433 | the orchestrating session alone |

## Complication

**The runner cannot express the scope.** `scripts/prose-lint/run.ts` reads no argv and lints every
tracked `.md`, `.ts` and `.tsx` — 433 files. A role running it today reads ~238 findings in files it
may not edit.

**That is worse than no trigger.** A report-only tool survives on the reader acting on its output. A
tool that reports mostly-unactionable findings teaches the reader to skim it, and the skim is what
lets a real finding through. The tool's own article already names the confident-zero failure; this is
its mirror.

## Question

What is the smallest scoping change that lets a role run `prose-lint` over its own slice?

## Sketch

### 1. The scope, and it is a `scripts/` change

Accept a path or a pathspec and pass it through to the existing `git ls-files` call. The file list is
already built by `lint-targets.ts`'s `LINT_PATHSPECS`, so the change is at the seam rather than
through the program.

**Route argv through `node:util`'s `parseArgs` in strict mode**, matching every other `scripts/`
program that takes options. That also closes
`ideas/candidates/prose-lint-silently-ignores-its-arguments.md`, which records that the runner today
accepts and discards any argument — so `npm run prose-lint -- src/cache.ts` runs a full pass and
reports success. **Land the two together**; they are one edit to one seam.

**Keep the trailing count line honest under a scope.** It is what distinguishes a measured zero from a
run that linted nothing, and a scoped run that matches no file must fail rather than report zero — the
same rule the unscoped empty-list branch already follows.

### 2. Then the trigger, one line per role

`coder`, `cleaner` and `architect` write JSDoc and module sidecars. `product` writes
`features/steps/*.ts`, which the JSDoc rules do not reach today — decide whether it gets the trigger
or an explicit note that it does not.

**Word the trigger as a precondition, not a position**: run it when the slice touched a JSDoc block or
a module sidecar.

### 3. What this deliberately does not do

**No `hardener` stage.** Three of the six enabled rules are prompts needing judgement, so the tool
cannot gate on findings, and a non-gating stage inside a gating sequence is the shape `hardener.md`
warns about elsewhere. It would also catch prose after handoff, when the author who wrote it is gone.

**Nothing for the orchestrating session's own surface.** That half is unresolved and is filed
separately — see the Open questions.

## Touches

- `scripts/prose-lint/` — `run.ts`, `lint-targets.ts`, and their tests. A `scripts/` program, so CRAP
  <= 6, `test:scripts`, `dry4ts:scripts` and `test:mutation:scripts` all apply, and the mutation gate
  re-arms by construction.
- `.claude/agents/coder.md`, `cleaner.md`, `architect.md` — one trigger line each.
- `ideas/candidates/prose-lint-silently-ignores-its-arguments.md` — closed by the same change.

## Open questions

- **Does `product` get the trigger?** It writes `features/steps/*.ts`, and `.vale.ini`'s
  `[*.{ts,tsx}]` section does reach those files. Check whether the `JsDoc` rules fire there before
  deciding; the answer is a measurement, not a judgement.
- **What scopes a role's run in practice?** The changed-files manifest is the obvious input, and
  `cleaner` already works from one. A role that has to name paths by hand will get it wrong.
- **The orchestrating session's own half is untouched by this.** That seat is now the only writer of
  `.claude/**` and `CLAUDE.md`, and `orchestrator-prose-has-no-reviewer` says that surface has no
  reviewer upstream of `hardener`. A trigger for the roles does nothing for it. **Worth stating that
  the 2026-09-11 session introduced six defects in that surface that Vale could not have caught** — a
  contradiction left by its own law, a block moved into a file only one mode reads, a lost read
  trigger, two orphaned fragments, and an instruction deleted while being enforced. The lever there is
  review, not linting.
