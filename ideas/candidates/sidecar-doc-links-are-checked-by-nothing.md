---
name: sidecar-doc-links-are-checked-by-nothing
title: Extend agent-doc-check to verify that doc references pointing outside .claude resolve
created: 2026-09-06
---

## Context

`comment-docs-are-invisible-at-call-sites` introduces a sidecar tier: when an
abstraction needs more than the hover budget, the depth moves to a
`<module>.md` beside the source and the JSDoc points at it with
`@see ./cellTiles.md`.

**Nothing verifies that path.** `agent-doc-check`'s doc-file set is
`CLAUDE.md` plus `globSync('.claude/**/*.md')` — `run.ts:66-67` — so a file
under `src/` is outside every check it performs. A sidecar can be renamed,
moved during a module split, or never created, and the reference keeps pointing
at nothing while the gate stays green.

This is the failure mode the repo already knows by name: a check that no longer
encodes the invariant it was written for. Check 5 exists precisely because
`rules/<id>.yml` paths named in prose can rot — the same hazard, one directory
over.

The asymmetry that makes it worth fixing rather than tolerating: a broken
sidecar link fails **open**. The agent that follows it finds nothing, falls
back to reading the implementation, and the whole point of the tier is lost
silently — no error, no finding, just a quiet return to the expensive path.

## Sketch

A sixth check in `scripts/agent-doc-check/`, in the shape the other five
already have — a pure `decide()` over parsed input, I/O isolated to `run.ts`,
one file per parsing concern.

Scan `src/**` and `scripts/**` for `@see`/`{@link}` references naming a
relative Markdown path, resolve each against the referring file's directory,
and report any that do not exist — attributed to the file the reference was
found in, the way check 5 attributes a `rules/<id>.yml` mention.

The reverse direction is worth considering too and is a separate question: a
sidecar `.md` that no JSDoc points at is unreachable by the tier's own rules,
and is the same orphan shape as a rule with no fixture.

## Touches

`scripts/agent-doc-check/` (a new parsing module plus a `checks.ts` entry), its
unit tests, and CLAUDE.md's description of the checker — which enumerates the
checks by number and says "Five binary facts", so the count moves in prose as
well as in code.

## Open questions

- **Is it premature?** The sidecar tier does not exist yet, and may not survive
  contact with its first real case. Building the checker before the thing it
  checks would be authoring a gate for a convention that has not been proven —
  which is the same mistake as an unratified ast-grep rule. Wait for the first
  sidecar to land.
- **Scope: any relative link in a doc comment, or Markdown only?** A
  `@see ./camera.ts` is also a resolvable path and also rots. Widening is
  cheap; deciding whether a broken code reference is the same severity is not.
- **Does the reverse check have an opt-out problem?** `ast-grep-rule-check`
  needed a reason-required marker for a rule authored before its target
  existed. An orphan-sidecar check would need the same escape hatch for a doc
  written ahead of the code, which is a real workflow.
