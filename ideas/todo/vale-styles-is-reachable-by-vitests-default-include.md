---
name: vale-styles-is-reachable-by-vitests-default-include
title: Exclude vale-styles/ from vitest, before an allowlist entry makes the gap matter
created: 2026-09-10
---

## Context

`lint-jsdoc-with-vale` added `vale-styles/`, a new tracked top-level directory. `vite.config.ts`'s
`sharedExclude` does not name it.

That array exists because vitest's `unit` project inherits the **unrooted** default include,
`**/*.{test,spec}.?(c|m)[jt]s?(x)`, and nothing above subtracts it. So any directory in the repo is
reachable unless something in that array excludes it by name. The comment block in `vite.config.ts`
records exactly this, along with the throwaway probes that measured it for `.claude/` and `ideas/`.
The live list names `scripts/`, `ideas/`, `.claude/`, `rules/`, `rule-tests/`, `.stryker-tmp*/`,
`.features-gen/` and `.vale/`. `vale-styles/` is absent.

Found by `hardener` at the slice's merge-protocol step 3.

## Complication

**The gap is inert today, and it was verified rather than assumed.** `npx vitest list` collects
nothing from `vale-styles/`, and the total collected matches the coverage run exactly. The fixtures
are named `*.bad.ts` and `*.good.ts`, which cannot match the default include. So nothing is wrong
right now.

**It matters because of what it is paired with, not because of what it does.** `vite.config.ts`'s own
comments describe the dangerous pairing: a directory on the mutation-invariance **allow list** whose
contents are **not** excluded from vitest. The `vitest-exclude` tier of that allowlist is sound
precisely because the exclusion is real — an entry secured that way is verified against every vitest
project's own `exclude`.

`vale-styles/**` is currently on **neither** the allow list nor the absent list, so it cannot earn a
stage-5 skip and the pairing does not exist. **The hazard arms the moment someone adds it to the
allowlist**, which is a plausible next step: it is a tracked directory of rule and fixture files, and
`rules/` and `rule-tests/` are both already allowlisted under the `vitest-exclude` tier.

A file named `vale-styles/something.test.ts` would then be collected by the `unit` project while a
`vale-styles/`-only diff claimed mutation invariance. That is the fail-open direction the whole
allowlist is built against.

## Sketch

One line in `sharedExclude`. The work is the verification, not the edit.

The `vite.config.ts` comment records the method: a throwaway `__probe.test.ts` placed in the
directory, confirmed collected before the exclusion and not collected after. Use it rather than
trusting the glob, and delete the probe — `reference-check` carries an allow-marker for exactly that
never-committed filename, which is itself a precedent for how to do this.

Land it **before**, not with, any change that adds `vale-styles/**` to `mutation-invariance.config.json`.
The allowlist's `vitest-exclude` tier verifies against the exclusion, so the order matters.

## Touches

`vite.config.ts` and its comment block. Possibly `mutation-invariance.config.json` and
`.claude/agents/articles/mutation-testing.rationale.md`, if the same slice then adds the allowlist
entry this unblocks — but see the ordering note above.

`vite.config.ts` is on the mutation-invariance **absent** list, so this re-arms the full mutation run
by construction.

## Open questions

- **Should the allowlist entry follow in the same slice, or wait?** Adding `vale-styles/**` to the
  allowlist is the thing this unblocks, and it is what makes a `vale-styles/`-only diff cheap to land.
  Doing both at once is defensible if the ordering within the slice is right.
- **Is a name-by-name exclusion list the right shape at all?** Eight entries now, each added when
  someone noticed. The same fail-open argument applies to the ninth directory nobody has thought of.
  A rooted include for the `unit` project would invert the default, and that is a larger change with
  its own risks.
- **Does anything else added recently have the same gap?** This was found by inspection during a gate,
  not by a check. Nothing enumerates tracked top-level directories against that array.
