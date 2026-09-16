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

Direction chosen by the user, 2026-09-16: move both scripts into the scripts subfolder inside
each skill directory — the official skills-layout reading, ruled the same day — then convert
them to TypeScript. Shaped, not specified — the conversion follows the prose-lint runner's
precedent, and the callers (one injection line, four hook handlers) follow the new invocation
form.

**The runner is node directly, never tsx — measured 2026-09-16 on this machine.** Startup best
of three: sh 5ms, node 25ms, node running TypeScript via type stripping 44ms, npx tsx 338ms;
vale itself, the hook's real payload, 100ms, and the whole current sh hook 80ms. tsx would
quadruple the hook; node-run TypeScript adds an imperceptible ~40ms against the vale payload.
**Rust was asked about and declined on the same numbers:** it saves ~40ms over node-run
TypeScript on a vale-dominated path, and costs a toolchain the repo does not carry, per-platform
binaries, and a parallel quality stack for two small programs.

**The honest consequence of the in-skill reading, accepted rather than hidden:** no gate reaches
`.claude/skills/` in any language — vitest, both tsconfig projects, CRAP and mutation all stop
at that boundary. The conversion buys the documented layout and a typed language, not test
coverage; the Definition of Ready's stated-cost line continues to apply, and widening any gate
to reach the subfolder is its own decision, not this slice's.

## Open questions

- Node strip-types runs erasable TypeScript only, and the version floor matters: measured
  working on node v24; the floor for the flag is v22.6. Does anything pin the node version a
  contributor's hooks run under?
- Do the two scripts share their hook-JSON extraction, and where does shared code live when
  each skill's subfolder is its own island?
- The reverted-then-refiled reference-check question rides along: does the conversion make the
  shell-comments gap moot, or do the new TypeScript files' comments stay equally unscanned
  under the `.claude/**` exclusions?
