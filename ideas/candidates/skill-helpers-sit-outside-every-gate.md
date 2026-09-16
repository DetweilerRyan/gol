---
name: skill-helpers-sit-outside-every-gate
title: Move the skill shell helpers into gated TypeScript
created: 2026-09-16
---

## Situation

Two small shell scripts live inside skill directories as of 2026-09-16: the board's Layer 1
check and the write-time prose hook. Both carry real logic — era detection, hook-JSON
extraction, the repo-root relativization that fixed a measured false clean — and the Definition
of Ready states their cost honestly: a shell file in a skill directory is reached by no test, no
CRAP threshold, and no mutation run, and one past its size budget has become a `scripts/`
program that should move.

## Complication

The honesty line has come due. The scripts hold hazard fixes nothing pins — the absolute-path
false clean could regress silently — their header comments are a prose surface `reference-check`
never reads (found by `hardener` 2026-09-15), and the repo already ruled once that a shell
runner in a TypeScript project is untestable debt: the prose-lint runner was converted for
exactly this reason, and the slice tag records it.

## Question

Where do a skill's executable helpers live so that the gates that police every other program
reach them?

## Answer

Direction chosen by the user, 2026-09-16: move both scripts into the standard scripts location
for skills, then convert them to TypeScript. Shaped, not specified — the conversion follows the
prose-lint runner's precedent, and the callers (one injection line, four hook handlers) follow
the new invocation form.

## Open questions

- "The standard scripts folder" has two readings, and the gates only reach one: the repo's
  gated `scripts/` project, or the skills convention of a scripts subfolder inside each skill
  directory — which vitest's `.claude/**` exclusion leaves exactly as untested as today.
  Settle the reading before the design pass.
- What does a hook pay for `tsx` startup on every matching write, against the shell's
  near-zero? Measure before converting the hook half.
- Do the two scripts become one program with two entry modes, or two programs — and does the
  shared hook-JSON extraction become the `scripts/` root module the layout rule asks for?
- The full `scripts/` gate tax applies on arrival: CRAP, dry4ts, mutation, vitest. Sized as one
  slice or two?
